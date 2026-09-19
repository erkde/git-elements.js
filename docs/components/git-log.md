<script setup>
import GitLogDemo from '../.vitepress/theme/components/GitLogDemo.vue'
</script>

# `<git-log>`

Render commit history from a public GitHub, GitLab.com, or Bitbucket Cloud repository.
See [supported Git hosts](/getting-started#supported-git-hosts) for accepted repository URL formats.

## Branch history

A single revision accepts a branch, tag, or full commit ID. This live example reads the latest six
commits from `git-elements.js`:

```html
<git-log
  repository="https://github.com/erkde/git-elements.js"
  revisions="main"
  max-count="6"
></git-log>
```

<GitLogDemo revisions="main" :max-count="6" />

## Revision sets

Revision sets follow `git log` semantics and use Git's own notation rather than provider-specific
attribute names.

### Two-dot

`A..B` shows commits reachable from `B` but not from `A`. This live example shows the commits added
between the first two published releases:

```html
<git-log repository="https://github.com/erkde/git-elements.js" revisions="v0.1.0..v0.1.1"></git-log>
```

<GitLogDemo revisions="v0.1.0..v0.1.1" />

### Three-dot

`A...B` shows commits reachable from either revision but not both:

```html
<git-log
  repository="https://github.com/owner/project"
  revisions="main...feature"
  left-right
></git-log>
```

`left-right` marks commits unique to the first revision with `<` and commits unique to the second
with `>`. It only affects symmetric three-dot logs.

## Limits

The element returns at most 30 commits by default. Use `max-count` to request between 1 and 100,
matching Git's `--max-count` concept.

The current implementation supports hosted public repositories only. It does not interpret
local-only names such as `HEAD`, `origin/main`, reflog expressions, or unpushed commits.

## API

<!--@include: ./_generated/git-log-api.md-->

See [loading and caching](/guides/loading-and-caching) for request sharing and cache behavior, and
[styling](/guides/styling) for custom properties and CSS parts.
