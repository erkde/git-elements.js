# git-elements.js

Web components for presenting Git command output on the web.

[Documentation and live examples](https://erkde.github.io/git-elements.js/)

## Components

- [`<git-diff>`](#git-diff) renders unified diff text from a URL, inline markup, or JavaScript.
- [`<git-log>`](#git-log) loads and renders commit history from a public hosted repository.
- [`<git-show>`](#git-show) loads and renders one hosted commit together with its patch.

## Installation

```sh
npm install @erkde/git-elements
```

Import the package once to register its custom elements:

```js
import "@erkde/git-elements";
```

## `<git-diff>`

Render a diff from a URL:

```html
<git-diff src="./changes.patch"></git-diff>
```

Line-number gutters are optional:

```html
<git-diff src="./changes.patch" line-numbers></git-diff>
```

Render an inline unified diff:

```html
<git-diff>
  <script type="text/plain">
    --- a/message.txt
    +++ b/message.txt
    @@ -1 +1 @@
    -Hello, world!
    +Hello, Git Elements!
  </script>
</git-diff>
```

Assign raw diff text from JavaScript with the `patch` property:

```js
document.querySelector("git-diff").patch = rawDiff;
```

Assigning `patch` directly cancels any pending `src` request so that a late response cannot replace
the explicitly supplied content.

External sources follow the native resource-element lifecycle. The element dispatches `load` after
rendering or `error` when the source cannot be loaded. It renders no status UI by default; optional
named slots provide declarative loading and error content. Loading content appears after 150ms to
avoid flicker and can be adjusted with `--git-diff-loading-delay`.

```html
<git-diff src="./changes.patch">
  <div slot="loading">Loading changes…</div>
  <div slot="error">Changes unavailable.</div>
</git-diff>
```

```js
const diff = document.querySelector("git-diff");
diff.addEventListener("load", () => console.log("Diff loaded"));
diff.addEventListener("error", () => console.log("Diff failed to load"));
```

The parser supports ordinary multi-file patches, additions and deletions, renames and copies,
mode-only changes, binary-file indicators, and Git-quoted paths. Pass uncolored output from
`git diff --no-color` for consistent rendering.

Add the `shortstat` attribute to show changed-file, insertion, and deletion totals in place of the patch.
The summary is derived from the supplied patch, including when it is rendered by `<git-show>`.

## `<git-log>`

Render commit history from a public GitHub, GitLab.com, or Bitbucket Cloud repository. A single
revision accepts a branch, tag, or full commit ID:

```html
<git-log repository="https://github.com/erkde/git-elements.js" revisions="main"></git-log>
```

Two-dot and three-dot revision sets follow `git log` semantics:

```html
<!-- Commits reachable from feature but not main. -->
<git-log repository="https://github.com/owner/project" revisions="main..feature"></git-log>

<!-- Commits reachable from either side but not both. -->
<git-log
  repository="https://github.com/owner/project"
  revisions="main...feature"
  left-right
></git-log>
```

`left-right` marks commits unique to the first revision with `<` and commits unique to the second
with `>`. It only affects symmetric three-dot logs.

The element returns at most 30 commits by default. Use `max-count` to request between 1 and 100,
matching Git's `--max-count` concept:

```html
<git-log repository="https://gitlab.com/group/project" revisions="main" max-count="50">
  <div slot="loading">Loading history…</div>
  <div slot="error">History unavailable.</div>
</git-log>
```

Like `<git-diff>`, `<git-log>` dispatches `load` and `error` and exposes `loading` and `error` slots.
The normalized entries are available through the read-only `commits` property. Call `reload()` to
bypass cached data and fetch the log again.

Successful public responses are shared between identical in-flight requests and stored in Cache
Storage when the browser makes it available. Logs starting from mutable names are reused for one
hour; logs whose revisions are all full object IDs are immutable and do not expire. Cached data is
stored outside the JavaScript heap, and a browser may evict it under its normal storage policy.

The first release supports hosted public repositories only. It does not interpret local-only names
such as `HEAD`, `origin/main`, reflog expressions, or unpushed commits.

## `<git-show>`

Render one commit and the patch it introduced from a public GitHub, GitLab.com, or Bitbucket Cloud
repository:

```html
<git-show repository="https://github.com/erkde/git-elements.js" revision="v0.1.1" line-numbers>
  <div slot="loading">Loading commit…</div>
  <div slot="error">Commit unavailable.</div>
</git-show>
```

`revision` accepts a branch, tag, or full commit ID. Branch and tag results are cached for one hour;
full object IDs do not expire. Identical requests share both the commit metadata request and diff
request. Call `reload()` to bypass a stored result.

## Direction

`@erkde/git-elements` is intended to grow into a focused collection of elements for Git output,
such as working-tree status. Each component will use documented Git semantics while sharing the
same loading, theming, and terminal-inspired presentation conventions.
