import { parseDiff, type ParsedDiff, type DiffLine } from "../lib/diff-parser.js";
import { gitDiffStyleSheet } from "./git-diff.css.js";

/**
 * Render uncolored unified diff text as an accessible, themeable file-by-file view.
 *
 * @attr {string} src - Browser-accessible URL of a unified diff to fetch and render.
 * @attr {boolean} line-numbers - Show old and new line-number gutters.
 * @attr {"light" | "dark"} theme - Override the operating-system color preference.
 *
 * @slot loading - Content shown when a `src` request exceeds the loading delay.
 * @slot error - Content shown when a `src` request fails.
 *
 * @fires {Event} load - Fired after a `src` patch has loaded and rendered.
 * @fires {Event} error - Fired when a `src` patch cannot be loaded.
 *
 * @cssprop [--git-diff-bg=#f5f5f4] - Component background color.
 * @cssprop [--git-diff-text-color=#292524] - Primary text color.
 * @cssprop [--git-diff-border-color=#d6d3d1] - Separator and gutter border color.
 * @cssprop [--git-diff-muted-color=#78716c] - Muted metadata and line-number color.
 * @cssprop [--git-diff-add-text=#167044] - Added-line text color.
 * @cssprop [--git-diff-del-text=#b4232c] - Deleted-line text color.
 * @cssprop [--git-diff-hunk-text=#006d8f] - Hunk-header text color.
 * @cssprop [--git-diff-meta-text=#806000] - File metadata and status color.
 * @cssprop [--git-diff-hover-bg=rgba(41, 37, 36, 0.045)] - Line hover background.
 * @cssprop [--git-diff-font-family=ui-monospace, monospace] - Component font family.
 * @cssprop [--git-diff-font-size=12px] - Component font size.
 * @cssprop [--git-diff-line-height=20px] - Diff line height.
 * @cssprop [--git-diff-loading-delay=150ms] - Delay before slotted loading content appears.
 *
 * @csspart container - Container for the rendered file diffs.
 * @csspart loading - Loading-state container.
 * @csspart error - Error-state container.
 * @csspart file - A rendered file diff.
 * @csspart file-modified - A modified file diff.
 * @csspart file-added - An added file diff.
 * @csspart file-deleted - A deleted file diff.
 * @csspart file-renamed - A renamed file diff.
 * @csspart file-copied - A copied file diff.
 * @csspart file-header - Header containing a file path and optional status.
 * @csspart file-path - Displayed file path.
 * @csspart status - File status label.
 * @csspart status-added - Added-file status label.
 * @csspart status-deleted - Deleted-file status label.
 * @csspart status-renamed - Renamed-file status label.
 * @csspart status-copied - Copied-file status label.
 * @csspart file-meta - File mode, similarity, or binary metadata.
 * @csspart table - Table containing diff hunks and lines.
 * @csspart row - A diff row.
 * @csspart row-context - An unchanged context row.
 * @csspart row-addition - An added line row.
 * @csspart row-deletion - A deleted line row.
 * @csspart hunk-header - A hunk header row.
 * @csspart line-num - An old or new line-number cell.
 * @csspart old-line-num - An old line-number cell.
 * @csspart new-line-num - A new line-number cell.
 * @csspart content - A diff-content cell.
 */
export class GitDiffElement extends HTMLElement {
  static observedAttributes = ["src"];

  private _patch = "";
  private _parsedDiffs: ParsedDiff[] = [];
  private _container: HTMLDivElement;
  private _loadingState: HTMLDivElement;
  private _errorState: HTMLDivElement;
  private _sourceRequest: AbortController | null = null;
  private _inlinePatchObserver: MutationObserver;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [gitDiffStyleSheet];

    this._container = document.createElement("div");
    this._container.setAttribute("part", "container");

    this._loadingState = this.createResourceState("loading", "status");
    this._errorState = this.createResourceState("error", "alert");

    shadow.append(this._container, this._loadingState, this._errorState);

