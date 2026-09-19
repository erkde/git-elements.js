const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */ `
:host {
  --git-show-bg: #f5f5f4;
  --git-show-text-color: #292524;
  --git-show-border-color: #d6d3d1;
  --git-show-muted-color: #78716c;
  --git-show-link-color: #006d8f;
  --git-show-font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  --git-show-font-size: 12px;
  --git-show-line-height: 20px;
  --git-show-loading-delay: 150ms;

  display: block;
  overflow-x: auto;
  border-radius: 4px;
  background-color: var(--git-show-bg);
  color: var(--git-show-text-color);
  font-family: var(--git-show-font-family);
  font-size: var(--git-show-font-size);
  line-height: var(--git-show-line-height);
}

@media (prefers-color-scheme: dark) {
  :host {
    --git-show-bg: #18181b;
    --git-show-text-color: #e4e4e7;
    --git-show-border-color: #3f3f46;
    --git-show-muted-color: #8b8b95;
    --git-show-link-color: #67c7e8;
  }
}

:host([theme="light"]) {
  --git-show-bg: #f5f5f4;
  --git-show-text-color: #292524;
  --git-show-border-color: #d6d3d1;
  --git-show-muted-color: #78716c;
  --git-show-link-color: #006d8f;
}

:host([theme="dark"]) {
  --git-show-bg: #18181b;
  --git-show-text-color: #e4e4e7;
  --git-show-border-color: #3f3f46;
  --git-show-muted-color: #8b8b95;
  --git-show-link-color: #67c7e8;
}

.resource-state[hidden],
.commit-show[hidden] {
  display: none;
}

.resource-loading {
  animation: reveal-loading 0s var(--git-show-loading-delay) both;
}

@keyframes reveal-loading {
  from {
    visibility: hidden;
  }

  to {
    visibility: visible;
  }
}

.commit-header {
  padding: 10px 12px 12px;
}

.commit-line,
.identity-line {
  display: flex;
  gap: 1ch;
  white-space: nowrap;
}

.label {
  flex: 0 0 7ch;
  color: var(--git-show-muted-color);
}

.commit-hash {
  overflow: hidden;
  color: var(--git-show-link-color);
  text-decoration: none;
  text-overflow: ellipsis;
}

.commit-hash:hover {
  text-decoration: underline;
}

.commit-message {
  padding: 12px 0 2px 8ch;
  white-space: pre-wrap;
}

.commit-subject {
  font-weight: 700;
}

.commit-body:not(:empty) {
  padding-top: 4px;
}

git-diff {
  --git-diff-bg: var(--git-show-bg);
  --git-diff-text-color: var(--git-show-text-color);
  --git-diff-border-color: var(--git-show-border-color);
  --git-diff-muted-color: var(--git-show-muted-color);
  --git-diff-font-family: var(--git-show-font-family);
  --git-diff-font-size: var(--git-show-font-size);
  --git-diff-line-height: var(--git-show-line-height);

  border-top: 1px solid var(--git-show-border-color);
  border-radius: 0;
}
`);

export { sheet as gitShowStyleSheet };
