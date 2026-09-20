<script setup>
import GitDiffPlayground from '../.vitepress/theme/components/GitDiffPlayground.vue'
import SampleDiff from '../.vitepress/theme/components/SampleDiff.vue'
</script>

# `<git-diff>`

Render uncolored unified diff text as an accessible, themeable file-by-file view.

## Playground

Edit the patch below. The `patch` property updates the rendered output immediately.

<GitDiffPlayground />

:::: details View playground source
::: code-group

```html [Markup]
<div class="playground">
  <label for="patch-input">Unified diff</label>
  <textarea id="patch-input" spellcheck="false"></textarea>

  <git-diff
    id="patch-output"
    line-numbers
  ></git-diff>
</div>
```

```js [JavaScript]
import { GitDiffElement } from "@erkde/git-elements/components/git-diff";

customElements.define("git-diff", GitDiffElement);

const input = document.querySelector("#patch-input");
const output = document.querySelector("#patch-output");

function render() {
  output.patch = input.value;
}

input.addEventListener("input", render);
render();
```

:::
::::

## Input methods

Every input resolves to unified diff text. Choose the form that fits where the patch already lives.
Unlike [`<git-log>` and `<git-show>`](/guides/supported-git-hosts), `<git-diff>` does not
load directly from a repository host.

### URL

Use `src` for a browser-accessible patch file:

```html
<git-diff src="./changes.patch"></git-diff>
```

### JavaScript

Use `patch` when the diff is already in memory:

```js
const diff = document.querySelector("git-diff");
diff.patch = rawDiffText;
```

Assigning `patch` cancels any pending `src` request so a late response cannot replace explicitly
supplied content.

### Inline text

A non-executable `text/plain` script keeps declarative patches beside their markup. Common HTML
indentation is removed.

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

## Supported changes

The parser supports multi-file patches, additions, deletions, renames, copies, mode changes, binary
file indicators, and Git-quoted paths.

<SampleDiff />

Pass output generated with `git diff --no-color` for consistent rendering.

## Line numbers

Old and new line-number gutters are hidden by default. Enable them with the `line-numbers` boolean
attribute or `lineNumbers` property:

```html
<git-diff
  src="./changes.patch"
  line-numbers
></git-diff>
```

## Change summaries

### Stat

Add `stat` for a visual, per-file summary with a totals line:

```html
<git-diff
  src="./changes.patch"
  stat
></git-diff>
```

<SampleDiff stat />

Each bar shows additions and deletions, scaled against the file with the most changed lines. File
paths sit above the bars and wrap on narrow screens. The view includes compact labels for new,
deleted, renamed, copied, and mode-changed files. Binary files show “Binary” without a bar because
the patch does not provide their byte counts. If several summary attributes are present, `stat`
takes precedence.

### Numstat

Add `numstat` to show additions and deletions for each changed file in place of the patch:

```html
<git-diff
  src="./changes.patch"
  numstat
></git-diff>
```

<SampleDiff numstat />

Binary files show `-` for both counts. Metadata-only changes show `0` and `0`. File paths wrap to
fit narrow screens. If both `numstat` and `shortstat` are present, `numstat` is shown.

### Short stat

Add `shortstat` to show a single line with changed-file, insertion, and deletion totals in place of
the patch:

```html
<git-diff
  src="./changes.patch"
  shortstat
></git-diff>
```

<SampleDiff shortstat />

The summary is calculated from the supplied patch. Binary and metadata-only files count as changed
files but add no text-line counts. A partial patch produces a summary of only the supplied changes.

## API

<!--@include: ./_generated/git-diff-api.md-->

See [loading and errors](/guides/loading-and-errors) and [styling](/guides/styling) for the shared
component conventions.
