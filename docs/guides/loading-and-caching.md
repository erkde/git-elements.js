# Loading and caching

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

## Repository cache

Within each component type, identical `<git-log>` or `<git-show>` instances share in-flight requests.
Successful responses are stored in separate browser Cache Storage entries when it is available,
keeping them outside the page's JavaScript heap.

Logs and shows beginning from mutable names such as branches and tags are reused for one hour.
Requests whose revisions are all full object IDs are immutable and do not expire. The browser may
evict either kind under its normal storage policy.

Call `reload()` when the user explicitly asks for fresh repository data:

```js
await document.querySelector("git-log").reload();
await document.querySelector("git-show").reload();
```

`reload()` bypasses a stored response while still sharing an identical reload already in flight.
`<git-diff>` relies on the browser's ordinary HTTP caching for `src` resources.
