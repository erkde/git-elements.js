import {
  fetchJson,
  githubRequestInit,
  isFullObjectId,
  normalizeBitbucketCommit,
  normalizeGitHubCommit,
  normalizeGitLabCommit,
  resolveRepository,
  validateRevision,
  type BitbucketCommit,
  type GitHubCommit,
  type GitLabCommit,
  type GitLogCommit,
  type ResolvedRepository,
} from "./repository-log.js";

export type GitShowCommit = Omit<GitLogCommit, "side">;

export interface GitShowResult {
  commit: GitShowCommit;
  patch: string;
}

export interface RepositoryShowRequest {
  repository: string;
  revision: string;
}

interface PendingRequest {
  controller: AbortController;
  consumers: number;
  promise: Promise<GitShowResult>;
}

interface GitLabCommitDiff {
  diff: string;
}

const CACHE_NAME = "@erkde/git-elements:git-show:v1";
const CACHE_TIMESTAMP_HEADER = "x-git-elements-cached-at";
const MUTABLE_CACHE_LIFETIME = 60 * 60 * 1000;
const pendingRequests = new Map<string, PendingRequest>();

export async function loadRepositoryShow(
  request: RepositoryShowRequest,
  options: { signal?: AbortSignal; reload?: boolean } = {},
): Promise<GitShowResult> {
  const repository = resolveRepository(request.repository);
  const revision = request.revision.trim();
  validateRevision(revision);

  const cacheKey = createCacheKey(repository, revision);
  const pendingKey = `${cacheKey}:${options.reload === true ? "reload" : "default"}`;
  let pending = pendingRequests.get(pendingKey);

  if (!pending) {
    const controller = new AbortController();
    let created: PendingRequest;
    const promise = loadAndCacheShow(
      repository,
      revision,
      cacheKey,
      controller.signal,
      options.reload === true,
    ).finally(() => {
      if (pendingRequests.get(pendingKey) === created) {
        pendingRequests.delete(pendingKey);
      }
    });
    created = { controller, consumers: 0, promise };
    pending = created;
    pendingRequests.set(pendingKey, pending);
  }

  pending.consumers += 1;
  try {
    return await waitForResult(pending.promise, options.signal);
  } finally {
    pending.consumers -= 1;
    if (pending.consumers === 0 && pendingRequests.get(pendingKey) === pending) {
      pendingRequests.delete(pendingKey);
      pending.controller.abort();
    }
  }
}

async function loadAndCacheShow(
  repository: ResolvedRepository,
  revision: string,
  cacheKey: string,
  signal: AbortSignal,
  reload: boolean,
): Promise<GitShowResult> {
  if (!reload) {
    const cached = await readCachedShow(cacheKey, isFullObjectId(revision));
    if (cached) {
      return cached;
    }
  }

  const result = await fetchProviderShow(repository, revision, signal);
  await writeCachedShow(cacheKey, result);
  return result;
}

function fetchProviderShow(
  repository: ResolvedRepository,
  revision: string,
  signal: AbortSignal,
): Promise<GitShowResult> {
  switch (repository.provider) {
    case "github":
      return fetchGitHubShow(repository, revision, signal);
    case "gitlab":
      return fetchGitLabShow(repository, revision, signal);
    case "bitbucket":
      return fetchBitbucketShow(repository, revision, signal);
  }
}

async function fetchGitHubShow(
  repository: ResolvedRepository,
  revision: string,
  signal: AbortSignal,
): Promise<GitShowResult> {
  const [owner, name] = repository.path;
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}/commits/${encodeURIComponent(revision)}`;
  const [commit, patch] = await Promise.all([
    fetchJson<GitHubCommit>(endpoint, githubRequestInit(signal), "Git commit"),
    fetchText(endpoint, {
      ...githubRequestInit(signal),
      headers: {
        ...githubRequestInit(signal).headers,
        Accept: "application/vnd.github.diff",
      },
    }),
  ]);

  return { commit: withoutSide(normalizeGitHubCommit(commit)), patch };
}

async function fetchGitLabShow(
  repository: ResolvedRepository,
  revision: string,
  signal: AbortSignal,
): Promise<GitShowResult> {
  const project = encodeURIComponent(repository.path.join("/"));
  const endpoint = `https://gitlab.com/api/v4/projects/${project}/repository/commits/${encodeURIComponent(revision)}`;
  const [commit, patch] = await Promise.all([
    fetchJson<GitLabCommit>(endpoint, { signal }, "Git commit"),
    fetchGitLabPatch(`${endpoint}/diff`, signal),
  ]);

  return { commit: withoutSide(normalizeGitLabCommit(commit)), patch };
}

