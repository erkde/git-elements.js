# Loading and errors

The elements follow a native resource-element lifecycle for asynchronous inputs.

## Loading state

While a resource is loading, the element exposes `aria-busy="true"` but renders no wording by
default. Supply named slots when the page needs visible loading or error content:

```html
<git-diff src="./changes.patch">
  <span slot="loading">Loading changes…</span>
  <span slot="error">Changes unavailable.</span>
</git-diff>
```

```html
<git-log
  repository="https://github.com/erkde/git-elements.js"
  revisions="main"
>
  <span slot="loading">Loading history…</span>
  <span slot="error">History unavailable.</span>
</git-log>
```

```html
<git-show
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
>
  <span slot="loading">Loading commit…</span>
  <span slot="error">Commit unavailable.</span>
</git-show>
```

Loading content appears after 150ms by default to avoid flicker on fast requests. Adjust the delay
with `--git-diff-loading-delay`, `--git-log-loading-delay`, or `--git-show-loading-delay`.

## Events

All three elements dispatch `load` after an external resource has loaded and rendered, or `error` when
the request fails:

```js
const log = document.querySelector("git-log");

log.addEventListener("load", () => {
  console.log("History loaded");
});

log.addEventListener("error", () => {
  console.log("History failed to load");
});
```

For repeated repository elements and stored results, see [Repository caching](/guides/repository-caching).
