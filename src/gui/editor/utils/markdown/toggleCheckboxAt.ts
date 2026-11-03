// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/CodeMirror/utils/markdown/toggleCheckboxAt.ts
//
// These extensions implement the "Render markup in editor" feature of
// Joplin's Markdown editor: marker characters are hidden and replaced with
// widgets (checkboxes, bullet points, dividers) and formatting is rendered
// inline.
//
import { Command, EditorView } from '@codemirror/view';

const toggleCheckbox = (linePos: number): Command => (target: EditorView) => {
	const state = target.state;
	if (linePos >= state.doc.length) {
		// Position out of range
		return false;
	}

	const line = state.doc.lineAt(linePos);
	const checkboxMarkup = line.text.match(/\[(x|\s)\]/);
	if (!checkboxMarkup) {
		// Couldn't find the checkbox
		return false;
	}

	const isChecked = checkboxMarkup[0] === '[x]';
	const checkboxPos = checkboxMarkup.index! + line.from;

	target.dispatch({
		changes: [{ from: checkboxPos, to: checkboxPos + 3, insert: isChecked ? '[ ]' : '[x]' }],
	});
	return true;
};

export default toggleCheckbox;
