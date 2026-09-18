function publishedPath(value) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.startsWith("src/") && value.endsWith(".ts")) {
    return `dist/${value.slice(4, -3)}.js`;
  }

  if (value.startsWith("/src/") && value.endsWith(".js")) {
    return `dist/${value.slice(5)}`;
  }

  if (value.startsWith("./components/") && value.endsWith(".js")) {
    return `dist/${value.slice(2)}`;
  }

  return value;
}

function rewriteModulePaths(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      rewriteModulePaths(item);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if ((key === "path" || key === "module") && typeof item === "string") {
      value[key] = publishedPath(item);
    } else {
      rewriteModulePaths(item);
    }
  }
}

export default {
  globs: ["src/index.ts", "src/components/git-diff.ts", "src/components/git-log.ts"],
  plugins: [
    {
      name: "published-module-paths",
      packageLinkPhase({ customElementsManifest }) {
        rewriteModulePaths(customElementsManifest);
        if (customElementsManifest.readme === "") {
          delete customElementsManifest.readme;
        }
      },
    },
  ],
};
