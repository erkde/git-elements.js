import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitDiffElement } from "./git-diff.js";
import { GitShowElement } from "./git-show.js";

const TAG_NAME = "git-show-render-test";

if (!customElements.get("git-diff")) {
  customElements.define("git-diff", GitDiffElement);
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, GitShowElement);
}

const PATCH = `diff --git a/message.txt b/message.txt
index ce01362..b8fd755 100644
--- a/message.txt
+++ b/message.txt
@@ -1 +1 @@
-hello
+hello, world`;

function githubCommit(hash: string) {
  return {
    sha: hash,
    html_url: `https://github.com/owner/project/commit/${hash}`,
    commit: {
      message: "Show one commit\n\nWith its patch.",
      author: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        date: "2026-09-19T01:02:03Z",
      },
      committer: {
        name: "Grace Hopper",
        email: "grace@example.com",
        date: "2026-09-19T02:03:04Z",
      },
    },
    parents: [],
  };
}

describe("GitShowElement", () => {
  let element: GitShowElement;

  beforeEach(() => {
    element = document.createElement(TAG_NAME) as GitShowElement;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
    vi.unstubAllGlobals();
  });

  it("reflects its repository, revision, and line-number properties", () => {
    element.remove();
    element.repository = "https://github.com/owner/project";
    element.revision = "main";
    element.lineNumbers = true;

    expect(element.getAttribute("repository")).toBe("https://github.com/owner/project");
    expect(element.getAttribute("revision")).toBe("main");
    expect(element.hasAttribute("line-numbers")).toBe(true);
  });

  it("loads and renders commit metadata followed by its patch", async () => {
    const commit = githubCommit("a".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);
    const loadListener = vi.fn();
    element.addEventListener("load", loadListener);

    element.repository = "https://github.com/owner/component-show";
    element.revision = "main";

    await vi.waitFor(() => expect(element.commit?.hash).toBe(commit.sha));

    expect(element.patch).toBe(PATCH);
    expect(element.shadowRoot!.querySelector("[part='hash']")?.textContent).toBe(commit.sha);
    expect(element.shadowRoot!.querySelector("[part='author']")?.textContent).toBe(
      "Ada Lovelace <ada@example.com>",
    );
    expect(element.shadowRoot!.querySelector("[part='date']")?.textContent).toBe(
      "2026-09-19 01:02:03 UTC",
    );
    expect(element.shadowRoot!.querySelector("[part='subject']")?.textContent).toBe(
      "Show one commit",
    );
    expect(element.shadowRoot!.querySelector("[part='body']")?.textContent).toBe("With its patch.");
    expect(
      element
        .shadowRoot!.querySelector<GitDiffElement>("git-diff")!
        .shadowRoot!.querySelectorAll(".diff-row"),
    ).toHaveLength(2);
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect(loadListener).toHaveBeenCalledOnce();
  });

  it("forwards line numbers and theme without reloading", async () => {
    const commit = githubCommit("b".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);
    element.repository = "https://github.com/owner/show-presentation";
    element.revision = "main";

    await vi.waitFor(() => expect(element.commit).not.toBeNull());
    element.lineNumbers = true;
    element.setAttribute("theme", "dark");

    const diff = element.shadowRoot!.querySelector("git-diff")!;
    expect(diff.hasAttribute("line-numbers")).toBe(true);
    expect(diff.getAttribute("theme")).toBe("dark");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an accessible error state when either request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Not found", {
          status: 404,
          statusText: "Not Found",
        }),
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const errorListener = vi.fn();
    element.addEventListener("error", errorListener);

    element.repository = "https://github.com/owner/missing-show";
    element.revision = "main";

    await vi.waitFor(() => {
      expect((element.shadowRoot!.querySelector("[part='error']") as HTMLElement).hidden).toBe(
        false,
      );
    });

    expect(element.commit).toBeNull();
    expect(element.patch).toBe("");
    expect(element.shadowRoot!.querySelector("[part='error']")?.getAttribute("role")).toBe("alert");
    expect(errorListener).toHaveBeenCalledOnce();
  });
});
