import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitDiffElement } from "./git-diff.js";

const TAG_NAME = "git-diff-render-test";

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, GitDiffElement);
}

const SAMPLE_PATCH = `--- a/src/index.ts
+++ b/src/index.ts
@@ -1,2 +1,2 @@
-const oldVersion = 1;
+const newVersion = 2;`;

describe("GitDiffElement Rendering", () => {
  let element: GitDiffElement;

  beforeEach(() => {
    element = document.createElement(TAG_NAME) as GitDiffElement;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
    vi.unstubAllGlobals();
  });

  it("attaches shadow root correctly", () => {
    expect(element.shadowRoot).not.toBeNull();
  });

  it("reflects the optional line-numbers property", () => {
    expect(element.lineNumbers).toBe(false);

    element.lineNumbers = true;

    expect(element.hasAttribute("line-numbers")).toBe(true);
    expect(element.lineNumbers).toBe(true);

    element.lineNumbers = false;
    expect(element.hasAttribute("line-numbers")).toBe(false);
  });

  it("renders table rows when setting patch property", () => {
    element.patch = SAMPLE_PATCH;

    const shadow = element.shadowRoot!;
    const rows = shadow.querySelectorAll(".diff-row");

    expect(rows).toHaveLength(2);
    expect(rows.item(0).classList.contains("row-deletion")).toBe(true);
    expect(rows.item(1).classList.contains("row-addition")).toBe(true);
    expect(rows.item(0).querySelector(".line-content")?.textContent).toBe("-const oldVersion = 1;");
    expect(rows.item(1).querySelector(".line-content")?.textContent).toBe("+const newVersion = 2;");
  });

  it("populates correct line numbers in table cells", () => {
    element.patch = SAMPLE_PATCH;

    const shadow = element.shadowRoot!;
    const additionRow = shadow.querySelector(".row-addition")!;
    const oldNum = additionRow.querySelector(".old-line-num")?.textContent;
    const newNum = additionRow.querySelector(".new-line-num")?.textContent;

    expect(oldNum).toBe("");
    expect(newNum).toBe("1");
  });

  it("loads and renders a patch from the src attribute", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(SAMPLE_PATCH));
    vi.stubGlobal("fetch", fetchMock);

    element.src = "/sample.patch";

    await vi.waitFor(() => {
      expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(2);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/sample.patch",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("renders a patch from a text/plain child", () => {
    element.remove();
    const patchData = document.createElement("script");
    patchData.type = "text/plain";
    patchData.textContent = `
      ${SAMPLE_PATCH.replaceAll("\n", "\n      ")}
    `;
    element.appendChild(patchData);

    document.body.appendChild(element);

    expect(element.patch).toBe(SAMPLE_PATCH);
    expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(2);
  });

  it("renders metadata-only file changes", () => {
    element.patch = `diff --git a/old.txt b/new.txt
similarity index 100%
rename from old.txt
rename to new.txt
diff --git a/run.sh b/run.sh
old mode 100644
new mode 100755
diff --git a/logo.png b/logo.png
index 1234567..89abcde 100644
Binary files a/logo.png and b/logo.png differ`;

    const files = element.shadowRoot!.querySelectorAll(".file-diff");

    expect(files).toHaveLength(3);
    expect(files.item(0).querySelector(".file-path")?.textContent).toBe("old.txt → new.txt");
    expect(files.item(0).querySelector(".file-status")?.textContent).toBe("renamed");
    expect(files.item(0).querySelector(".file-meta")?.textContent).toContain("100% similarity");
    expect(files.item(1).querySelector(".file-meta")?.textContent).toContain(
      "Mode changed 100644 → 100755",
    );
    expect(files.item(2).querySelector(".file-meta")?.textContent).toContain("Binary file");
    expect(element.shadowRoot!.querySelectorAll(".diff-table")).toHaveLength(0);
  });
});
