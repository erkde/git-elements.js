export type GitLogSide = "left" | "right" | null;

export interface GitLogIdentity {
  name: string;
  email: string | null;
  date: string | null;
}

export interface GitLogCommit {
  hash: string;
  message: string;
  author: GitLogIdentity;
  committer: GitLogIdentity;
  parents: string[];
  href: string;
  side: GitLogSide;
}

export type RevisionSelection =
  | { kind: "single"; revision: string }
  | { kind: "difference"; left: string; right: string }
  | { kind: "symmetric"; left: string; right: string };

export interface RepositoryLogRequest {
  repository: string;
  revisions: string;
  maxCount: number;
  leftRight?: boolean;
}

interface ResolvedRepository {
  provider: "github" | "gitlab" | "bitbucket";
  canonicalUrl: string;
  path: string[];
}

interface PendingRequest {
  controller: AbortController;
  consumers: number;
  promise: Promise<GitLogCommit[]>;
}

const CACHE_NAME = "@erkde/git-elements:git-log:v1";
const CACHE_TIMESTAMP_HEADER = "x-git-elements-cached-at";
const MUTABLE_CACHE_LIFETIME = 60 * 60 * 1000;
const GITHUB_API_VERSION = "2026-03-10";
const pendingRequests = new Map<string, PendingRequest>();

export function parseRevisionSelection(value: string): RevisionSelection {
  const revisions = value.trim();
  if (!revisions) {
    throw new Error("A revision is required to load a repository log.");
  }

  const match = /^(.+?)(\.{2,3})(.+)$/.exec(revisions);
  if (!match) {
    validateRevision(revisions);
    return { kind: "single", revision: revisions };
  }

  const left = match[1]!.trim();
  const operator = match[2]!;
  const right = match[3]!.trim();
  validateRevision(left);
  validateRevision(right);

  return operator === ".."
    ? { kind: "difference", left, right }
    : { kind: "symmetric", left, right };
}

