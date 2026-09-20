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

  it("shows only the shortstat when enabled and restores the patch when disabled", () => {
    element.patch = SAMPLE_PATCH;
    expect(element.shadowRoot!.querySelector("[part='shortstat']")).toBeNull();

    const parsedDiffs = element.parsedDiffs;
    element.shortStat = true;

    expect(element.hasAttribute("shortstat")).toBe(true);
    expect(element.parsedDiffs).toBe(parsedDiffs);
    expect(element.shadowRoot!.querySelector("[part='shortstat']")?.textContent).toBe(
      "1 file changed, 1 insertion(+), 1 deletion(-)",
    );
    expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(0);
    expect(element.shadowRoot!.querySelectorAll(".file-diff")).toHaveLength(0);

    element.shortStat = false;
    expect(element.shadowRoot!.querySelector("[part='shortstat']")).toBeNull();
    expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(2);
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
    const loadListener = vi.fn();
    element.addEventListener("load", loadListener);
    const loadingContent = document.createElement("span");
    loadingContent.slot = "loading";
    loadingContent.textContent = "Loading changes…";
    element.appendChild(loadingContent);

    element.src = "/sample.patch";

    expect((element.shadowRoot!.querySelector("[part='loading']") as HTMLElement).hidden).toBe(
      false,
    );
    expect((element.shadowRoot!.querySelector("[part='error']") as HTMLElement).hidden).toBe(true);
    expect(element.getAttribute("aria-busy")).toBe("true");

    await vi.waitFor(() => {
      expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(2);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/sample.patch",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect((element.shadowRoot!.querySelector("[part='loading']") as HTMLElement).hidden).toBe(
      true,
    );
    expect(loadListener).toHaveBeenCalledOnce();
  });

  it("replaces stale output with an accessible error state when src fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Not found", {
        status: 404,
        statusText: "Not Found",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const errorListener = vi.fn();
    element.addEventListener("error", errorListener);
    const errorContent = document.createElement("span");
    errorContent.slot = "error";
    errorContent.textContent = "Changes unavailable.";
    element.appendChild(errorContent);

    element.shortStat = true;
    element.patch = SAMPLE_PATCH;
    expect(element.shadowRoot!.querySelector("[part='shortstat']")).not.toBeNull();
    element.src = "/missing.patch";

    expect(element.shadowRoot!.querySelectorAll(".diff-row")).toHaveLength(0);
    expect(element.shadowRoot!.querySelector("[part='shortstat']")).toBeNull();

    await vi.waitFor(() => {
      expect((element.shadowRoot!.querySelector("[part='error']") as HTMLElement).hidden).toBe(
        false,
      );
    });

    expect(element.patch).toBe("");
    expect(element.parsedDiffs).toHaveLength(0);
    expect(element.shadowRoot!.querySelector("[part='error']")?.getAttribute("role")).toBe("alert");
    expect((element.shadowRoot!.querySelector("[part='loading']") as HTMLElement).hidden).toBe(
      true,
    );
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect(errorListener).toHaveBeenCalledOnce();
    const event = errorListener.mock.calls[0]![0] as Event;
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(false);
  });

  it("keeps an explicitly assigned patch when a pending src request completes", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    element.src = "/slow.patch";
    element.patch = SAMPLE_PATCH;

    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(request.signal?.aborted).toBe(true);

    resolveResponse?.(new Response("--- a/late.txt\n+++ b/late.txt"));
    await Promise.resolve();

    expect(element.patch).toBe(SAMPLE_PATCH);
    expect(element.shadowRoot!.querySelector(".file-path")?.textContent).toBe("src/index.ts");
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
    element.shortStat = true;
    expect(element.shadowRoot!.querySelectorAll(".file-diff")).toHaveLength(0);
    expect(element.shadowRoot!.querySelector("[part='shortstat']")?.textContent).toBe(
      "3 files changed",
    );
  });
});
