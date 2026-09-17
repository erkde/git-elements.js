import { GitDiffElement } from "./components/git-diff.js";

if (!customElements.get("git-diff")) {
  customElements.define("git-diff", GitDiffElement);
}

export { GitDiffElement } from "./components/git-diff.js";
