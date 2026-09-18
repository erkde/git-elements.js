<!-- Generated from custom-elements.json. Do not edit directly. -->

### Attributes

| Name         | Type                | Description                                                   |
| ------------ | ------------------- | ------------------------------------------------------------- |
| `repository` | `string`            | Public repository URL.                                        |
| `revisions`  | `string`            | Branch, tag, commit ID, or two-dot or three-dot revision set. |
| `max-count`  | `number`            | Maximum number of commits to display, from 1 to 100.          |
| `left-right` | `boolean`           | Mark each side of a symmetric three-dot revision set.         |
| `theme`      | `"light" \| "dark"` | Override the operating-system color preference.               |

### Properties

| Name         | Type                      | Description                                                       |
| ------------ | ------------------------- | ----------------------------------------------------------------- |
| `repository` | `string`                  | Public repository URL used to load commit history.                |
| `revisions`  | `string`                  | Branch, tag, commit ID, or two-dot or three-dot revision set.     |
| `maxCount`   | `number`                  | Maximum number of commits to display, from 1 to 100.              |
| `leftRight`  | `boolean`                 | Whether symmetric three-dot results identify their revision side. |
| `commits`    | `readonly GitLogCommit[]` | Normalized commits currently displayed by the element. Read-only. |

### Methods

| Name       | Returns         | Description                                   |
| ---------- | --------------- | --------------------------------------------- |
| `reload()` | `Promise<void>` | Bypass cached data and request the log again. |

### Slots

| Name      | Description                                              |
| --------- | -------------------------------------------------------- |
| `loading` | Content shown when loading exceeds the configured delay. |
| `error`   | Content shown when repository history cannot be loaded.  |

### Events

| Name    | Type    | Description                                       |
| ------- | ------- | ------------------------------------------------- |
| `load`  | `Event` | Fired after repository history loads and renders. |
| `error` | `Event` | Fired when repository history cannot be loaded.   |

### CSS custom properties

| Name                      | Default                   | Description                                   |
| ------------------------- | ------------------------- | --------------------------------------------- |
| `--git-log-bg`            | `#f5f5f4`                 | Component background color.                   |
| `--git-log-text-color`    | `#292524`                 | Primary text color.                           |
| `--git-log-border-color`  | `#d6d3d1`                 | Border color.                                 |
| `--git-log-muted-color`   | `#78716c`                 | Muted author, date, and side-marker color.    |
| `--git-log-link-color`    | `#006d8f`                 | Commit hash link color.                       |
| `--git-log-left-color`    | `#b4232c`                 | Left revision marker color.                   |
| `--git-log-right-color`   | `#167044`                 | Right revision marker color.                  |
| `--git-log-hover-bg`      | `rgba(41, 37, 36, 0.045)` | Commit hover background.                      |
| `--git-log-font-family`   | `ui-monospace, monospace` | Component font family.                        |
| `--git-log-font-size`     | `12px`                    | Component font size.                          |
| `--git-log-line-height`   | `20px`                    | Commit line height.                           |
| `--git-log-loading-delay` | `150ms`                   | Delay before slotted loading content appears. |

### CSS parts

| Name         | Description                                       |
| ------------ | ------------------------------------------------- |
| `list`       | Ordered list containing the commits.              |
| `commit`     | A rendered commit.                                |
| `side`       | Revision-side marker.                             |
| `side-left`  | Marker for a commit unique to the left revision.  |
| `side-right` | Marker for a commit unique to the right revision. |
| `hash`       | Abbreviated commit hash.                          |
| `message`    | First line of the commit message.                 |
| `author`     | Commit author name.                               |
| `date`       | Committer date.                                   |
| `loading`    | Loading-state container.                          |
| `error`      | Error-state container.                            |

### Exports and registration

| Name            | Kind                        | Module                                   |
| --------------- | --------------------------- | ---------------------------------------- |
| `<git-log>`     | Custom element registration | `@erkde/git-elements`                    |
| `GitLogElement` | Class                       | `@erkde/git-elements/components/git-log` |
