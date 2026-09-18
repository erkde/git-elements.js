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

  <git-diff id="patch-output" line-numbers></git-diff>
</div>
```

```js [JavaScript]
import "@erkde/git-elements/components/git-diff";

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
<git-diff src="./changes.patch" line-numbers></git-diff>
```

## API

### Attributes and properties

| Name           | Kind                         | Purpose                                                  |
| -------------- | ---------------------------- | -------------------------------------------------------- |
| `src`          | Attribute / property         | Fetch unified diff text from a URL.                      |
| `patch`        | JavaScript property          | Set raw unified diff text directly and rerender.         |
| `parsedDiffs`  | Read-only property           | Inspect parsed files, hunks, line numbers, and metadata. |
| `line-numbers` | Boolean attribute / property | Show old and new line-number gutters.                    |
| `theme`        | Attribute                    | Use `light` or `dark`; omit it for OS preference.        |
| `<script>`     | Child element                | Provide an inline patch with `type="text/plain"`.        |

### Slots and events

| Name      | Kind       | Purpose                                                                    |
| --------- | ---------- | -------------------------------------------------------------------------- |
| `loading` | Named slot | Content shown when a `src` request takes longer than the configured delay. |
| `error`   | Named slot | Content shown when a `src` request fails.                                  |
| `load`    | Event      | Fires after a `src` patch has loaded and rendered.                         |
| `error`   | Event      | Fires when a `src` patch cannot be loaded.                                 |

See [loading and caching](/guides/loading-and-caching) and [styling](/guides/styling) for the shared
component conventions.
