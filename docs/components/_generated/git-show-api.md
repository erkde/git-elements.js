<!-- Generated from custom-elements.json. Do not edit directly. -->

### Attributes

| Name           | Type                | Description                                        |
| -------------- | ------------------- | -------------------------------------------------- |
| `repository`   | `string`            | Public repository URL.                             |
| `revision`     | `string`            | Branch, tag, or full commit ID to show.            |
| `line-numbers` | `boolean`           | Show old and new line-number gutters in the patch. |
| `theme`        | `"light" \| "dark"` | Override the operating-system color preference.    |

### Properties

| Name          | Type                    | Description                                                          |
| ------------- | ----------------------- | -------------------------------------------------------------------- |
| `repository`  | `string`                | Public repository URL containing the revision.                       |
| `revision`    | `string`                | Branch, tag, or full commit ID currently selected.                   |
| `lineNumbers` | `boolean`               | Whether old and new line-number gutters are shown in the patch.      |
| `commit`      | `GitShowCommit \| null` | Normalized metadata for the commit currently displayed. Read-only.   |
| `patch`       | `string`                | Raw unified diff text for the commit currently displayed. Read-only. |

### Methods

| Name       | Returns         | Description                                                |
| ---------- | --------------- | ---------------------------------------------------------- |
| `reload()` | `Promise<void>` | Bypass cached data and request the commit and patch again. |

### Slots

| Name      | Description                                              |
| --------- | -------------------------------------------------------- |
| `loading` | Content shown when loading exceeds the configured delay. |
| `error`   | Content shown when the commit cannot be loaded.          |

### Events

| Name    | Type    | Description                                       |
| ------- | ------- | ------------------------------------------------- |
| `load`  | `Event` | Fired after the commit and patch load and render. |
| `error` | `Event` | Fired when the commit or patch cannot be loaded.  |

### CSS custom properties

| Name                       | Default                   | Description                                   |
| -------------------------- | ------------------------- | --------------------------------------------- |
| `--git-show-bg`            | `#f5f5f4`                 | Component background color.                   |
| `--git-show-text-color`    | `#292524`                 | Primary text color.                           |
| `--git-show-border-color`  | `#d6d3d1`                 | Border color.                                 |
| `--git-show-muted-color`   | `#78716c`                 | Commit label color.                           |
| `--git-show-link-color`    | `#006d8f`                 | Commit hash link color.                       |
| `--git-show-font-family`   | `ui-monospace, monospace` | Component font family.                        |
| `--git-show-font-size`     | `12px`                    | Component font size.                          |
| `--git-show-line-height`   | `20px`                    | Component line height.                        |
| `--git-show-loading-delay` | `150ms`                   | Delay before slotted loading content appears. |

### CSS parts

| Name        | Description                                  |
| ----------- | -------------------------------------------- |
| `container` | Container for the commit metadata and patch. |
| `header`    | Commit metadata header.                      |
| `hash`      | Full commit hash and link.                   |
| `author`    | Commit author identity.                      |
| `date`      | Author date.                                 |
| `message`   | Full commit message.                         |
| `subject`   | First line of the commit message.            |
| `body`      | Remaining commit message body.               |
| `diff`      | Nested `<git-diff>` element.                 |
| `loading`   | Loading-state container.                     |
| `error`     | Error-state container.                       |

### Exports and registration

| Name             | Kind                        | Module                                    |
| ---------------- | --------------------------- | ----------------------------------------- |
| `<git-show>`     | Custom element registration | `@erkde/git-elements`                     |
| `GitShowElement` | Class                       | `@erkde/git-elements/components/git-show` |
