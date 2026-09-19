import { afterEach, describe, expect, it, vi } from "vitest";

import { loadRepositoryShow } from "./repository-show.js";

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
      author: { name: "Author", email: "author@example.com", date: "2026-09-19T00:00:00Z" },
      committer: {
        name: "Committer",
        email: "committer@example.com",
        date: "2026-09-19T01:00:00Z",
      },
    },
    parents: [{ sha: "b".repeat(40) }],
  };
}

function gitlabCommit(hash: string) {
  return {
    id: hash,
    message: "Show one GitLab commit",
    author_name: "Author",
    author_email: "author@example.com",
    authored_date: "2026-09-19T00:00:00Z",
    committer_name: "Committer",
    committer_email: "committer@example.com",
    committed_date: "2026-09-19T01:00:00Z",
    parent_ids: [],
    web_url: `https://gitlab.com/group/project/-/commit/${hash}`,
  };
}

function bitbucketCommit(hash: string) {
  return {
    hash,
    message: "Show one Bitbucket commit",
    date: "2026-09-19T00:00:00Z",
    author: { raw: "Author <author@example.com>" },
    parents: [],
    links: { html: { href: `https://bitbucket.org/workspace/project/commits/${hash}` } },
  };
}

describe("repository show providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads GitHub commit metadata and its raw diff", async () => {
    const commit = githubCommit("a".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadRepositoryShow({
      repository: "https://github.com/owner/project.git",
      revision: "main",
    });

    expect(result.commit.hash).toBe(commit.sha);
    expect(result.commit).not.toHaveProperty("side");
    expect(result.patch).toBe(PATCH);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [metadataUrl] = fetchMock.mock.calls[0] as [string];
    const [diffUrl, diffInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(metadataUrl).toBe("https://api.github.com/repos/owner/project/commits/main");
    expect(diffUrl).toBe(metadataUrl);
    expect(new Headers(diffInit.headers).get("Accept")).toBe("application/vnd.github.diff");
  });

  it("loads GitLab commit metadata and unified diff entries", async () => {
    const commit = gitlabCommit("a".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(Response.json([{ diff: PATCH }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadRepositoryShow({
      repository: "https://gitlab.com/group/subgroup/project",
      revision: "release/next",
    });

    expect(result.commit.hash).toBe(commit.id);
    expect(result.patch).toBe(PATCH);
    const [metadataUrl] = fetchMock.mock.calls[0] as [string];
    const [diffUrl] = fetchMock.mock.calls[1] as [URL];
    expect(metadataUrl).toBe(
      "https://gitlab.com/api/v4/projects/group%2Fsubgroup%2Fproject/repository/commits/release%2Fnext",
    );
    expect(diffUrl.pathname).toMatch(/\/commits\/release%2Fnext\/diff$/);
    expect(diffUrl.searchParams.get("unidiff")).toBe("true");
  });

  it("loads Bitbucket commit metadata and its first-parent diff", async () => {
    const commit = bitbucketCommit("a".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadRepositoryShow({
      repository: "https://bitbucket.org/workspace/project",
      revision: "v0.2.0",
    });

    expect(result.commit.hash).toBe(commit.hash);
    expect(result.patch).toBe(PATCH);
    const [diffUrl] = fetchMock.mock.calls[1] as [URL];
    expect(diffUrl.pathname).toBe("/2.0/repositories/workspace/project/diff/v0.2.0");
    expect(diffUrl.searchParams.get("binary")).toBe("true");
    expect(diffUrl.searchParams.get("renames")).toBe("true");
  });

  it("deduplicates both requests for identical in-flight shows", async () => {
    const commit = githubCommit("c".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      repository: "https://github.com/owner/deduplicated-show",
      revision: "main",
    };

    const [first, second] = await Promise.all([
      loadRepositoryShow(request),
      loadRepositoryShow(request),
    ]);

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reuses a successful combined result from Cache Storage", async () => {
    const responses = new Map<string, Response>();
    vi.stubGlobal("caches", {
      open: vi.fn().mockResolvedValue({
        match: async (key: string) => responses.get(key)?.clone(),
        put: async (key: string, response: Response) => {
          responses.set(key, response.clone());
        },
        delete: async (key: string) => responses.delete(key),
      }),
    });
    const commit = githubCommit("d".repeat(40));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(commit))
      .mockResolvedValueOnce(new Response(PATCH));
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      repository: "https://github.com/owner/cached-show",
      revision: "main",
    };

    const first = await loadRepositoryShow(request);
    const second = await loadRepositoryShow(request);

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects revision ranges", async () => {
    await expect(
      loadRepositoryShow({
        repository: "https://github.com/owner/project",
        revision: "main..feature",
      }),
    ).rejects.toThrow("Unsupported revision");
  });
});
