# git-elements.js

Web components for presenting Git command output on the web.

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

## Direction

`@erkde/git-elements` is intended to grow into a focused collection of elements for Git output,
such as commit history and working-tree status. Each component will use a documented, stable Git
output format while sharing the same loading, theming, and terminal-inspired presentation
conventions.
