<script setup>
import GitShowDemo from '../.vitepress/theme/components/GitShowDemo.vue'
</script>

# `<git-show>`

Render one commit's metadata and patch from a public GitHub, GitLab.com, or Bitbucket Cloud
repository.
See [supported Git hosts](/guides/supported-git-hosts) for accepted repository URL formats and API limits.

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

## Change summaries

### Stat

Add `stat` for a per-file change graph and a totals line:

```html
<git-show
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
  stat
></git-show>
```

<GitShowDemo revision="v0.1.1" stat />

The bars and counts come from the loaded commit patch. New, deleted, renamed, copied, and
mode-changed files get compact labels. If several summary attributes are present, `stat` takes
precedence.

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
`numstat` and `shortstat` are both present, `numstat` is shown.

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

## Revision semantics

`<git-show>` accepts one revision rather than a revision set. Two-dot and three-dot expressions
belong to [`<git-log>`](/components/git-log) and are rejected here.

For ordinary commits, the patch shows the commit relative to its first parent. Root commits are
shown relative to an empty tree. See [large-diff limits](/guides/supported-git-hosts#large-diffs)
for commits whose host omits part of a patch.

The current implementation supports hosted public repositories only. It does not interpret
local-only names such as `HEAD`, `origin/main`, reflog expressions, or unpushed commits.

## Repository caching

An uncached show requires commit metadata and diff data from the provider. Identical instances
share both requests. See [repository caching](/guides/repository-caching) for stored results,
expiration, and `reload()` behavior.

## API

<!--@include: ./_generated/git-show-api.md-->

See [loading and errors](/guides/loading-and-errors) for states and events, and
[styling](/guides/styling) for custom properties and CSS parts.
