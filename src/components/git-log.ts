import { gitLogStyleSheet } from "./git-log.css.js";
import {
  loadRepositoryLog,
  type GitLogCommit,
  type RepositoryLogRequest,
} from "../lib/repository-log.js";

const DEFAULT_MAX_COUNT = 30;

/**
 * Render commit history from a public GitHub, GitLab.com, or Bitbucket Cloud repository.
 *
 * @attr {string} repository - Public repository URL.
 * @attr {string} revisions - Branch, tag, commit ID, or two-dot or three-dot revision set.
 * @attr {number} max-count - Maximum number of commits to display, from 1 to 100.
 * @attr {boolean} left-right - Mark each side of a symmetric three-dot revision set.
 * @attr {boolean} oneline - Use a compact one-line entry for each commit.
 * @attr {"light" | "dark"} theme - Override the operating-system color preference.
 *
 * @slot loading - Content shown when loading exceeds the configured delay.
 * @slot error - Content shown when repository history cannot be loaded.
 *
 * @fires {Event} load - Fired after repository history loads and renders.
 * @fires {Event} error - Fired when repository history cannot be loaded.
 *
 * @cssprop [--git-log-bg=#f5f5f4] - Component background color.
 * @cssprop [--git-log-text-color=#292524] - Primary text color.
 * @cssprop [--git-log-border-color=#d6d3d1] - Border color.
 * @cssprop [--git-log-muted-color=#78716c] - Muted author, date, and side-marker color.
 * @cssprop [--git-log-link-color=#006d8f] - Commit hash link color.
 * @cssprop [--git-log-left-color=#b4232c] - Left revision marker color.
 * @cssprop [--git-log-right-color=#167044] - Right revision marker color.
 * @cssprop [--git-log-hover-bg=rgba(41, 37, 36, 0.045)] - Commit hover background.
 * @cssprop [--git-log-font-family=ui-monospace, monospace] - Component font family.
 * @cssprop [--git-log-font-size=12px] - Component font size.
 * @cssprop [--git-log-line-height=20px] - Commit line height.
 * @cssprop [--git-log-loading-delay=150ms] - Delay before slotted loading content appears.
 *
 * @csspart list - Ordered list containing the commits.
 * @csspart commit - A rendered commit.
 * @csspart side - Revision-side marker.
 * @csspart side-left - Marker for a commit unique to the left revision.
 * @csspart side-right - Marker for a commit unique to the right revision.
 * @csspart hash - Abbreviated commit hash.
 * @csspart message - First line of the commit message.
 * @csspart author - Commit author name.
 * @csspart date - Committer date.
 * @csspart loading - Loading-state container.
 * @csspart error - Error-state container.
 */
export class GitLogElement extends HTMLElement {
  static observedAttributes = ["repository", "revisions", "max-count", "left-right", "oneline"];

  private _commits: GitLogCommit[] = [];
  private _container: HTMLOListElement;
  private _loadingState: HTMLDivElement;
  private _errorState: HTMLDivElement;
  private _sourceRequest: AbortController | null = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [gitLogStyleSheet];

    this._container = document.createElement("ol");
    this._container.className = "commit-list";
    this._container.setAttribute("part", "list");

