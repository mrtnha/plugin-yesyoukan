// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/CodeMirror/extensions/rendering/utils/nodeIntersectsSelection.ts
//
// These extensions implement the "Render markup in editor" feature of
// Joplin's Markdown editor: marker characters are hidden and replaced with
// widgets (checkboxes, bullet points, dividers) and formatting is rendered
// inline.
//
import { EditorSelection } from '@codemirror/state';
import { SyntaxNodeRef } from '@lezer/common';

const nodeIntersectsSelection = (selection: EditorSelection, node: SyntaxNodeRef) => {
	const mainSelection = selection.main;

	const nodeContains = (point: number) => {
		return point >= node.from && point <= node.to;
	};
	const selectionContains = (point: number) => {
		return point >= mainSelection.from && point <= mainSelection.to;
	};
	return nodeContains(mainSelection.from) || nodeContains(mainSelection.to)
		|| selectionContains(node.from) || selectionContains(node.to);
};

export default nodeIntersectsSelection;