export async function loadRepositoryLog(
  request: RepositoryLogRequest,
  options: { signal?: AbortSignal; reload?: boolean } = {},
): Promise<GitLogCommit[]> {
  validateMaxCount(request.maxCount);

  const repository = resolveRepository(request.repository);
  const selection = parseRevisionSelection(request.revisions);
  const normalizedRequest: RepositoryLogRequest = {
    repository: repository.canonicalUrl,
    revisions: formatRevisionSelection(selection),
    maxCount: request.maxCount,
    leftRight: request.leftRight === true && selection.kind === "symmetric",
  };
  const cacheKey = createCacheKey(repository, normalizedRequest);
  const pendingKey = `${cacheKey}:${options.reload === true ? "reload" : "default"}`;

  let pending = pendingRequests.get(pendingKey);
  if (!pending) {
    const controller = new AbortController();
    let created: PendingRequest;
    const promise = loadAndCacheLog(
      repository,
      selection,
      normalizedRequest,
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

async function loadAndCacheLog(
  repository: ResolvedRepository,
  selection: RevisionSelection,
  request: RepositoryLogRequest,
  cacheKey: string,
  signal: AbortSignal,
  reload: boolean,
): Promise<GitLogCommit[]> {
  const immutable = selectionRevisions(selection).every(isFullObjectId);
  if (!reload) {
    const cached = await readCachedLog(cacheKey, immutable);
    if (cached) {
      return cached;
    }
  }

  const commits = await fetchProviderLog(repository, selection, request, signal);
  await writeCachedLog(cacheKey, commits);
  return commits;
}

async function fetchProviderLog(
  repository: ResolvedRepository,
  selection: RevisionSelection,
  request: RepositoryLogRequest,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  switch (repository.provider) {
    case "github":
      return fetchGitHubLog(repository, selection, request, signal);
    case "gitlab":
      return fetchGitLabLog(repository, selection, request, signal);
    case "bitbucket":
      return fetchBitbucketLog(repository, selection, request, signal);
  }
}

async function fetchGitHubLog(
  repository: ResolvedRepository,
  selection: RevisionSelection,
  request: RepositoryLogRequest,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const [owner, name] = repository.path;
  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}`;

  if (selection.kind === "single") {
    const url = new URL(`${baseUrl}/commits`);
    url.searchParams.set("sha", selection.revision);
    url.searchParams.set("per_page", String(request.maxCount));
    const response = await fetchJson<GitHubCommit[]>(url, githubRequestInit(signal));
    return response.map(normalizeGitHubCommit);
  }

  if (selection.kind === "difference") {
    return fetchGitHubDifference(
      baseUrl,
      selection.left,
      selection.right,
      request.maxCount,
      signal,
    );
  }

  const right = await fetchGitHubDifference(
    baseUrl,
    selection.left,
    selection.right,
    request.maxCount,
    signal,
  );
  const left = await fetchGitHubDifference(
    baseUrl,
    selection.right,
    selection.left,
    request.maxCount,
    signal,
  );

  return mergeSymmetricCommits(left, right, request.maxCount, request.leftRight === true);
}

async function fetchGitHubDifference(
  baseUrl: string,
  left: string,
  right: string,
  maxCount: number,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const endpoint = `${baseUrl}/compare/${encodeURIComponent(left)}...${encodeURIComponent(right)}`;
  const firstUrl = new URL(endpoint);
  firstUrl.searchParams.set("per_page", "100");
  firstUrl.searchParams.set("page", "1");
  const first = await fetchJson<GitHubComparison>(firstUrl, githubRequestInit(signal));
  const total = Math.max(0, first.total_commits);

  if (total <= first.commits.length) {
    return first.commits.map(normalizeGitHubCommit).reverse().slice(0, maxCount);
  }

  const commits: GitLogCommit[] = [];
  let page = Math.ceil(total / 100);
  while (page >= 1 && commits.length < maxCount) {
    const response =
      page === 1
        ? first
        : await fetchJson<GitHubComparison>(
            withSearchParams(endpoint, { per_page: "100", page: String(page) }),
            githubRequestInit(signal),
          );
    commits.push(...response.commits.map(normalizeGitHubCommit).reverse());
    page -= 1;
  }

  return commits.slice(0, maxCount);
}

function githubRequestInit(signal: AbortSignal): RequestInit {
  return {
    signal,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  };
}

async function fetchGitLabLog(
  repository: ResolvedRepository,
  selection: RevisionSelection,
  request: RepositoryLogRequest,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const project = encodeURIComponent(repository.path.join("/"));
  const endpoint = `https://gitlab.com/api/v4/projects/${project}/repository/commits`;

  if (selection.kind === "symmetric" && request.leftRight) {
    const right = await fetchGitLabRevision(
      endpoint,
      `${selection.left}..${selection.right}`,
      request.maxCount,
      signal,
    );
    const left = await fetchGitLabRevision(
      endpoint,
      `${selection.right}..${selection.left}`,
      request.maxCount,
      signal,
    );
    return mergeSymmetricCommits(left, right, request.maxCount, true);
  }

  return fetchGitLabRevision(
    endpoint,
    formatRevisionSelection(selection),
    request.maxCount,
    signal,
  );
}

async function fetchGitLabRevision(
  endpoint: string,
  revisions: string,
  maxCount: number,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const url = new URL(endpoint);
  url.searchParams.set("ref_name", revisions);
  url.searchParams.set("order", "topo");
  url.searchParams.set("per_page", String(maxCount));
  const response = await fetchJson<GitLabCommit[]>(url, { signal });
  return response.map(normalizeGitLabCommit);
}

async function fetchBitbucketLog(
  repository: ResolvedRepository,
  selection: RevisionSelection,
  request: RepositoryLogRequest,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const [workspace, name] = repository.path;
  const endpoint = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(workspace!)}/${encodeURIComponent(name!)}/commits`;

  if (selection.kind === "single") {
    return fetchBitbucketRevision(endpoint, selection.revision, null, request.maxCount, signal);
  }

  if (selection.kind === "difference") {
    return fetchBitbucketRevision(
      endpoint,
      selection.right,
      selection.left,
      request.maxCount,
      signal,
    );
  }

  const right = await fetchBitbucketRevision(
    endpoint,
    selection.right,
    selection.left,
    request.maxCount,
    signal,
  );
  const left = await fetchBitbucketRevision(
    endpoint,
    selection.left,
    selection.right,
    request.maxCount,
    signal,
  );
  return mergeSymmetricCommits(left, right, request.maxCount, request.leftRight === true);
}

async function fetchBitbucketRevision(
  endpoint: string,
  revision: string,
  exclude: string | null,
  maxCount: number,
  signal: AbortSignal,
): Promise<GitLogCommit[]> {
  const url = new URL(`${endpoint}/${encodeURIComponent(revision)}`);
  url.searchParams.set("pagelen", String(Math.max(10, maxCount)));
  if (exclude) {
    url.searchParams.set("exclude", exclude);
  }
  const response = await fetchJson<BitbucketCommitPage>(url, { signal });
  return response.values.map(normalizeBitbucketCommit).slice(0, maxCount);
}

function mergeSymmetricCommits(
  left: GitLogCommit[],
  right: GitLogCommit[],
  maxCount: number,
  showSides: boolean,
): GitLogCommit[] {
  const commits = new Map<string, GitLogCommit>();
  for (const commit of left) {
    commits.set(commit.hash, { ...commit, side: showSides ? "left" : null });
  }
  for (const commit of right) {
    const existing = commits.get(commit.hash);
    commits.set(commit.hash, {
      ...commit,
      side: existing ? null : showSides ? "right" : null,
    });
  }

  return mergeInTopologicalOrder([...commits.values()]).slice(0, maxCount);
}

// Symmetric ranges can require one request per side. Each response is already
// ordered, but combining them loses the interleaving that `git log` would show.
function mergeInTopologicalOrder(commits: GitLogCommit[]): GitLogCommit[] {
  const byHash = new Map(commits.map((commit) => [commit.hash, commit]));
  const childCounts = new Map(commits.map((commit) => [commit.hash, 0]));

  for (const commit of commits) {
    for (const parent of commit.parents) {
      if (childCounts.has(parent)) {
        childCounts.set(parent, childCounts.get(parent)! + 1);
      }
    }
  }

  const ready = commits.filter((commit) => childCounts.get(commit.hash) === 0);
  const ordered: GitLogCommit[] = [];
  while (ready.length > 0) {
    ready.sort(compareCommitDates);
    const commit = ready.shift()!;
    ordered.push(commit);
    for (const parent of commit.parents) {
      if (!byHash.has(parent)) {
        continue;
      }
      const remaining = childCounts.get(parent)! - 1;
      childCounts.set(parent, remaining);
      if (remaining === 0) {
        ready.push(byHash.get(parent)!);
      }
    }
  }

  if (ordered.length !== commits.length) {
    const included = new Set(ordered.map((commit) => commit.hash));
    ordered.push(
      ...commits.filter((commit) => !included.has(commit.hash)).sort(compareCommitDates),
    );
  }

  return ordered;
}

function compareCommitDates(left: GitLogCommit, right: GitLogCommit): number {
  return dateValue(right.committer.date) - dateValue(left.committer.date);
}

function dateValue(date: string | null): number {
  const value = date ? Date.parse(date) : 0;
  return Number.isNaN(value) ? 0 : value;
}

function resolveRepository(value: string): ResolvedRepository {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid repository URL: ${value}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported repository URL protocol: ${url.protocol}`);
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  if (path.length > 0) {
    path[path.length - 1] = path[path.length - 1]!.replace(/\.git$/i, "");
  }

  if (hostname === "github.com" && path.length === 2) {
    return {
      provider: "github",
      canonicalUrl: `https://github.com/${path.join("/")}`,
      path,
    };
  }
  if (hostname === "gitlab.com" && path.length >= 2) {
    return {
      provider: "gitlab",
      canonicalUrl: `https://gitlab.com/${path.join("/")}`,
      path,
    };
  }
  if (hostname === "bitbucket.org" && path.length === 2) {
    return {
      provider: "bitbucket",
      canonicalUrl: `https://bitbucket.org/${path.join("/")}`,
      path,
    };
  }

  throw new Error(`Unsupported public repository URL: ${value}`);
}

