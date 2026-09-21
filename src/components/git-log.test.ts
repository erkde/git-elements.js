import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitLogElement } from "./git-log.js";

const TAG_NAME = "git-log-render-test";

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, GitLogElement);
}

function githubCommit(hash: string) {
  return {
    sha: hash,
    html_url: `https://github.com/owner/project/commit/${hash}`,
    commit: {
      message: "Add repository log support\n\nMore detail",
      author: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        date: "2026-09-18T01:02:03Z",
      },
      committer: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        date: "2026-09-18T01:02:03Z",
      },
    },
    parents: [],
  };
}

describe("GitLogElement", () => {
  let element: GitLogElement;

  beforeEach(() => {
    element = document.createElement(TAG_NAME) as GitLogElement;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
    vi.unstubAllGlobals();
  });

  it("reflects its repository query properties", () => {
    element.remove();
    element.repository = "https://github.com/owner/project";
    element.revisions = "main..feature";
    element.maxCount = 20;
    element.leftRight = true;
    element.oneline = true;

    expect(element.getAttribute("repository")).toBe("https://github.com/owner/project");
    expect(element.getAttribute("revisions")).toBe("main..feature");
    expect(element.getAttribute("max-count")).toBe("20");
    expect(element.hasAttribute("left-right")).toBe(true);
    expect(element.hasAttribute("oneline")).toBe(true);
  });

  it("loads and renders commit history", async () => {
    const commit = githubCommit("a".repeat(40));
    const fetchMock = vi.fn().mockResolvedValue(Response.json([commit]));
    vi.stubGlobal("fetch", fetchMock);
    const loadListener = vi.fn();
    element.addEventListener("load", loadListener);

    element.repository = "https://github.com/owner/component-project";
    element.revisions = "main";
    element.oneline = true;

    await vi.waitFor(() => {
      expect(element.shadowRoot!.querySelectorAll(".commit")).toHaveLength(1);
    });

    expect(element.commits[0]?.hash).toBe(commit.sha);
    expect(element.shadowRoot!.querySelector(".commit-hash")?.textContent).toBe("aaaaaaa");
    expect(element.shadowRoot!.querySelector(".commit-message")?.textContent).toBe(
      "Add repository log support",
    );
    expect(element.shadowRoot!.querySelector(".commit-author")?.textContent).toBe("Ada Lovelace");
    expect(element.shadowRoot!.querySelector(".commit-date")?.textContent).toBe("2026-09-18");
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect(loadListener).toHaveBeenCalledOnce();
  });

  it("renders regular git-log details by default", async () => {
    const commit = githubCommit("a".repeat(40));
    const fetchMock = vi.fn().mockResolvedValue(Response.json([commit]));
    vi.stubGlobal("fetch", fetchMock);

    element.repository = "https://github.com/owner/full-project";
    element.revisions = "main";

    await vi.waitFor(() => {
      expect(element.shadowRoot!.querySelectorAll(".commit")).toHaveLength(1);
    });

    expect(element.shadowRoot!.querySelector(".commit")?.classList.contains("commit-full")).toBe(
      true,
    );
    expect(element.shadowRoot!.querySelector(".commit-hash")?.textContent).toBe(
      `commit ${commit.sha}`,
    );
    expect(element.shadowRoot!.querySelector(".commit-message")?.textContent).toBe(
      commit.commit.message,
    );
    expect(element.shadowRoot!.querySelector(".commit-author")?.textContent).toBe(
      "Author: Ada Lovelace <ada@example.com>",
    );
    expect(element.shadowRoot!.querySelector(".commit-date")?.textContent).toBe("Date: 2026-09-18");
  });

  it("shows an accessible error state when loading fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("Not found", { status: 404, statusText: "Not Found" })),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const errorListener = vi.fn();
    element.addEventListener("error", errorListener);

    element.repository = "https://github.com/owner/missing-project";
    element.revisions = "main";

    await vi.waitFor(() => {
      expect((element.shadowRoot!.querySelector("[part='error']") as HTMLElement).hidden).toBe(
        false,
      );
    });

    expect(element.commits).toHaveLength(0);
    expect(element.shadowRoot!.querySelector("[part='error']")?.getAttribute("role")).toBe("alert");
    expect(errorListener).toHaveBeenCalledOnce();
  });

  it("reloads while bypassing a cached result", async () => {
    const first = githubCommit("a".repeat(40));
    const second = githubCommit("b".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json([first]))
      .mockResolvedValueOnce(Response.json([second]));
    vi.stubGlobal("fetch", fetchMock);
    element.repository = "https://github.com/owner/reload-project";
    element.revisions = "main";

    await vi.waitFor(() => expect(element.commits[0]?.hash).toBe(first.sha));
    await element.reload();

    expect(element.commits[0]?.hash).toBe(second.sha);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
