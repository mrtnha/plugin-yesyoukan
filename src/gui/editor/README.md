# Vendored editor code

The files under this directory are vendored from the Joplin source
repository (https://github.com/laurent22/joplin), Copyright (c) Laurent Cozic,
MIT licensed - the same license as this plugin (see the LICENSE file in the
repository root). They implement Joplin's editor theme and the "Render markup
in editor" feature of its Markdown editor (marker characters hidden and
replaced with widgets, formatting rendered inline), for the CodeMirror
description editor of the card dialog (see `CardDialogEditor.tsx`).

They are copied in rather than imported because Joplin's editor packages are
not exposed to plugins through the plugin API. Each file's header comment
names the upstream file it was vendored from.

## Deviations from upstream

The files are kept as close to upstream as possible; the deviations are
collected in this list instead of inline markers, so that a diff against a
newer Joplin version stays readable. When updating, re-apply them:

- **Import paths** are adjusted throughout: the files live under
  `src/gui/editor/` here, without the `packages/editor/CodeMirror/`
  directory levels of the Joplin source.
- **`editorTypes.ts`** is trimmed: `EditorTheme` is flattened to the fields
  actually used (it extends the `Theme` type from `@joplin/lib` in Joplin,
  which is not available inside a plugin webview) and `fontSize` may also be
  a CSS variable - Joplin always passes a plain number. `EditorSettings` is
  reduced to the fields the vendored extensions read.
- **`rendering/replaceCheckboxes.ts`** always shows the completed-item
  styling, including on the line that contains the cursor. Joplin hides it
  on the cursor's line ("Renders markup on all lines that don't include the
  cursor"), which means that checking a checkbox gives no visual feedback
  until the cursor leaves the line - confusing in the small card editor.
- **`utils/focusHandler.ts`** is a reimplementation of
  `@joplin/lib/utils/focusHandler.ts` without the logger dependency
  (`@joplin/utils` is not available here): the same interface, as a simple
  pass-through.
- **`utils/tableCellPosition.ts`** contains only the helpers used by the
  vendored `renderTables` extension (`TableRange`, `isUnescapedPipe`,
  `getCellContentPosition`); the rest of Joplin's table editing commands are
  not vendored.
