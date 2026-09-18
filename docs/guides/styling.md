# Styling

Both elements use shadow DOM. Customize their palettes and typography with inherited CSS custom
properties, and target specific rendered structures through CSS parts.

## Themes

The elements follow the operating-system color preference by default. Set `theme="light"` or
`theme="dark"` when the surrounding surface has a fixed theme:

```html
<git-diff theme="dark" src="./changes.patch"></git-diff>
<git-log theme="dark" repository="https://github.com/erkde/git-elements.js" revisions="main">
</git-log>
```

## `<git-diff>` custom properties

```css
git-diff {
  --git-diff-bg: #171328;
  --git-diff-text-color: #e9e4ff;
  --git-diff-border-color: #4c426d;
  --git-diff-muted-color: #968db5;
  --git-diff-add-text: #7de2b8;
  --git-diff-del-text: #ff8fa3;
  --git-diff-hunk-text: #b5a4ff;
  --git-diff-meta-text: #f1c97a;
  --git-diff-hover-bg: rgb(255 255 255 / 4.5%);
  --git-diff-font-family: ui-monospace, monospace;
  --git-diff-font-size: 13px;
  --git-diff-line-height: 20px;
  --git-diff-loading-delay: 200ms;
}
```

Exposed parts include `container`, `file`, `file-header`, `file-path`, `status`, `file-meta`, `table`,
`row`, `hunk-header`, `line-num`, `old-line-num`, `new-line-num`, `content`, `loading`, and `error`.
File status and line type variants are also exposed as part names.

```css
git-diff::part(file-header) {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

## `<git-log>` custom properties

```css
git-log {
  --git-log-bg: #171328;
  --git-log-text-color: #e9e4ff;
  --git-log-border-color: #4c426d;
  --git-log-muted-color: #968db5;
  --git-log-link-color: #b5a4ff;
  --git-log-left-color: #ff8fa3;
  --git-log-right-color: #7de2b8;
  --git-log-hover-bg: rgb(255 255 255 / 4.5%);
  --git-log-font-family: ui-monospace, monospace;
  --git-log-font-size: 13px;
  --git-log-line-height: 20px;
  --git-log-loading-delay: 200ms;
}
```

Exposed parts include `list`, `commit`, `side`, `side-left`, `side-right`, `hash`, `message`,
`author`, `date`, `loading`, and `error`.

```css
git-log::part(hash) {
  font-weight: 700;
}
```
