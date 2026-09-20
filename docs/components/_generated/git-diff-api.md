<!-- Generated from custom-elements.json. Do not edit directly. -->

### Attributes

| Name           | Type                | Description                                                     |
| -------------- | ------------------- | --------------------------------------------------------------- |
| `src`          | `string`            | Browser-accessible URL of a unified diff to fetch and render.   |
| `shortstat`    | `boolean`           | Show file, insertion, and deletion totals instead of the patch. |
| `numstat`      | `boolean`           | Show additions and deletions per file instead of the patch.     |
| `stat`         | `boolean`           | Show a per-file change graph and totals instead of the patch.   |
| `line-numbers` | `boolean`           | Show old and new line-number gutters.                           |
| `theme`        | `"light" \| "dark"` | Override the operating-system color preference.                 |

### Properties

| Name          | Type           | Description                                                                       |
| ------------- | -------------- | --------------------------------------------------------------------------------- |
| `src`         | `string`       | URL of the unified diff loaded by the element.                                    |
| `lineNumbers` | `boolean`      | Whether old and new line-number gutters are shown.                                |
| `shortStat`   | `boolean`      | Whether file, insertion, and deletion totals replace the patch.                   |
| `numStat`     | `boolean`      | Whether per-file addition and deletion counts replace the patch.                  |
| `stat`        | `boolean`      | Whether per-file change graphs and totals replace the patch.                      |
| `patch`       | `string`       | Raw unified diff text currently rendered by the element.                          |
| `parsedDiffs` | `ParsedDiff[]` | Parsed files, hunks, line numbers, and metadata for the current patch. Read-only. |

### Slots

| Name      | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `loading` | Content shown when a `src` request exceeds the loading delay. |
| `error`   | Content shown when a `src` request fails.                     |

### Events

| Name    | Type    | Description                                        |
| ------- | ------- | -------------------------------------------------- |
| `load`  | `Event` | Fired after a `src` patch has loaded and rendered. |
| `error` | `Event` | Fired when a `src` patch cannot be loaded.         |

### CSS custom properties

| Name                       | Default                   | Description                                   |
| -------------------------- | ------------------------- | --------------------------------------------- |
| `--git-diff-bg`            | `#f5f5f4`                 | Component background color.                   |
| `--git-diff-text-color`    | `#292524`                 | Primary text color.                           |
| `--git-diff-border-color`  | `#d6d3d1`                 | Separator and gutter border color.            |
| `--git-diff-muted-color`   | `#78716c`                 | Muted metadata and line-number color.         |
| `--git-diff-add-text`      | `#167044`                 | Added-line text color.                        |
| `--git-diff-del-text`      | `#b4232c`                 | Deleted-line text color.                      |
| `--git-diff-hunk-text`     | `#006d8f`                 | Hunk-header text color.                       |
| `--git-diff-meta-text`     | `#806000`                 | File metadata and status color.               |
| `--git-diff-hover-bg`      | `rgba(41, 37, 36, 0.045)` | Line hover background.                        |
| `--git-diff-font-family`   | `ui-monospace, monospace` | Component font family.                        |
| `--git-diff-font-size`     | `12px`                    | Component font size.                          |
| `--git-diff-line-height`   | `20px`                    | Diff line height.                             |
| `--git-diff-loading-delay` | `150ms`                   | Delay before slotted loading content appears. |

### CSS parts

| Name                | Description                                        |
| ------------------- | -------------------------------------------------- |
| `container`         | Container for the summary or rendered file diffs.  |
| `shortstat`         | File, insertion, and deletion totals.              |
| `numstat`           | Table of additions and deletions per file.         |
| `numstat-row`       | A file row in the numstat table.                   |
| `numstat-additions` | A file's addition count.                           |
| `numstat-deletions` | A file's deletion count.                           |
| `numstat-path`      | A file path in the numstat table.                  |
| `stat`              | Per-file change graphs and totals.                 |
| `stat-file`         | A file row in the stat view.                       |
| `stat-path`         | A file path in the stat view.                      |
| `stat-annotation`   | A file status or mode change in the stat view.     |
| `stat-graph`        | A visual graph of a file's changed lines.          |
| `stat-additions`    | Added-line segment of a stat graph.                |
| `stat-deletions`    | Deleted-line segment of a stat graph.              |
| `loading`           | Loading-state container.                           |
| `error`             | Error-state container.                             |
| `file`              | A rendered file diff.                              |
| `file-modified`     | A modified file diff.                              |
| `file-added`        | An added file diff.                                |
| `file-deleted`      | A deleted file diff.                               |
| `file-renamed`      | A renamed file diff.                               |
| `file-copied`       | A copied file diff.                                |
| `file-header`       | Header containing a file path and optional status. |
| `file-path`         | Displayed file path.                               |
| `status`            | File status label.                                 |
| `status-added`      | Added-file status label.                           |
| `status-deleted`    | Deleted-file status label.                         |
| `status-renamed`    | Renamed-file status label.                         |
| `status-copied`     | Copied-file status label.                          |
| `file-meta`         | File mode, similarity, or binary metadata.         |
| `table`             | Table containing diff hunks and lines.             |
| `row`               | A diff row.                                        |
| `row-context`       | An unchanged context row.                          |
| `row-addition`      | An added line row.                                 |
| `row-deletion`      | A deleted line row.                                |
| `hunk-header`       | A hunk header row.                                 |
| `line-num`          | An old or new line-number cell.                    |
| `old-line-num`      | An old line-number cell.                           |
| `new-line-num`      | A new line-number cell.                            |
| `content`           | A diff-content cell.                               |

### Exports and registration

| Name             | Kind                        | Module                                    |
| ---------------- | --------------------------- | ----------------------------------------- |
| `<git-diff>`     | Custom element registration | `@erkde/git-elements`                     |
| `GitDiffElement` | Class                       | `@erkde/git-elements/components/git-diff` |
