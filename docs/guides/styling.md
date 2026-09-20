# Styling

All three elements use shadow DOM. Customize their palettes and typography with CSS custom
properties, and target specific rendered structures through CSS parts.

## Themes

The elements follow the operating-system color preference by default. Set `theme="light"` or
`theme="dark"` when the surrounding surface has a fixed theme:

```html
<git-diff
  theme="dark"
  src="./changes.patch"
></git-diff>
<git-log
  theme="dark"
  repository="https://github.com/erkde/git-elements.js"
  revisions="main"
>
</git-log>
<git-show
  theme="dark"
  repository="https://github.com/erkde/git-elements.js"
  revision="v0.1.1"
>
</git-show>
```

## Style `<git-diff>`

```css
git-diff {
  --git-diff-bg: #171328;
  --git-diff-text-color: #e9e4ff;
  --git-diff-add-text: #7de2b8;
  --git-diff-del-text: #ff8fa3;
}
```

The change summaries use the same colors as the patch. The addition and deletion colors above also
style numstat counts and stat bars. Muted text, annotations, paths, and row borders use the
corresponding diff properties.

```css
git-diff::part(file-header) {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

git-diff::part(stat-graph) {
  height: 12px;
}
```

See the complete [`<git-diff>` custom property](/components/git-diff#css-custom-properties) and
[CSS part](/components/git-diff#css-parts) lists, including every summary part.

## Style `<git-log>`

```css
git-log {
  --git-log-bg: #171328;
  --git-log-text-color: #e9e4ff;
  --git-log-link-color: #b5a4ff;
}
```

```css
git-log::part(hash) {
  font-weight: 700;
}
```

See all [`<git-log>` custom properties](/components/git-log#css-custom-properties) and
[CSS parts](/components/git-log#css-parts).

## Style `<git-show>`

```css
git-show {
  --git-show-bg: #171328;
  --git-show-text-color: #e9e4ff;
  --git-show-link-color: #b5a4ff;
}
```

The nested `<git-diff>` uses the show colors and typography for its shared properties. Set diff
colors on the exposed `diff` part to style its patch and change summaries:

```css
git-show::part(diff) {
  --git-diff-add-text: #7de2b8;
  --git-diff-del-text: #ff8fa3;
  --git-diff-meta-text: #f1c97a;
}
```

```css
git-show::part(subject) {
  letter-spacing: 0.02em;
}
```

See all [`<git-show>` custom properties](/components/git-show#css-custom-properties) and
[CSS parts](/components/git-show#css-parts).
