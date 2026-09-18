# Getting started

`@erkde/git-elements` provides framework-independent custom elements for presenting Git command
output in a browser.

## Install

```sh
npm install @erkde/git-elements
```

Import the package once to register all available elements:

```js
import "@erkde/git-elements";
```

You can also import an individual component:

```js
import "@erkde/git-elements/components/git-diff";
import "@erkde/git-elements/components/git-log";
```

## Render a diff

Point `<git-diff>` at browser-accessible unified diff text:

```html
<git-diff src="./changes.patch" line-numbers></git-diff>
```

See the [`<git-diff>` reference](/components/git-diff) for inline and JavaScript inputs.

## Render repository history

Point `<git-log>` at a supported public repository and select a revision:

```html
<git-log
  repository="https://github.com/erkde/git-elements.js"
  revisions="main"
  max-count="10"
></git-log>
```

See the [`<git-log>` reference](/components/git-log) for two-dot and three-dot revision sets.

## Loading states

Both elements expose named slots and native-style `load` and `error` events for asynchronous
inputs. They render no status wording by default, leaving the surrounding page in control.

```html
<git-log repository="https://github.com/erkde/git-elements.js" revisions="main">
  <span slot="loading">Loading history…</span>
  <span slot="error">History unavailable.</span>
</git-log>
```

Learn more about [loading and caching](/guides/loading-and-caching) or [styling](/guides/styling).
