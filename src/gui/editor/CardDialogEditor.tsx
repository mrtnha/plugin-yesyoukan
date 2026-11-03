import * as React from 'react';
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, drawSelection } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';

import { TextState, indentUnit as mdIndentUnit, toggleInlineFormat, indentLines, unindentLines, continueListMarkup, insertTextAtCursor, lineIsListItem } from '../../utils/markdownTextEditing';
import { Platform } from '../../utils/types';
import createTheme from './theme';
import { EditorTheme } from './editorTypes';
import markdownMathExtension from './extensions/markdownMathExtension';
import editorSettingsExtension from './editorSettingsExtension';
import { RenderedContentContext } from './rendering/types';
import replaceCheckboxes from './rendering/replaceCheckboxes';
import replaceBulletLists from './rendering/replaceBulletLists';
import replaceFormatCharacters from './rendering/replaceFormatCharacters';
import replaceLinks from './rendering/replaceLinks';
import replaceBackslashEscapes from './rendering/replaceBackslashEscapes';
import replaceDividers from './rendering/replaceDividers';
import addFormattingClasses from './rendering/addFormattingClasses';
import replaceInlineHtml from './rendering/replaceInlineHtml';
import renderTables from './rendering/renderTables';

export interface CardEditorHandle {
	focus: () => void;
	getValue: () => string;
	getTextState: () => TextState;
	applyTransform: (transform:(state: TextState)=>TextState|null) => boolean;
}

interface Props {
	initialValue: string;
	isDarkMode: boolean;
	platform: Platform;
	onOpenLink: (link: string) => void;
	onSubmit: () => void;
	editorHandleRef: React.MutableRefObject<CardEditorHandle|null>;
}

// The description editor of the card dialog, based on CodeMirror 6 with the
// same setup as Joplin's own Markdown editor: Joplin's theme (theme.ts) and
// Joplin's "Render markup in editor" extensions (vendored in ./rendering/) -
// formatting is rendered inline, checkbox markers are replaced with real
// clickable checkboxes, and tables are rendered as interactive widgets.
//
// The toolbar commands and the keyboard behaviour are implemented by the
// pure helpers from utils/markdownTextEditing.ts, applied to the editor state as
// a single transaction (so that each action is one undo step).

// Builds the editor theme from the app's CSS variables. Joplin's theme takes a
// theme object from its own theme system, which is not available inside a
// plugin webview - the CSS variables that Joplin exposes to plugins are used
// instead.
const buildEditorTheme = (isDarkMode: boolean, platform: Platform): EditorTheme => {
	return {
		appearance: isDarkMode ? 'dark' : 'light',
		themeId: 0,
		fontFamily: 'var(--joplin-font-family)',
		fontSize: 'var(--joplin-font-size)',
		fontSizeUnits: '',
		isDesktop: platform === 'desktop',
		monospaceFont: 'monospace',
		paddingBottom: 8,
		marginLeft: 0,
		marginRight: 0,

		color: 'var(--joplin-color)',
		colorFaded: 'var(--joplin-divider-color)',
		backgroundColor: 'var(--joplin-background-color)',
		dividerColor: 'var(--joplin-divider-color)',
		selectedColor: 'var(--joplin-selected-color)',
		urlColor: 'var(--joplin-color)',
		blockQuoteOpacity: 0.6,
		searchMarkerColor: 'var(--joplin-selected-color)',
		searchMarkerBackgroundColor: 'var(--joplin-selected-color)',
	};
};

// Additional theme for the dialog layout only (Joplin's editor fills the
// whole window, the card editor is a fixed-size box within the dialog).
const dialogLayoutTheme = EditorView.theme({
	'.cm-scroller': {
		minHeight: '10em',
		maxHeight: '24em',
		overflowY: 'auto',
	},
	'.cm-content': {
		padding: '8px 10px',
	},
});

const getTextState = (view: EditorView): TextState => {
	const selection = view.state.selection.main;
	return {
		value: view.state.doc.toString(),
		selectionStart: selection.from,
		selectionEnd: selection.to,
	};
};

