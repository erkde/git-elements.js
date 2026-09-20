import { GitDiffElement } from "./git-diff.js";
import { gitShowStyleSheet } from "./git-show.css.js";
import {
  loadRepositoryShow,
  type GitShowCommit,
  type GitShowResult,
} from "../lib/repository-show.js";

/**
 * Render one hosted repository revision's commit metadata and patch.
 *
 * @attr {string} repository - Public repository URL.
 * @attr {string} revision - Branch, tag, or full commit ID to show.
 * @attr {boolean} line-numbers - Show old and new line-number gutters in the patch.
 * @attr {boolean} shortstat - Show file, insertion, and deletion totals instead of the patch.
 * @attr {"light" | "dark"} theme - Override the operating-system color preference.
 *
 * @slot loading - Content shown when loading exceeds the configured delay.
 * @slot error - Content shown when the commit cannot be loaded.
 *
 * @fires {Event} load - Fired after the commit and patch load and render.
 * @fires {Event} error - Fired when the commit or patch cannot be loaded.
 *
 * @cssprop [--git-show-bg=#f5f5f4] - Component background color.
 * @cssprop [--git-show-text-color=#292524] - Primary text color.
 * @cssprop [--git-show-border-color=#d6d3d1] - Border color.
 * @cssprop [--git-show-muted-color=#78716c] - Commit label color.
 * @cssprop [--git-show-link-color=#006d8f] - Commit hash link color.
 * @cssprop [--git-show-font-family=ui-monospace, monospace] - Component font family.
 * @cssprop [--git-show-font-size=12px] - Component font size.
 * @cssprop [--git-show-line-height=20px] - Component line height.
 * @cssprop [--git-show-loading-delay=150ms] - Delay before slotted loading content appears.
 *
 * @csspart container - Container for the commit metadata and patch.
 * @csspart header - Commit metadata header.
 * @csspart hash - Full commit hash and link.
 * @csspart author - Commit author identity.
 * @csspart date - Author date.
 * @csspart message - Full commit message.
 * @csspart subject - First line of the commit message.
 * @csspart body - Remaining commit message body.
 * @csspart diff - Nested `<git-diff>` element.
 * @csspart loading - Loading-state container.
 * @csspart error - Error-state container.
 */
export class GitShowElement extends HTMLElement {
  static observedAttributes = ["repository", "revision", "line-numbers", "shortstat", "theme"];

  private _commit: GitShowCommit | null = null;
  private _patch = "";
  private _container: HTMLElement;
  private _hash: HTMLAnchorElement;
  private _author: HTMLSpanElement;
  private _date: HTMLTimeElement;
  private _subject: HTMLDivElement;
  private _body: HTMLDivElement;
  private _diff: GitDiffElement;
  private _loadingState: HTMLDivElement;
  private _errorState: HTMLDivElement;
  private _sourceRequest: AbortController | null = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [gitShowStyleSheet];

    this._container = document.createElement("article");
    this._container.className = "commit-show";
    this._container.setAttribute("part", "container");
    this._container.hidden = true;

    const header = document.createElement("header");
    header.className = "commit-header";
    header.setAttribute("part", "header");

    const commitLine = document.createElement("div");
    commitLine.className = "commit-line";
    const commitLabel = document.createElement("span");
    commitLabel.className = "label";
    commitLabel.textContent = "commit";
    this._hash = document.createElement("a");
    this._hash.className = "commit-hash";
    this._hash.setAttribute("part", "hash");
    commitLine.append(commitLabel, this._hash);

    const authorLine = document.createElement("div");
    authorLine.className = "identity-line";
    const authorLabel = document.createElement("span");
    authorLabel.className = "label";
    authorLabel.textContent = "Author:";
    this._author = document.createElement("span");
    this._author.setAttribute("part", "author");
    authorLine.append(authorLabel, this._author);

    const dateLine = document.createElement("div");
    dateLine.className = "identity-line";
    const dateLabel = document.createElement("span");
    dateLabel.className = "label";
    dateLabel.textContent = "Date:";
    this._date = document.createElement("time");
    this._date.setAttribute("part", "date");
    dateLine.append(dateLabel, this._date);

    const message = document.createElement("div");
    message.className = "commit-message";
    message.setAttribute("part", "message");
    this._subject = document.createElement("div");
    this._subject.className = "commit-subject";
    this._subject.setAttribute("part", "subject");
    this._body = document.createElement("div");
    this._body.className = "commit-body";
    this._body.setAttribute("part", "body");
    message.append(this._subject, this._body);
    header.append(commitLine, authorLine, dateLine, message);

