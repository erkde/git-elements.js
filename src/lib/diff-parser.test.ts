import { describe, expect, it } from "vitest";
import { parseDiff } from "./diff-parser.js";

const SAMPLE_PATCH = `--- a/src/index.ts
+++ b/src/index.ts
@@ -10,3 +10,4 @@
 export class GitDiffElement {
-  // old comment
+  // new comment
   connectedCallback() {}
+  render() {}`;

describe("parseDiff", () => {
  it("parses file header metadata", () => {
    const result = parseDiff(SAMPLE_PATCH);
    const file = result[0]!;

    expect(result).toHaveLength(1);
    expect(file.oldPath).toBe("src/index.ts");
    expect(file.newPath).toBe("src/index.ts");
    expect(file.hunks).toHaveLength(1);
  });

  it("calculates old and new line numbers accurately", () => {
    const result = parseDiff(SAMPLE_PATCH);
    const lines = result[0]!.hunks[0]!.lines;

    // Context Line
    expect(lines[0]).toEqual({
      type: "context",
      content: "export class GitDiffElement {",
      oldLineNumber: 10,
      newLineNumber: 10,
    });

    // Deletion Line (-)
    expect(lines[1]).toEqual({
      type: "deletion",
      content: "  // old comment",
      oldLineNumber: 11,
      newLineNumber: null,
    });

    // Addition Line (+)
    expect(lines[2]).toEqual({
      type: "addition",
      content: "  // new comment",
      oldLineNumber: null,
      newLineNumber: 11,
    });
  });

  it("handles empty diff input gracefully", () => {
    const result = parseDiff("");
    expect(result).toHaveLength(0);
  });

  it("parses additions and deletions across multiple files", () => {
    const result = parseDiff(`diff --git a/new.txt b/new.txt
new file mode 100644
--- /dev/null
+++ b/new.txt
@@ -0,0 +1 @@
+new
diff --git a/old.txt b/old.txt
deleted file mode 100644
--- a/old.txt
+++ /dev/null
@@ -1 +0,0 @@
-old`);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      oldPath: null,
      newPath: "new.txt",
      status: "added",
      newMode: "100644",
    });
    expect(result[0]!.hunks[0]!.lines[0]).toMatchObject({
      type: "addition",
      newLineNumber: 1,
    });
    expect(result[1]).toMatchObject({
      oldPath: "old.txt",
      newPath: null,
      status: "deleted",
      oldMode: "100644",
    });
    expect(result[1]!.hunks[0]!.lines[0]).toMatchObject({
      type: "deletion",
      oldLineNumber: 1,
    });
  });

  it("parses rename and copy metadata without hunks", () => {
    const result = parseDiff(`diff --git a/old name.txt b/new name.txt
similarity index 100%
rename from old name.txt
rename to new name.txt
diff --git a/source.txt b/copy.txt
similarity index 95%
copy from source.txt
copy to copy.txt`);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      oldPath: "old name.txt",
      newPath: "new name.txt",
      status: "renamed",
      similarity: 100,
      hunks: [],
    });
    expect(result[1]).toMatchObject({
      oldPath: "source.txt",
      newPath: "copy.txt",
      status: "copied",
      similarity: 95,
      hunks: [],
    });
  });

  it("parses mode-only and binary changes", () => {
    const result = parseDiff(`diff --git a/run.sh b/run.sh
old mode 100644
new mode 100755
diff --git a/logo.png b/logo.png
new file mode 100644
index 0000000..1234567
Binary files /dev/null and b/logo.png differ`);

    expect(result[0]).toMatchObject({
      status: "modified",
      oldMode: "100644",
      newMode: "100755",
      isBinary: false,
    });
    expect(result[1]).toMatchObject({
      oldPath: null,
      newPath: "logo.png",
      status: "added",
      newMode: "100644",
      isBinary: true,
      binaryMessage: "Binary files /dev/null and b/logo.png differ",
    });
  });

  it("decodes quoted Git paths", () => {
    const result = parseDiff(`diff --git "a/docs/\\303\\251 notes.txt" "b/docs/\\303\\251 notes.txt"
index 1234567..89abcde 100644
--- "a/docs/\\303\\251 notes.txt"
+++ "b/docs/\\303\\251 notes.txt"
@@ -1 +1 @@
-old
+new`);

    expect(result[0]).toMatchObject({
      oldPath: "docs/é notes.txt",
      newPath: "docs/é notes.txt",
      oldMode: "100644",
      newMode: "100644",
    });
  });

  it("does not mistake hunk content for file headers", () => {
    const result = parseDiff(`--- a/heading.md
+++ b/heading.md
@@ -1 +1 @@
--- old heading
+++ new heading`);
    const lines = result[0]!.hunks[0]!.lines;

    expect(result).toHaveLength(1);
    expect(lines).toEqual([
      {
        type: "deletion",
        content: "-- old heading",
        oldLineNumber: 1,
        newLineNumber: null,
      },
      {
        type: "addition",
        content: "++ new heading",
        oldLineNumber: null,
        newLineNumber: 1,
      },
    ]);
  });
});