    this._loadingState = this.createResourceState("loading", "status");
    this._errorState = this.createResourceState("error", "alert");
    shadow.append(this._container, this._loadingState, this._errorState);
  }

  connectedCallback(): void {
    void this.load();
  }

  disconnectedCallback(): void {
    this._sourceRequest?.abort();
    this.removeAttribute("aria-busy");
    this.showResourceState(null);
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected) {
      return;
    }
    if (_name === "oneline") {
      this.render();
      return;
    }
    void this.load();
  }

  /** Public repository URL used to load commit history. */
  get repository(): string {
    return this.getAttribute("repository") ?? "";
  }

  set repository(value: string) {
    if (value) {
      this.setAttribute("repository", value);
    } else {
      this.removeAttribute("repository");
    }
  }

  /** Branch, tag, commit ID, or two-dot or three-dot revision set. */
  get revisions(): string {
    return this.getAttribute("revisions") ?? "";
  }

  set revisions(value: string) {
    if (value) {
      this.setAttribute("revisions", value);
    } else {
      this.removeAttribute("revisions");
    }
  }

  /** Maximum number of commits to display, from 1 to 100. */
  get maxCount(): number {
    const value = Number(this.getAttribute("max-count") ?? DEFAULT_MAX_COUNT);
    return Number.isInteger(value) && value >= 1 && value <= 100 ? value : DEFAULT_MAX_COUNT;
  }

  set maxCount(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new RangeError("maxCount must be an integer from 1 to 100.");
    }
    this.setAttribute("max-count", String(value));
  }

  /** Whether symmetric three-dot results identify their revision side. */
  get leftRight(): boolean {
    return this.hasAttribute("left-right");
  }

  set leftRight(value: boolean) {
    this.toggleAttribute("left-right", value);
  }

  /** Whether to use the compact one-line commit format. */
  get oneline(): boolean {
    return this.hasAttribute("oneline");
  }

  set oneline(value: boolean) {
    this.toggleAttribute("oneline", value);
  }

  /** Normalized commits currently displayed by the element. */
  get commits(): readonly GitLogCommit[] {
    return this._commits;
  }

  /** Bypass cached data and request the log again. */
  async reload(): Promise<void> {
    await this.load(true);
  }

  private async load(reload = false): Promise<void> {
    this._sourceRequest?.abort();
    if (!this.repository || !this.revisions) {
      this._sourceRequest = null;
      this._commits = [];
      this._container.replaceChildren();
      this.removeAttribute("aria-busy");
      this.showResourceState(null);
      return;
    }

    const request = new AbortController();
    this._sourceRequest = request;
    this._commits = [];
    this._container.replaceChildren();
    this.setAttribute("aria-busy", "true");
    this.showResourceState("loading");

    const input: RepositoryLogRequest = {
      repository: this.repository,
      revisions: this.revisions,
      maxCount: this.maxCount,
      leftRight: this.leftRight,
    };

    try {
      const commits = await loadRepositoryLog(input, { signal: request.signal, reload });
      if (!request.signal.aborted) {
        this._commits = commits;
        this.render();
        this.removeAttribute("aria-busy");
        this.showResourceState(null);
        this.dispatchEvent(new Event("load"));
      }
    } catch (error) {
      if (!request.signal.aborted) {
        this._commits = [];
        this._container.replaceChildren();
        this.removeAttribute("aria-busy");
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
    const fragment = document.createDocumentFragment();
    for (const commit of this._commits) {
      const item = document.createElement("li");
      item.className = "commit";
      item.setAttribute("part", "commit");

      const side = document.createElement("span");
      side.className = `commit-side${commit.side ? ` side-${commit.side}` : ""}`;
      side.setAttribute("part", `side${commit.side ? ` side-${commit.side}` : ""}`);
      side.textContent = commit.side === "left" ? "<" : commit.side === "right" ? ">" : "";
      if (commit.side) {
        side.setAttribute("aria-label", `Only on the ${commit.side} revision`);
      }

      const hash = document.createElement(commit.href ? "a" : "span");
      hash.className = "commit-hash";
      hash.setAttribute("part", "hash");
      hash.textContent = this.oneline ? commit.hash.slice(0, 7) : `commit ${commit.hash}`;
      hash.title = commit.hash;
      if (hash instanceof HTMLAnchorElement) {
        hash.href = commit.href;
      }

      const message = document.createElement("span");
      message.className = "commit-message";
      message.setAttribute("part", "message");
      message.textContent = this.oneline
        ? (commit.message.split(/\r?\n/, 1)[0] ?? "")
        : commit.message;
      message.title = commit.message;

      const author = document.createElement("span");
      author.className = "commit-author";
      author.setAttribute("part", "author");
      author.textContent = this.oneline
        ? commit.author.name
        : `Author: ${commit.author.name}${commit.author.email ? ` <${commit.author.email}>` : ""}`;

      const time = document.createElement("time");
      time.className = "commit-date";
      time.setAttribute("part", "date");
      time.dateTime = commit.committer.date ?? "";
      time.textContent = this.oneline
        ? formatDate(commit.committer.date)
        : `Date: ${formatDate(commit.committer.date)}`;

      if (this.oneline) {
        item.append(side, hash, message, author, time);
      } else {
        item.append(side, hash, author, time, message);
      }
      item.classList.toggle("commit-full", !this.oneline);
      fragment.appendChild(item);
    }
    this._container.replaceChildren(fragment);
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

export type { GitLogCommit } from "../lib/repository-log.js";
