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

Component entry points export their element classes without registering them. To register only the
element you use:

```js
import { GitDiffElement } from "@erkde/git-elements/components/git-diff";

customElements.define("git-diff", GitDiffElement);
```

`<git-show>` renders its patch with `<git-diff>`, so selective registration for it requires both
elements. The package root handles that dependency automatically.

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

## Render one commit

Use `<git-show>` to present one commit and the patch it introduced:

```html
<git-show repository="https://github.com/erkde/git-elements.js" revision="v0.1.1"></git-show>
```

See the [`<git-show>` reference](/components/git-show) for revision and caching behavior.

## Supported Git hosts

`<git-log>` and `<git-show>` load public repositories from these hosted services:

| Host            | `repository` URL format                                      |
| --------------- | ------------------------------------------------------------ |
| GitHub          | `https://github.com/owner/repo`                              |
| GitLab.com      | `https://gitlab.com/group/project` (including nested groups) |
| Bitbucket Cloud | `https://bitbucket.org/workspace/repo`                       |

Private repositories and self-hosted Git services are not supported. `<git-diff>` has no
repository-host integration: it renders unified diff text supplied inline, through JavaScript, or
from a browser-accessible `src` URL.

## Loading states

All three elements expose named slots and native-style `load` and `error` events for asynchronous
inputs. They render no status wording by default, leaving the surrounding page in control.

```html
<git-log repository="https://github.com/erkde/git-elements.js" revisions="main">
  <span slot="loading">Loading history…</span>
  <span slot="error">History unavailable.</span>
</git-log>
```

Learn more about [loading and caching](/guides/loading-and-caching) or [styling](/guides/styling).
