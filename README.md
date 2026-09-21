# git-elements.js

Framework-independent custom elements for presenting Git diffs and history in a browser.

[Documentation and live examples](https://erkde.github.io/git-elements.js/)

## Install

```sh
npm install @erkde/git-elements
```

Import the package once in your app's JavaScript or TypeScript entry file to register all three elements:

```js
import "@erkde/git-elements";
```

You can then use the elements in HTML or framework templates. See [getting started](https://erkde.github.io/git-elements.js/getting-started.html) for a complete page example and individual element registration.

## Components

### `<git-diff>`

Render unified diff text from a browser-accessible URL, inline markup, or the JavaScript `patch` property. Add `line-numbers` for gutters, or `stat`, `numstat`, or `shortstat` for a change summary.

```html
<git-diff src="./changes.patch" line-numbers></git-diff>
```

[Explore `<git-diff>`](https://erkde.github.io/git-elements.js/components/git-diff.html)

### `<git-log>`

Render commit history from a public GitHub, GitLab.com, or Bitbucket Cloud repository. Select a branch, tag, commit ID, or two-dot or three-dot revision set with `revisions`.

```html
<git-log
  repository="https://github.com/erkde/git-elements.js"
  revisions="main"
  max-count="10"
></git-log>
```

[Explore `<git-log>`](https://erkde.github.io/git-elements.js/components/git-log.html)

### `<git-show>`

Render one hosted commit and its patch. `revision` accepts a branch, tag, or full commit ID.

```html
<git-show repository="https://github.com/erkde/git-elements.js" revision="v0.1.1"></git-show>
```

[Explore `<git-show>`](https://erkde.github.io/git-elements.js/components/git-show.html)

## Guides

- [Supported Git hosts](https://erkde.github.io/git-elements.js/guides/supported-git-hosts.html) covers repository URLs, request limits, and large diffs. Repository loading supports public hosted repositories.
- [Loading and errors](https://erkde.github.io/git-elements.js/guides/loading-and-errors.html) explains the `loading` and `error` slots and the `load` and `error` events.
- [Repository caching](https://erkde.github.io/git-elements.js/guides/repository-caching.html) explains request sharing, stored results, and `reload()` for `<git-log>` and `<git-show>`.
- [Styling](https://erkde.github.io/git-elements.js/guides/styling.html) covers themes, CSS custom properties, and parts.
