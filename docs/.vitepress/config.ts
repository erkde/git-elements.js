import { defineConfig } from "vitepress";

export default defineConfig({
  title: "git-elements.js",
  description: "Web components for presenting Git command output on the web.",
  base: process.env.GITHUB_ACTIONS === "true" ? "/git-elements.js/" : "/",
  outDir: "../demo-dist",
  lastUpdated: true,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith("git-"),
      },
    },
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Components", link: "/components/git-diff" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/getting-started" },
          { text: "Loading and caching", link: "/guides/loading-and-caching" },
          { text: "Styling", link: "/guides/styling" },
        ],
      },
      {
        text: "Components",
        items: [
          { text: "&lt;git-diff&gt;", link: "/components/git-diff" },
          { text: "&lt;git-log&gt;", link: "/components/git-log" },
          { text: "&lt;git-show&gt;", link: "/components/git-show" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/erkde/git-elements.js" }],
    search: {
      provider: "local",
    },
    editLink: {
      pattern: "https://github.com/erkde/git-elements.js/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
    outline: {
      level: [2, 3],
    },
    footer: {
      message: "Released under the Apache-2.0 License.",
    },
  },
});
