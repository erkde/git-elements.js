import { GitDiffElement } from "./components/git-diff.js";
import { GitLogElement } from "./components/git-log.js";
import { GitShowElement } from "./components/git-show.js";

if (!customElements.get("git-diff")) {
  customElements.define("git-diff", GitDiffElement);
}

if (!customElements.get("git-log")) {
  customElements.define("git-log", GitLogElement);
}

if (!customElements.get("git-show")) {
  customElements.define("git-show", GitShowElement);
}

export { GitDiffElement } from "./components/git-diff.js";
export { GitLogElement, type GitLogCommit } from "./components/git-log.js";
export { GitShowElement, type GitShowCommit, type GitShowResult } from "./components/git-show.js";
