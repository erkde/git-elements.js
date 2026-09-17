# git-elements.js

Web components for presenting Git command output on the web.

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

The parser supports ordinary multi-file patches, additions and deletions, renames and copies,
mode-only changes, binary-file indicators, and Git-quoted paths. Pass uncolored output from
`git diff --no-color` for consistent rendering.

## Direction

`git-elements` is intended to grow into a focused collection of elements for Git output, such as
commit history and working-tree status. Each component will use a documented, stable Git output
format while sharing the same loading, theming, and terminal-inspired presentation conventions.
