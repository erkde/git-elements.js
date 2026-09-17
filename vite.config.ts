import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/git-elements.js/" : "/",
  build: {
    outDir: "demo-dist",
  },
});