function validateRevision(value: string): void {
  if (
    !value ||
    value.startsWith(".") ||
    value.endsWith(".") ||
    value.includes("..") ||
    /\s/.test(value)
  ) {
    throw new Error(`Unsupported revision: ${value || "(empty)"}`);
  }
}

function validateMaxCount(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("maxCount must be an integer from 1 to 100.");
  }
}

function formatRevisionSelection(selection: RevisionSelection): string {
  switch (selection.kind) {
    case "single":
      return selection.revision;
    case "difference":
      return `${selection.left}..${selection.right}`;
    case "symmetric":
      return `${selection.left}...${selection.right}`;
  }
}

function selectionRevisions(selection: RevisionSelection): string[] {
  return selection.kind === "single" ? [selection.revision] : [selection.left, selection.right];
}

function isFullObjectId(value: string): boolean {
  return /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
}

function createCacheKey(repository: ResolvedRepository, request: RepositoryLogRequest): string {
  const url = new URL("https://git-elements.invalid/cache/git-log");
  url.searchParams.set("provider", repository.provider);
  url.searchParams.set("repository", repository.canonicalUrl);
  url.searchParams.set("revisions", request.revisions);
  url.searchParams.set("max-count", String(request.maxCount));
  url.searchParams.set("left-right", String(request.leftRight === true));
  return url.href;
}