    this._diff = document.createElement("git-diff") as GitDiffElement;
    this._diff.setAttribute("part", "diff");
    this._container.append(header, this._diff);

    this._loadingState = this.createResourceState("loading", "status");
    this._errorState = this.createResourceState("error", "alert");
    shadow.append(this._container, this._loadingState, this._errorState);
  }

  connectedCallback(): void {
    this.syncDiffPresentation();
    void this.load();
  }

  disconnectedCallback(): void {
    this._sourceRequest?.abort();
    this.removeAttribute("aria-busy");
    this.showResourceState(null);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected) {
      return;
    }
    if (name === "line-numbers" || name === "shortstat" || name === "theme") {
      this.syncDiffPresentation();
      return;
    }
    void this.load();
  }

  /** Public repository URL containing the revision. */
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

  /** Branch, tag, or full commit ID currently selected. */
  get revision(): string {
    return this.getAttribute("revision") ?? "";
  }

  set revision(value: string) {
    if (value) {
      this.setAttribute("revision", value);
    } else {
      this.removeAttribute("revision");
    }
  }

  /** Whether old and new line-number gutters are shown in the patch. */
  get lineNumbers(): boolean {
    return this.hasAttribute("line-numbers");
  }

  set lineNumbers(value: boolean) {
    this.toggleAttribute("line-numbers", value);
  }

  /** Whether file, insertion, and deletion totals replace the patch. */
  get shortStat(): boolean {
    return this.hasAttribute("shortstat");
  }

  set shortStat(value: boolean) {
    this.toggleAttribute("shortstat", value);
  }

  /** Normalized metadata for the commit currently displayed. */
  get commit(): GitShowCommit | null {
    return this._commit;
  }

  /** Raw unified diff text for the commit currently displayed. */
  get patch(): string {
    return this._patch;
  }

  /** Bypass cached data and request the commit and patch again. */
  async reload(): Promise<void> {
    await this.load(true);
  }

  private async load(reload = false): Promise<void> {
    this._sourceRequest?.abort();
    if (!this.repository || !this.revision) {
      this._sourceRequest = null;
      this.clear();
      this.removeAttribute("aria-busy");
      this.showResourceState(null);
      return;
    }

    const request = new AbortController();
    this._sourceRequest = request;
    this.clear();
    this.setAttribute("aria-busy", "true");
    this.showResourceState("loading");

    try {
      const result = await loadRepositoryShow(
        { repository: this.repository, revision: this.revision },
        { signal: request.signal, reload },
      );
      if (!request.signal.aborted) {
        this.render(result);
        this.removeAttribute("aria-busy");
        this.showResourceState(null);
        this.dispatchEvent(new Event("load"));
      }
    } catch (error) {
      if (!request.signal.aborted) {
        this.clear();
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

  private clear(): void {
    this._commit = null;
    this._patch = "";
    this._container.hidden = true;
    if (this._diff instanceof GitDiffElement) {
      this._diff.patch = "";
    }
  }

  private render(result: GitShowResult): void {
    if (!(this._diff instanceof GitDiffElement)) {
      throw new Error("<git-show> requires <git-diff> to be registered before it connects.");
    }

    this._commit = result.commit;
    this._patch = result.patch;
    this._hash.textContent = result.commit.hash;
    this._hash.href = result.commit.href;
    this._author.textContent = formatIdentity(result.commit.author);
    this._date.dateTime = result.commit.author.date ?? "";
    this._date.textContent = formatDate(result.commit.author.date);

    const [subject = "", ...body] = result.commit.message.replace(/\s+$/, "").split(/\r?\n/);
    this._subject.textContent = subject;
    this._body.textContent = body.join("\n").replace(/^\s+/, "");
    this._diff.patch = result.patch;
    this.syncDiffPresentation();
    this._container.hidden = false;
  }

  private syncDiffPresentation(): void {
    this._diff.toggleAttribute("line-numbers", this.lineNumbers);
    this._diff.toggleAttribute("shortstat", this.shortStat);
    const theme = this.getAttribute("theme");
    if (theme) {
      this._diff.setAttribute("theme", theme);
    } else {
      this._diff.removeAttribute("theme");
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
}

function formatIdentity(identity: GitShowCommit["author"]): string {
  return identity.email ? `${identity.name} <${identity.email}>` : identity.name;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date
    .toISOString()
    .replace("T", " ")
    .replace(/\.000Z$/, " UTC");
}

export type { GitShowCommit, GitShowResult } from "../lib/repository-show.js";
