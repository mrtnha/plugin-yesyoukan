// Checkbox markers ("- [ ]" / "- [x]"), shared by the note parser, the card
// renderer and the checkbox click handling.
//
// The core invariant: a checkbox marker is only recognized as a checkbox by
// the Markdown renderers when it is followed by a space - an empty checkbox
// item is therefore "- [ ] ", with a trailing space. That space is easily
// lost when a body is trimmed or split into lines, and without it the item
// renders as literal text and cannot be toggled. The helpers below exist to
// keep that space intact, to restore it, or to compensate for its absence
// when rendering.

// A checkbox marker, anywhere in a line. The marker must be followed by a
// space or by the end of the line: an empty checkbox item has nothing after
// the marker - only its trailing space ("[ ] ") - and that space is gone once
// the line is trimmed for matching, so the end of the line must match as
// well.
export const uncheckedCheckboxRegex = /- \[ \](?=$|\s)/;
export const checkedCheckboxRegex = /- \[[xX]\](?=$|\s)/;

// An empty checkbox item - just the marker, checked or unchecked, with or
// without trailing whitespace after it.
export const emptyCheckboxLineRegex = /^\s*-\s\[[ xX]\]\s*$/;

// An empty unchecked checkbox item whose trailing space is missing - the
// space has to be restored to keep the item a checkbox.
export const uncheckedCheckboxWithoutSpaceRegex = /^\s*-\s\[ \]$/;

export const isEmptyCheckboxLine = (line: string): boolean => {
	return emptyCheckboxLineRegex.test(line);
};