async function fetchGitLabPatch(endpoint: string, signal: AbortSignal): Promise<string> {
  const diffs: string[] = [];
  let page = 1;

  while (page > 0) {
    const url = new URL(endpoint);
    url.searchParams.set("unidiff", "true");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(
        `Unable to load Git commit from ${url.href}: ${response.status} ${response.statusText}`,
      );
    }

    const entries = (await response.json()) as GitLabCommitDiff[];
    diffs.push(...entries.map((entry) => entry.diff).filter(Boolean));
    const nextPage = Number(response.headers.get("x-next-page"));
    page = Number.isInteger(nextPage) && nextPage > page ? nextPage : 0;
  }

  return diffs.join("\n");
}

async function fetchBitbucketShow(
  repository: ResolvedRepository,
  revision: string,
  signal: AbortSignal,
): Promise<GitShowResult> {
  const [workspace, name] = repository.path;
  const baseUrl = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(workspace!)}/${encodeURIComponent(name!)}`;
  const commitUrl = `${baseUrl}/commit/${encodeURIComponent(revision)}`;
  const diffUrl = new URL(`${baseUrl}/diff/${encodeURIComponent(revision)}`);
  diffUrl.searchParams.set("binary", "true");
  diffUrl.searchParams.set("renames", "true");

  const [commit, patch] = await Promise.all([
    fetchJson<BitbucketCommit>(commitUrl, { signal }, "Git commit"),
    fetchText(diffUrl, { signal }),
  ]);

  return { commit: withoutSide(normalizeBitbucketCommit(commit)), patch };
}

async function fetchText(url: URL | string, init: RequestInit): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(
      `Unable to load Git commit from ${String(url)}: ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

function withoutSide(commit: GitLogCommit): GitShowCommit {
  const { side: _side, ...result } = commit;
  return result;
}

function createCacheKey(repository: ResolvedRepository, revision: string): string {
  const url = new URL("https://git-elements.invalid/cache/git-show");
  url.searchParams.set("provider", repository.provider);
  url.searchParams.set("repository", repository.canonicalUrl);
  url.searchParams.set("revision", revision);
  return url.href;
}

async function readCachedShow(key: string, immutable: boolean): Promise<GitShowResult | null> {
  const cache = await openCache();
  if (!cache) {
    return null;
  }

  try {
    const response = await cache.match(key);
    if (!response) {
      return null;
    }

    const cachedAt = Number(response.headers.get(CACHE_TIMESTAMP_HEADER));
    if (
      !immutable &&
      (!Number.isFinite(cachedAt) || Date.now() - cachedAt > MUTABLE_CACHE_LIFETIME)
    ) {
      await cache.delete(key);
      return null;
    }

    return (await response.json()) as GitShowResult;
  } catch {
    await cache.delete(key).catch(() => false);
    return null;
  }
}

async function writeCachedShow(key: string, result: GitShowResult): Promise<void> {
  const cache = await openCache();
  if (!cache) {
    return;
  }

  try {
    await cache.put(
      key,
      new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          [CACHE_TIMESTAMP_HEADER]: String(Date.now()),
        },
      }),
    );
  } catch {
    // Cache Storage can be unavailable because of browser privacy or quota settings.
  }
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") {
    return null;
  }

  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

function waitForResult<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException("The request was aborted.", "AbortError"),
    );
  }

  return new Promise<T>((resolve, reject) => {
    const abort = () =>
      reject(signal.reason ?? new DOMException("The request was aborted.", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
