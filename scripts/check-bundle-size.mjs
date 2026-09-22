import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "tsup";

const entries = [
  {
    name: "all components",
    input: "src/index.ts",
    output: "index.js",
    gzipLimit: 12_500,
  },
  {
    name: "git-diff",
    input: "src/components/git-diff.ts",
    output: "components/git-diff.js",
    gzipLimit: 6_250,
  },
  {
    name: "git-log",
    input: "src/components/git-log.ts",
    output: "components/git-log.js",
    gzipLimit: 5_600,
  },
  {
    name: "git-show",
    input: "src/components/git-show.ts",
    output: "components/git-show.js",
    gzipLimit: 9_700,
  },
];

const outputDirectory = await mkdtemp(join(tmpdir(), "git-elements-size-"));

try {
  await build({
    entry: Object.fromEntries(
      entries.map(({ input, output }) => [output.replace(/\.js$/, ""), input]),
    ),
    format: ["esm"],
    target: "es2022",
    dts: false,
    clean: true,
    minify: true,
    splitting: false,
    outDir: outputDirectory,
    config: false,
    silent: true,
  });

  const results = await Promise.all(
    entries.map(async (entry) => {
      const bundle = await readFile(join(outputDirectory, entry.output));

      return {
        ...entry,
        minified: bundle.byteLength,
        gzip: gzipSync(bundle).byteLength,
      };
    }),
  );

  console.log("Bundle sizes (minified / gzip):");

  for (const result of results) {
    const status = result.gzip <= result.gzipLimit ? "pass" : "FAIL";
    console.log(
      `${status.padEnd(4)}  ${result.name.padEnd(14)} ${formatBytes(result.minified).padStart(8)} / ${formatBytes(result.gzip).padStart(8)} (limit ${formatBytes(result.gzipLimit)})`,
    );
  }

  const failures = results.filter(({ gzip, gzipLimit }) => gzip > gzipLimit);

  if (failures.length > 0) {
    console.error(
      `\n${failures.length} bundle ${failures.length === 1 ? "is" : "are"} over the gzip size limit.`,
    );
    process.exitCode = 1;
  }
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}

function formatBytes(bytes) {
  return `${(bytes / 1_000).toFixed(2)} kB`;
}
