const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */ `
:host {
  --git-diff-bg: #f5f5f4;
  --git-diff-text-color: #292524;
  --git-diff-border-color: #d6d3d1;
  --git-diff-muted-color: #78716c;
  --git-diff-add-text: #167044;
  --git-diff-del-text: #b4232c;
  --git-diff-hunk-text: #006d8f;
  --git-diff-meta-text: #806000;
  --git-diff-hover-bg: rgba(41, 37, 36, 0.045);
  --git-diff-font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  --git-diff-font-size: 12px;
  --git-diff-line-height: 20px;

  display: block;
  overflow-x: auto;
  border-radius: 4px;
  background-color: var(--git-diff-bg);
  color: var(--git-diff-text-color);
  font-family: var(--git-diff-font-family);
  font-size: var(--git-diff-font-size);
  line-height: var(--git-diff-line-height);
  tab-size: 2;
}

@media (prefers-color-scheme: dark) {
  :host {
    --git-diff-bg: #18181b;
    --git-diff-text-color: #e4e4e7;
    --git-diff-border-color: #3f3f46;
    --git-diff-muted-color: #8b8b95;
    --git-diff-add-text: #68d391;
    --git-diff-del-text: #ff7a85;
    --git-diff-hunk-text: #67c7e8;
    --git-diff-meta-text: #e5bd68;
    --git-diff-hover-bg: rgba(255, 255, 255, 0.045);
  }
}

:host([theme="light"]) {
  --git-diff-bg: #f5f5f4;
  --git-diff-text-color: #292524;
  --git-diff-border-color: #d6d3d1;
  --git-diff-muted-color: #78716c;
  --git-diff-add-text: #167044;
  --git-diff-del-text: #b4232c;
  --git-diff-hunk-text: #006d8f;
  --git-diff-meta-text: #806000;
  --git-diff-hover-bg: rgba(41, 37, 36, 0.045);
}

:host([theme="dark"]) {
  --git-diff-bg: #18181b;
  --git-diff-text-color: #e4e4e7;
  --git-diff-border-color: #3f3f46;
  --git-diff-muted-color: #8b8b95;
  --git-diff-add-text: #68d391;
  --git-diff-del-text: #ff7a85;
  --git-diff-hunk-text: #67c7e8;
  --git-diff-meta-text: #e5bd68;
  --git-diff-hover-bg: rgba(255, 255, 255, 0.045);
}

.file-diff {
  padding: 6px 0 8px;
}

.file-diff + .file-diff {
  border-top: 1px solid var(--git-diff-border-color);
}

.file-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 3px 12px 5px;
  color: var(--git-diff-text-color);
  font-weight: 700;
  white-space: pre;
}

.file-path {
  min-width: 0;
}

.file-status {
  color: var(--git-diff-meta-text);
  font-weight: 400;
}

.file-status::before {
  content: "[";
}

.file-status::after {
  content: "]";
}

.file-meta {
  display: flex;
  flex-direction: column;
  padding: 0 12px 5px;
  color: var(--git-diff-meta-text);
}

.meta-item::before {
  content: "# ";
  color: var(--git-diff-muted-color);
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
}

.line-num {
  width: 1%;
  min-width: 4ch;
  padding: 0 7px;
  color: var(--git-diff-muted-color);
  text-align: right;
  user-select: none;
  vertical-align: top;
  white-space: nowrap;
}

:host(:not([line-numbers])) .line-num {
  display: none;
}

.old-line-num {
  padding-left: 12px;
}

.new-line-num {
  padding-right: 10px;
  border-right: 1px solid var(--git-diff-border-color);
}

.line-content {
  padding: 0 12px;
  color: var(--git-diff-text-color);
  white-space: pre;
}

.diff-row:hover {
  background-color: var(--git-diff-hover-bg);
}

.row-hunk {
  color: var(--git-diff-hunk-text);
}

.row-hunk .line-num {
  color: transparent;
}

.row-hunk .line-content {
  padding-top: 4px;
  padding-bottom: 4px;
  color: var(--git-diff-hunk-text);
}

.row-addition .line-content {
  color: var(--git-diff-add-text);
}

.row-deletion .line-content {
  color: var(--git-diff-del-text);
}
`);

export { sheet as gitDiffStyleSheet };
