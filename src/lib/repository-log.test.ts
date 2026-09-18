import { afterEach, describe, expect, it, vi } from "vitest";

import { loadRepositoryLog, parseRevisionSelection } from "./repository-log.js";

function githubCommit(hash: string, date: string, parents: string[] = []) {
  return {
    sha: hash,
    html_url: `https://github.com/owner/project/commit/${hash}`,
    commit: {
      message: `Commit ${hash}`,
      author: { name: "Author", email: "author@example.com", date },
      committer: { name: "Committer", email: "committer@example.com", date },
    },
    parents: parents.map((sha) => ({ sha })),
  };
}

function gitlabCommit(hash: string) {
  return {
    id: hash,
    message: `Commit ${hash}`,
    author_name: "Author",
    author_email: "author@example.com",
    authored_date: "2026-09-18T00:00:00Z",
    committer_name: "Committer",
    committer_email: "committer@example.com",
    committed_date: "2026-09-18T00:00:00Z",
    parent_ids: [],
    web_url: `https://gitlab.com/group/project/-/commit/${hash}`,
  };
}

function bitbucketPage(hash: string) {
  return {
    values: [
      {
        hash,
        message: `Commit ${hash}`,
        date: "2026-09-18T00:00:00Z",
        author: { raw: "Author <author@example.com>" },
        parents: [],
        links: { html: { href: `https://bitbucket.org/workspace/project/commits/${hash}` } },
      },
    ],
  };
}

describe("repository log revisions", () => {
  it("parses a single revision", () => {
    expect(parseRevisionSelection("feature/login")).toEqual({
      kind: "single",
      revision: "feature/login",
    });
  });

  it("distinguishes difference and symmetric revision sets", () => {
    expect(parseRevisionSelection("main..feature")).toEqual({
      kind: "difference",
      left: "main",
      right: "feature",
    });
    expect(parseRevisionSelection("main...feature")).toEqual({
      kind: "symmetric",
      left: "main",
      right: "feature",
    });
  });

  it("rejects incomplete and ambiguous revision sets", () => {
    expect(() => parseRevisionSelection("main..")).toThrow("Unsupported revision");
    expect(() => parseRevisionSelection("main....feature")).toThrow("Unsupported revision");
    expect(() => parseRevisionSelection(" ")).toThrow("required");
  });
});

describe("repository log providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a GitHub branch history", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json([githubCommit("a".repeat(40), "2026-09-18T00:00:00Z")]));
    vi.stubGlobal("fetch", fetchMock);

    const commits = await loadRepositoryLog({
      repository: "https://github.com/owner/project.git",
      revisions: "main",
      maxCount: 20,
    });

    expect(commits[0]?.hash).toBe("a".repeat(40));
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toBe(
      "https://api.github.com/repos/owner/project/commits?sha=main&per_page=20",
    );
    expect(new Headers(init.headers).get("Accept")).toBe("application/vnd.github+json");
  });

  it("maps a two-dot GitHub log to the compare API and restores newest-first order", async () => {
    const older = githubCommit("a".repeat(40), "2026-09-17T00:00:00Z");
    const newer = githubCommit("b".repeat(40), "2026-09-18T00:00:00Z", [older.sha]);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ total_commits: 2, commits: [older, newer] }));
    vi.stubGlobal("fetch", fetchMock);

    const commits = await loadRepositoryLog({
      repository: "https://github.com/owner/project",
      revisions: "main..feature",
      maxCount: 20,
    });

    expect(commits.map((commit) => commit.hash)).toEqual([newer.sha, older.sha]);
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/repos/owner/project/compare/main...feature");
  });

  it("combines both GitHub directions for a symmetric log and labels their sides", async () => {
    const left = githubCommit("a".repeat(40), "2026-09-17T00:00:00Z");
    const right = githubCommit("b".repeat(40), "2026-09-18T00:00:00Z");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ total_commits: 1, commits: [right] }))
      .mockResolvedValueOnce(Response.json({ total_commits: 1, commits: [left] }));
    vi.stubGlobal("fetch", fetchMock);

    const commits = await loadRepositoryLog({
      repository: "https://github.com/owner/project",
      revisions: "main...feature",
      maxCount: 20,
      leftRight: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(commits.map(({ hash, side }) => ({ hash, side }))).toEqual([
      { hash: right.sha, side: "right" },
      { hash: left.sha, side: "left" },
    ]);
  });

  it("passes a GitLab symmetric range through natively", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([gitlabCommit("a".repeat(40))]));
    vi.stubGlobal("fetch", fetchMock);

    await loadRepositoryLog({
      repository: "https://gitlab.com/group/subgroup/project",
      revisions: "main...feature",
      maxCount: 30,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/api/v4/projects/group%2Fsubgroup%2Fproject/repository/commits");
    expect(url.searchParams.get("ref_name")).toBe("main...feature");
    expect(url.searchParams.get("order")).toBe("topo");
  });

  it("maps a Bitbucket two-dot range to include and exclude semantics", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(bitbucketPage("a".repeat(40))));
    vi.stubGlobal("fetch", fetchMock);

    await loadRepositoryLog({
      repository: "https://bitbucket.org/workspace/project",
      revisions: "main..feature",
      maxCount: 30,
    });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/2.0/repositories/workspace/project/commits/feature");
    expect(url.searchParams.get("exclude")).toBe("main");
  });

  it("deduplicates identical in-flight requests", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      repository: "https://github.com/owner/deduplicated-project",
      revisions: "main",
      maxCount: 20,
    };

    const first = loadRepositoryLog(request);
    const second = loadRepositoryLog(request);
    resolveResponse?.(Response.json([githubCommit("a".repeat(40), "2026-09-18T00:00:00Z")]));

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("reuses a successful result from Cache Storage", async () => {
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
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json([githubCommit("c".repeat(40), "2026-09-18T00:00:00Z")]));
    vi.stubGlobal("fetch", fetchMock);
    const request = {
      repository: "https://github.com/owner/cached-project",
      revisions: "main",
      maxCount: 20,
    };

    const first = await loadRepositoryLog(request);
    const second = await loadRepositoryLog(request);

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects unsupported repository hosts before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loadRepositoryLog({
        repository: "https://example.com/owner/project",
        revisions: "main",
        maxCount: 20,
      }),
    ).rejects.toThrow("Unsupported public repository URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
