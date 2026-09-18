import { GitDiffElement } from "./components/git-diff.js";
import { GitLogElement } from "./components/git-log.js";

if (!customElements.get("git-diff")) {
  customElements.define("git-diff", GitDiffElement);
}

if (!customElements.get("git-log")) {
  customElements.define("git-log", GitLogElement);
}

export { GitDiffElement } from "./components/git-diff.js";
export { GitLogElement, type GitLogCommit } from "./components/git-log.js";
