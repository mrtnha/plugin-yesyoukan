// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/CodeMirror/extensions/rendering/addFormattingClasses.ts
//
// These extensions implement the "Render markup in editor" feature of
// Joplin's Markdown editor: marker characters are hidden and replaced with
// widgets (checkboxes, bullet points, dividers) and formatting is rendered
// inline.
//
import { Decoration, EditorView } from '@codemirror/view';
import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';

const linkClassName = 'cm-ext-unfocused-link';
const urlMarkDecoration = Decoration.mark({ class: linkClassName });
const strikethroughClassName = 'cm-ext-strikethrough';
const strikethroughMarkDecoration = Decoration.mark({ class: strikethroughClassName });
const insertClassName = 'cm-ext-insert';
const insertMarkDecoration = Decoration.mark({ class: insertClassName });

const addFormattingClasses = [
	EditorView.theme({
		[`& .${linkClassName}, & .${linkClassName} span`]: {
			textDecoration: 'underline',
		},
		[`& .${strikethroughClassName}, & .${strikethroughClassName} span`]: {
			textDecoration: 'line-through',
		},
		[`& .${insertClassName}, & .${insertClassName} span`]: {
			textDecoration: 'underline',
		},
	}),
	makeInlineReplaceExtension({
		getRevealStrategy: (node) => {
			// Links: use 'select' because the Link's parent is Paragraph,
			// which spans the whole line - 'active' would hide all link decorations on the line
			if (node.name === 'URL' || node.name === 'Link') {
				return 'select';
			}
			return 'active';
		},
		createDecoration: (node) => {
			if (node.name === 'URL' || node.name === 'Link') {
				return urlMarkDecoration;
			}
			if (node.name === 'Strikethrough') {
				return strikethroughMarkDecoration;
			}
			if (node.name === 'Insert') {
				return insertMarkDecoration;
			}
			return null;
		},
		mergeNeighbors: true,
	}),
];

export default addFormattingClasses;