async function readCachedLog(key: string, immutable: boolean): Promise<GitLogCommit[] | null> {
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

    return (await response.json()) as GitLogCommit[];
  } catch {
    await cache.delete(key).catch(() => false);
    return null;
  }
}

async function writeCachedLog(key: string, commits: GitLogCommit[]): Promise<void> {
  const cache = await openCache();
  if (!cache) {
    return;
  }

  try {
    await cache.put(
      key,
      new Response(JSON.stringify(commits), {
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

async function fetchJson<T>(url: URL | string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(
      `Unable to load Git history from ${String(url)}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

function withSearchParams(url: string, values: Record<string, string>): URL {
  const result = new URL(url);
  for (const [name, value] of Object.entries(values)) {
    result.searchParams.set(name, value);
  }
  return result;
}

interface GitHubCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: { name: string; email?: string | null; date?: string | null } | null;
    committer: { name: string; email?: string | null; date?: string | null } | null;
  };
  parents?: Array<{ sha: string }>;
}

interface GitHubComparison {
  total_commits: number;
  commits: GitHubCommit[];
}

function normalizeGitHubCommit(commit: GitHubCommit): GitLogCommit {
  return {
    hash: commit.sha,
    message: commit.commit.message,
    author: normalizeIdentity(commit.commit.author),
    committer: normalizeIdentity(commit.commit.committer),
    parents: commit.parents?.map((parent) => parent.sha) ?? [],
    href: commit.html_url ?? "",
    side: null,
  };
}

interface GitLabCommit {
  id: string;
  message: string;
  author_name: string;
  author_email?: string;
  authored_date?: string;
  committer_name: string;
  committer_email?: string;
  committed_date?: string;
  parent_ids?: string[];
  web_url?: string;
}

function normalizeGitLabCommit(commit: GitLabCommit): GitLogCommit {
  return {
    hash: commit.id,
    message: commit.message,
    author: {
      name: commit.author_name,
      email: commit.author_email ?? null,
      date: commit.authored_date ?? null,
    },
    committer: {
      name: commit.committer_name,
      email: commit.committer_email ?? null,
      date: commit.committed_date ?? null,
    },
    parents: commit.parent_ids ?? [],
    href: commit.web_url ?? "",
    side: null,
  };
}

interface BitbucketCommitPage {
  values: BitbucketCommit[];
}

interface BitbucketCommit {
  hash: string;
  message: string;
  date?: string;
  author?: { raw?: string };
  parents?: Array<{ hash: string }>;
  links?: { html?: { href?: string } };
}

function normalizeBitbucketCommit(commit: BitbucketCommit): GitLogCommit {
  const author = commit.author?.raw?.replace(/\s*<[^>]+>\s*$/, "") ?? "";
  const email = /<([^>]+)>\s*$/.exec(commit.author?.raw ?? "")?.[1] ?? null;
  const identity = { name: author, email, date: commit.date ?? null };
  return {
    hash: commit.hash,
    message: commit.message,
    author: identity,
    committer: { ...identity },
    parents: commit.parents?.map((parent) => parent.hash) ?? [],
    href: commit.links?.html?.href ?? "",
    side: null,
  };
}

function normalizeIdentity(
  identity: { name: string; email?: string | null; date?: string | null } | null,
): GitLogIdentity {
  return {
    name: identity?.name ?? "",
    email: identity?.email ?? null,
    date: identity?.date ?? null,
  };
}