    this._inlinePatchObserver = new MutationObserver(() => {
      if (!this.src) {
        this.loadInlinePatch();
      }
    });
  }

  connectedCallback(): void {
    this._inlinePatchObserver.observe(this, {
      attributes: true,
      attributeFilter: ["type"],
      childList: true,
      characterData: true,
      subtree: true,
    });

    if (this.src) {
      void this.loadSource();
    } else if (!this.patch) {
      this.loadInlinePatch();
    }
  }

  disconnectedCallback(): void {
    this._sourceRequest?.abort();
    this.removeAttribute("aria-busy");
    this.showResourceState(null);
    this._inlinePatchObserver.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== "src" || oldValue === newValue || !this.isConnected) {
      return;
    }

    if (newValue === null) {
      this._sourceRequest?.abort();
      if (!this.loadInlinePatch()) {
        this.patch = "";
      }
      return;
    }

    void this.loadSource(newValue);
  }

  /** URL of the unified diff loaded by the element. */
  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    if (value) {
      this.setAttribute("src", value);
    } else {
      this.removeAttribute("src");
    }
  }

  /** Whether old and new line-number gutters are shown. */
  get lineNumbers(): boolean {
    return this.hasAttribute("line-numbers");
  }

  set lineNumbers(value: boolean) {
    this.toggleAttribute("line-numbers", value);
  }

  /** Raw unified diff text currently rendered by the element. */
  get patch(): string {
    return this._patch;
  }

  set patch(value: string) {
    this._sourceRequest?.abort();
    this._sourceRequest = null;
    this.removeAttribute("aria-busy");
    this.showResourceState(null);
    this.setPatch(value);
  }

  private setPatch(value: string): void {
    this._patch = value;
    this._parsedDiffs = parseDiff(value);
    this.render();
  }

  /** Parsed files, hunks, line numbers, and metadata for the current patch. */
  get parsedDiffs(): ParsedDiff[] {
    return this._parsedDiffs;
  }

  private loadInlinePatch(): boolean {
    const script = Array.from(this.children).find((child): child is HTMLScriptElement => {
      if (!(child instanceof HTMLScriptElement)) {
        return false;
      }

      const type = child.type.trim().toLowerCase();
      return type === "text/plain" || type.startsWith("text/plain;");
    });

    if (!script) {
      return false;
    }

    try {
      this.patch = this.readInlinePatch(script.textContent ?? "");
    } catch (error) {
      this.patch = "";
      console.error(error);
    }

    return true;
  }

  private readInlinePatch(content: string): string {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    while (lines[0]?.trim() === "") {
      lines.shift();
    }
    while (lines.at(-1)?.trim() === "") {
      lines.pop();
    }

    const indentation = lines.reduce<number | null>((minimum, line) => {
      if (!line.trim()) {
        return minimum;
      }

      const lineIndentation = line.length - line.trimStart().length;
      return minimum === null ? lineIndentation : Math.min(minimum, lineIndentation);
    }, null);

    return lines.map((line) => line.slice(indentation ?? 0)).join("\n");
  }

  private async loadSource(src = this.src): Promise<void> {
    this._sourceRequest?.abort();
    if (!src) {
      this._sourceRequest = null;
      return;
    }

    const request = new AbortController();
    this._sourceRequest = request;
    this._patch = "";
    this._parsedDiffs = [];
    this.setAttribute("aria-busy", "true");
    this._container.replaceChildren();
    this.showResourceState("loading");

    try {
      const response = await fetch(src, { signal: request.signal });
      if (!response.ok) {
        throw new Error(
          `Unable to load diff from ${src}: ${response.status} ${response.statusText}`,
        );
      }

      const patch = await response.text();
      if (!request.signal.aborted) {
        this.setPatch(patch);
        this.removeAttribute("aria-busy");
        this.showResourceState(null);
        this.dispatchEvent(new Event("load"));
      }
    } catch (error) {
      if (!request.signal.aborted) {
        this._patch = "";
        this._parsedDiffs = [];
        this.removeAttribute("aria-busy");
        this._container.replaceChildren();
        this.showResourceState("error");
        this.dispatchEvent(new Event("error"));
        console.error(error);
      }
    } finally {
      if (this._sourceRequest === request) {
        this._sourceRequest = null;
      }
    }
  }

  private createResourceState(type: "loading" | "error", role: "status" | "alert"): HTMLDivElement {
    const state = document.createElement("div");
    state.className = `resource-state resource-${type}`;
    state.setAttribute("part", type);
    state.setAttribute("role", role);
    state.hidden = true;

    const slot = document.createElement("slot");
    slot.name = type;
    state.appendChild(slot);

    return state;
  }

  private showResourceState(type: "loading" | "error" | null): void {
    this._loadingState.hidden = type !== "loading";
    this._errorState.hidden = type !== "error";
  }

  private render(): void {
    this._container.replaceChildren();

    if (this._parsedDiffs.length === 0) {
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const file of this._parsedDiffs) {
      const wrapper = document.createElement("article");
      wrapper.className = `file-diff file-${file.status}`;
      wrapper.setAttribute("part", `file file-${file.status}`);

      if (file.oldPath || file.newPath) {
        const header = document.createElement("header");
        header.className = "file-header";
        header.setAttribute("part", "file-header");

        const path = document.createElement("span");
        path.className = "file-path";
        path.setAttribute("part", "file-path");
        path.textContent =
          file.oldPath && file.newPath && file.oldPath !== file.newPath
            ? `${file.oldPath} → ${file.newPath}`
            : (file.newPath ?? file.oldPath ?? "");
        header.appendChild(path);

        if (file.status !== "modified") {
          const status = document.createElement("span");
          status.className = `file-status status-${file.status}`;
          status.setAttribute("part", `status status-${file.status}`);
          status.textContent = file.status;
          header.appendChild(status);
        }

        wrapper.appendChild(header);
      }

      const metadata: string[] = [];
      if (file.oldMode && file.newMode && file.oldMode !== file.newMode) {
        metadata.push(`Mode changed ${file.oldMode} → ${file.newMode}`);
      } else if (file.status === "added" && file.newMode) {
        metadata.push(`Mode ${file.newMode}`);
      } else if (file.status === "deleted" && file.oldMode) {
        metadata.push(`Mode ${file.oldMode}`);
      }
      if (file.similarity !== null) {
        metadata.push(`${file.similarity}% similarity`);
      }
      if (file.isBinary) {
        metadata.push(file.binaryMessage === "GIT binary patch" ? "Binary patch" : "Binary file");
      }

      if (metadata.length > 0) {
        const details = document.createElement("div");
        details.className = "file-meta";
        details.setAttribute("part", "file-meta");
        for (const item of metadata) {
          const detail = document.createElement("span");
          detail.className = "meta-item";
          detail.textContent = item;
          details.appendChild(detail);
        }
        wrapper.appendChild(details);
      }

      if (file.hunks.length === 0) {
        fragment.appendChild(wrapper);
        continue;
      }

      const table = document.createElement("table");
      table.className = "diff-table";
      table.setAttribute("part", "table");

      const tbody = document.createElement("tbody");

      for (const hunk of file.hunks) {
        const hunkRow = document.createElement("tr");
        hunkRow.className = "row-hunk";
        hunkRow.setAttribute("part", "row hunk-header");

        hunkRow.innerHTML = `
          <td class="line-num old-line-num" part="line-num old-line-num"></td>
          <td class="line-num new-line-num" part="line-num new-line-num"></td>
          <td class="line-content" part="content"></td>
        `;
        hunkRow.querySelector(".line-content")!.textContent = hunk.header;
        tbody.appendChild(hunkRow);

        for (const line of hunk.lines) {
          tbody.appendChild(this.createLineRow(line));
        }
      }

      table.appendChild(tbody);
      wrapper.appendChild(table);
      fragment.appendChild(wrapper);
    }

    this._container.appendChild(fragment);
  }

  private createLineRow(line: DiffLine): HTMLTableRowElement {
    const tr = document.createElement("tr");
    tr.className = `diff-row row-${line.type}`;
    tr.setAttribute("part", `row row-${line.type}`);

    const tdOld = document.createElement("td");
    tdOld.className = "line-num old-line-num";
    tdOld.setAttribute("part", "line-num old-line-num");
    tdOld.textContent = line.oldLineNumber !== null ? String(line.oldLineNumber) : "";

    const tdNew = document.createElement("td");
    tdNew.className = "line-num new-line-num";
    tdNew.setAttribute("part", "line-num new-line-num");
    tdNew.textContent = line.newLineNumber !== null ? String(line.newLineNumber) : "";

    const tdContent = document.createElement("td");
    tdContent.className = "line-content";
    tdContent.setAttribute("part", "content");

    const prefix = line.type === "addition" ? "+" : line.type === "deletion" ? "-" : " ";
    tdContent.textContent = `${prefix}${line.content}`;

    tr.append(tdOld, tdNew, tdContent);
    return tr;
  }
}
