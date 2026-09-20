<script setup>
import GitShowDemo from '../.vitepress/theme/components/GitShowDemo.vue'
</script>

# `<git-show>`

Render one commit's metadata and patch from a public GitHub, GitLab.com, or Bitbucket Cloud
repository.
See [supported Git hosts](/getting-started#supported-git-hosts) for accepted repository URL formats.

## Commit and patch

`revision` accepts a branch, tag, or full commit ID. Like `git show <revision>`, a branch or tag
resolves to the commit it currently names.

```html
<git-show
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
  line-numbers
></git-show>
```

<GitShowDemo revision="v0.1.1" />

## Summaries

### Short stat

Add `shortstat` to show changed-file, insertion, and deletion totals in place of the commit patch:

```html
<git-show
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
  shortstat
></git-show>
```

<GitShowDemo revision="v0.1.1" shortstat />

The totals are calculated from the commit patch loaded by the nested `<git-diff>` element.

### Numstat

Add `numstat` to show additions and deletions for each file in the commit patch:

```html
<git-show
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
  numstat
></git-show>
```

<GitShowDemo revision="v0.1.1" numstat />

The counts come from the same patch as the full view. Binary files show `-` for both counts. If
both summary attributes are present, `numstat` is shown.

## Revision semantics

`<git-show>` accepts one revision rather than a revision set. Two-dot and three-dot expressions
belong to [`<git-log>`](/components/git-log) and are rejected here.

For ordinary commits, the patch shows the commit relative to its first parent. Root commits are
shown relative to an empty tree. Provider diff-size limits still apply to unusually large commits.

The current implementation supports hosted public repositories only. It does not interpret
local-only names such as `HEAD`, `origin/main`, reflog expressions, or unpushed commits.

## Loading and caching

An uncached show requires commit metadata and diff data from the provider. Identical instances
share both requests and cache the combined result in Cache Storage when available. Mutable branch
and tag names are reused for one hour; full object IDs do not expire.

Call `reload()` to bypass a stored result. It still shares an identical reload already in flight.

## API

<!--@include: ./_generated/git-show-api.md-->

See [loading and caching](/guides/loading-and-caching) for request behavior, and
[styling](/guides/styling) for custom properties and CSS parts.
