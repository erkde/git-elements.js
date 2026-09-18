import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import "./custom.css";

export default {
  extends: DefaultTheme,
  async enhanceApp() {
    if (!import.meta.env.SSR) {
      const { GitDiffElement, GitLogElement } = await import("../../../src/index.ts");
      if (!customElements.get("git-diff")) {
        customElements.define("git-diff", GitDiffElement);
      }
      if (!customElements.get("git-log")) {
        customElements.define("git-log", GitLogElement);
      }
    }
  },
} satisfies Theme;
