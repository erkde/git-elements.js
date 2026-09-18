const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */ `
:host {
  --git-log-bg: #f5f5f4;
  --git-log-text-color: #292524;
  --git-log-border-color: #d6d3d1;
  --git-log-muted-color: #78716c;
  --git-log-link-color: #006d8f;
  --git-log-left-color: #b4232c;
  --git-log-right-color: #167044;
  --git-log-hover-bg: rgba(41, 37, 36, 0.045);
  --git-log-font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  --git-log-font-size: 12px;
  --git-log-line-height: 20px;
  --git-log-loading-delay: 150ms;

  display: block;
  overflow-x: auto;
  border-radius: 4px;
  background-color: var(--git-log-bg);
  color: var(--git-log-text-color);
  font-family: var(--git-log-font-family);
  font-size: var(--git-log-font-size);
  line-height: var(--git-log-line-height);
}

@media (prefers-color-scheme: dark) {
  :host {
    --git-log-bg: #18181b;
    --git-log-text-color: #e4e4e7;
    --git-log-border-color: #3f3f46;
    --git-log-muted-color: #8b8b95;
    --git-log-link-color: #67c7e8;
    --git-log-left-color: #ff7a85;
    --git-log-right-color: #68d391;
    --git-log-hover-bg: rgba(255, 255, 255, 0.045);
  }
}

:host([theme="light"]) {
  --git-log-bg: #f5f5f4;
  --git-log-text-color: #292524;
  --git-log-border-color: #d6d3d1;
  --git-log-muted-color: #78716c;
  --git-log-link-color: #006d8f;
  --git-log-left-color: #b4232c;
  --git-log-right-color: #167044;
  --git-log-hover-bg: rgba(41, 37, 36, 0.045);
}

:host([theme="dark"]) {
  --git-log-bg: #18181b;
  --git-log-text-color: #e4e4e7;
  --git-log-border-color: #3f3f46;
  --git-log-muted-color: #8b8b95;
  --git-log-link-color: #67c7e8;
  --git-log-left-color: #ff7a85;
  --git-log-right-color: #68d391;
  --git-log-hover-bg: rgba(255, 255, 255, 0.045);
}

.resource-state[hidden] {
  display: none;
}

.resource-loading {
  animation: reveal-loading 0s var(--git-log-loading-delay) both;
}

@keyframes reveal-loading {
  from {
    visibility: hidden;
  }

  to {
    visibility: visible;
  }
}

.commit-list {
  min-width: max-content;
  margin: 0;
  padding: 5px 0;
  list-style: none;
}

.commit {
  display: grid;
  grid-template-columns: 2ch 9ch minmax(24ch, 1fr) auto 10ch;
  align-items: baseline;
  gap: 8px;
  padding: 2px 12px;
}

.commit:hover {
  background-color: var(--git-log-hover-bg);
}

.commit-side {
  color: var(--git-log-muted-color);
  font-weight: 700;
  text-align: center;
}

.side-left {
  color: var(--git-log-left-color);
}

.side-right {
  color: var(--git-log-right-color);
}

.commit-hash {
  overflow: hidden;
  color: var(--git-log-link-color);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-hash:hover {
  text-decoration: underline;
}

.commit-message {
  overflow: hidden;
  color: var(--git-log-text-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-author,
.commit-date {
  color: var(--git-log-muted-color);
  white-space: nowrap;
}
`);

export { sheet as gitLogStyleSheet };
