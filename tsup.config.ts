import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "components/git-diff": "src/components/git-diff.ts",
    "components/git-log": "src/components/git-log.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: false,
  clean: true,
  minify: true,
});
