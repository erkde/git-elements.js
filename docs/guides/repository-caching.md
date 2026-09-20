# Repository caching

`<git-log>` and `<git-show>` share matching requests and store successful results for later use.

## Repeated components

If the same `<git-log>` appears in two places on a page, both instances share a load while it is in
flight. The same applies to identical `<git-show>` instances, including both requests needed to load
a commit and its patch:

```html
<git-show repository="https://github.com/erkde/git-elements.js" revision="v0.1.1"></git-show>

<!-- Elsewhere on the page -->
<git-show repository="https://github.com/erkde/git-elements.js" revision="v0.1.1"></git-show>
```

Each element still renders and emits events independently. Sharing applies within a component type
when its inputs match. For `<git-log>`, that includes the repository, revisions, `max-count`, and
`left-right` settings. `<git-log>` and `<git-show>` do not share their fetched results.

## Stored results

After a successful load, `<git-log>` and `<git-show>` each store their results in a separate browser
Cache Storage cache when it is available. Later identical instances can reuse those results, even
after a page reload, without another provider request. Failed loads are not stored. In-flight
sharing still works when Cache Storage is unavailable, but later loads will fetch again.

Results for mutable names such as branches and tags are reused for one hour. Results whose revisions
are all full object IDs have no time limit in the library. The browser may evict either kind under
its normal storage policy.

Call `reload()` when the user explicitly asks for fresh repository data:

```js
await document.querySelector("git-log").reload();
await document.querySelector("git-show").reload();
```

`reload()` bypasses a stored response while still sharing an identical reload already in flight.
`<git-diff>` does not use this repository cache; its `src` requests rely on the browser's ordinary
HTTP caching.

See [supported Git hosts](/guides/supported-git-hosts#requests-and-rate-limits) for provider request
limits.