// Applies one of the pure markdownTextEditing helpers to the editor, as a
// single transaction.
const applyTransform = (view: EditorView, transform:(state: TextState)=>TextState|null): boolean => {
	const state = getTextState(view);
	const newState = transform(state);
	if (!newState || newState === state) return false;

	view.dispatch({
		changes: { from: 0, to: state.value.length, insert: newState.value },
		selection: { anchor: newState.selectionStart, head: newState.selectionEnd },
		scrollIntoView: true,
		userEvent: 'input',
	});
	return true;
};

export default (props:Props) => {
	const hostRef = useRef<HTMLDivElement>(null);

	// The editor is created once, when the component mounts, and the keymap
	// handlers must not capture a stale props object: for example, the
	// Mod-Enter handler captured the save handler of the first render, which
	// still saw the initial (empty) title - so pressing Ctrl+Enter did
	// nothing. Keep the callbacks in refs instead, so that they always
	// resolve to the latest ones.
	const onSubmitRef = useRef(props.onSubmit);
	onSubmitRef.current = props.onSubmit;
	const onOpenLinkRef = useRef(props.onOpenLink);
	onOpenLinkRef.current = props.onOpenLink;

	useEffect(() => {
		// The context passed to the rendering extensions. Images are not
		// resolved (rendered as-is), links are forwarded to the app.
		const renderedContentContext: RenderedContentContext = {
			openLink: link => onOpenLinkRef.current(link),
			resolveImageSrc: async src => src,
		};

		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

		const view = new EditorView({
			parent: hostRef.current,
			state: EditorState.create({
				doc: props.initialValue,
				selection: { anchor: props.initialValue.length },
				extensions: [
					markdown({ extensions: [GFM, markdownMathExtension], addKeymap: false }),
					history(),
					EditorView.lineWrapping,
					drawSelection(),
					indentUnit.of('    '),
					EditorView.contentAttributes.of({ spellcheck: 'true' }),

					// Joplin's editor theme (font, colors, caret, selection,
					// headings, code blocks, ...)
					...createTheme(buildEditorTheme(props.isDarkMode, props.platform)),
					dialogLayoutTheme,

					// Joplin's "Render markup in editor" extensions
					replaceCheckboxes,
					replaceBulletLists,
					replaceFormatCharacters,
					replaceLinks,
					replaceBackslashEscapes,
					replaceDividers,
					addFormattingClasses,
					replaceInlineHtml,
					renderTables(renderedContentContext),

					editorSettingsExtension({ preferMacShortcuts: isMac }),

					keymap.of([
						{ key: 'Mod-Enter', run: () => { onSubmitRef.current(); return true; } },
						{ key: 'Mod-b', run: view => applyTransform(view, s => toggleInlineFormat(s, '**')) },
						{ key: 'Mod-i', run: view => applyTransform(view, s => toggleInlineFormat(s, '*')) },
						{
							// Indent the current list item, or insert an indent unit
							// outside of a list, like Joplin's editor
							key: 'Tab',
							run: view => {
								const state = getTextState(view);
								if (lineIsListItem(state) || state.selectionStart !== state.selectionEnd) {
									return applyTransform(view, indentLines);
								}
								return applyTransform(view, s => insertTextAtCursor(s, mdIndentUnit));
							},
						},
						{ key: 'Shift-Tab', run: view => applyTransform(view, unindentLines) },
						{ key: 'Mod-]', run: view => applyTransform(view, indentLines) },
						{ key: 'Mod-[', run: view => applyTransform(view, unindentLines) },
						// Continue the list markup when pressing Enter at the end of
						// a list item - otherwise fall back to the default behaviour
						// (insert a newline)
						{ key: 'Enter', run: view => applyTransform(view, continueListMarkup) },
						...defaultKeymap,
						...historyKeymap,
					]),
				],
			}),
		});

		props.editorHandleRef.current = {
			focus: () => view.focus(),
			getValue: () => view.state.doc.toString(),
			getTextState: () => getTextState(view),
			applyTransform: transform => applyTransform(view, transform),
		};

		return () => {
			view.destroy();
			props.editorHandleRef.current = null;
		};
	}, []);

	return <div ref={hostRef} className="card-dialog-editor-host"></div>;
}
