import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import moveCaretToEnd from '../utils/moveCaretToEnd';
import CardDialogToolbar, { FormattingCommand } from './CardDialogToolbar';
import CardDialogColorRow from './CardDialogColorRow';
import CardDialogEditor, { CardEditorHandle } from './editor/CardDialogEditor';
import useVisualViewport from './hooks/useVisualViewport';
import {
	TextState,
	toggleInlineFormat, toggleCode, toggleList, ListType, toggleBlockquote,
	indentLines, unindentLines,
	insertHorizontalRule, insertTable, insertTextAtCursor, insertLink,
} from '../utils/markdownTextEditing';
import { formatDateTime } from '../utils/time';
import { trimCardBody } from '../utils/noteParser';
import { AppSettings, Platform } from '../utils/types';
import { darkBackgroundColors, lightBackgroundColors } from '../utils/colors';

export interface CardDialogData {
	title: string;
	description: string;
	// The selected background color: a palette ID as a string (e.g. '3'),
	// or '' for no color.
	color: string;
}

interface Props {
	mode: 'add' | 'edit';
	appSettings: AppSettings;
	isDarkMode: boolean;
	platform: Platform;
	onOpenLink: (link: string) => void;
	onConfirm: (data:CardDialogData) => void;
	onCancel: () => void;
	// Only used in edit mode - the current title and description of the card.
	initialTitle?: string;
	initialDescription?: string;
	// Only used in edit mode - the current background color of the card
	// (a palette ID as a string, e.g. '3', or '' for no color).
	initialColor?: string;
}

// Dialog that lets the user add a new card (mode "add") or edit an existing
// one (mode "edit") from a title and an optional description.
//
// The title is required - the dialog can only be confirmed once the title is
// non-empty. The description is optional and multi-line, and has a formatting
// toolbar with the same actions as Joplin's own editor. Below the description,
// a row of color swatches sets the card's background color, using the same
// palette as the card properties dialog.
//
// Keyboard behaviour:
// - Title: Enter confirms the dialog, Tab moves to the description editor.
// - Description: Enter inserts a newline (continuing list markup like
//   Joplin's editor), Ctrl/Cmd+Enter confirms the dialog, Tab indents the
//   current list item (or inserts an indent unit outside of a list), and
//   Shift+Tab unindents. Ctrl/Cmd+[ and Ctrl/Cmd+] also indent and unindent.
// - Escape closes the dialog (handled by the dialog itself).
//
// On mobile, the dialog is a full-screen sheet instead, laid out for the
// on-screen keyboard:
// - The sheet covers exactly the visible part of the screen above the
//   keyboard (see useVisualViewport), so nothing is hidden behind the
//   keyboard and nothing needs to be scrolled into view.
// - Cancel, the dialog title and the confirm button are in a bar at the top,
//   so they are always visible - not at the bottom, behind the keyboard.
// - The description editor fills the space left, and the formatting toolbar
//   is a single row of larger buttons that scrolls horizontally.
// - The keyboard's Enter key in the title moves to the description ("next")
//   instead of confirming: there is no Tab key on a phone, and the confirm
//   button is always at hand in the top bar.
// - In edit mode, no field is focused on open: the keyboard would otherwise
//   cover the card the user just opened to read. In add mode, the title is
//   focused like on desktop.
export default (props:Props) => {
	const [title, setTitle] = useState(props.initialTitle ?? '');
	const [color, setColor] = useState(props.initialColor ?? '');
	const [linkDialogState, setLinkDialogState] = useState<{ label: string, url: string }|null>(null);
	const [discardDialogShown, setDiscardDialogShown] = useState(false);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const editorRef = useRef<CardEditorHandle|null>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const isMobile = props.platform === 'mobile';
	const viewport = useVisualViewport(isMobile);

	// On mobile, the dialogs are placed in the visible part of the screen: by
	// default, MUI places them in the layout viewport, which the on-screen
	// keyboard does not shrink (and which can be larger than the screen).
	const viewportSx = isMobile ? {
		top: viewport.top,
		left: viewport.left,
		width: viewport.width,
		height: viewport.height,
		right: 'auto',
		bottom: 'auto',
	} : undefined;

	const labels = props.mode === 'edit'
		? { dialogTitle: 'Edit card', confirmButton: 'Save' }
		: { dialogTitle: 'Add card', confirmButton: 'Add' };

	// The swatches show the palette of the current theme, like the color
	// classes of the board (.background-N, generated for the active palette).
	const backgroundColors = props.isDarkMode ? darkBackgroundColors : lightBackgroundColors;

	useEffect(() => {
		// On mobile, focusing a field opens the keyboard, which would cover
		// the card the user opened to read - so in edit mode, the user taps
		// the field to edit instead.
		if (isMobile && props.mode === 'edit') return;

		// Focus the title field when the dialog opens. MUI normally focuses the
		// first focusable element, but we do it explicitly to be sure the caret
		// is in the title field.
		requestAnimationFrame(() => {
			titleInputRef.current.focus();

			// In edit mode, place the caret at the end of the prefilled title.
			if (props.mode === 'edit') moveCaretToEnd(titleInputRef.current);
		});
	}, []);

	// On mobile, the sheet shrinks when the keyboard opens (and grows when it
	// closes), which can leave the focused field or the caret below the
	// visible area - bring them back into view.
	useEffect(() => {
		if (!isMobile) return;

		const content = contentRef.current;
		const active = document.activeElement;
		if (!content || !active || !content.contains(active)) return;

		const editorBox = active.closest('.card-dialog-editor');
		(editorBox ?? active).scrollIntoView({ block: 'nearest' });
		if (editorRef.current?.hasFocus()) editorRef.current.scrollCursorIntoView();
	}, [isMobile, viewport.height]);

	const onEditorSubmit = useCallback(() => {
		// The confirm button is disabled while the title is empty, but be
		// defensive in case a stray keyboard event triggers the submit.
		if (!title.trim()) return;

		props.onConfirm({
			title: title.trim(),
			description: trimCardBody(editorRef.current.getValue()),
			color,
		});
	}, [props.onConfirm, title, color]);

	const isDirty = useCallback(() => {
		if (title !== (props.initialTitle ?? '')) return true;
		if (color !== (props.initialColor ?? '')) return true;
		const editorValue = editorRef.current ? editorRef.current.getValue() : '';
		return editorValue !== (props.initialDescription ?? '');
	}, [title, props.initialTitle, color, props.initialColor, props.initialDescription]);

	const onEditorCancel = useCallback(() => {
		// Do not close the dialog directly when there are unsaved changes -
		// losing them by pressing Escape (or clicking the backdrop or the
		// Cancel button) accidentally would be painful
		if (isDirty()) {
			setDiscardDialogShown(true);
			return;
		}
		props.onCancel();
	}, [isDirty, props.onCancel]);

	// Applies a text transformation to the description. The toolbar buttons
	// take the focus away from the editor when clicked, so the focus is
	// restored afterwards.
	const applyToDescription = useCallback((transform:(state:TextState)=>TextState|null) => {
		const handle = editorRef.current;
		if (!handle) return;
		handle.applyTransform(transform);
		handle.focus();
	}, []);

	const onFormattingCommand = useCallback((command: FormattingCommand) => {
		switch (command) {
		case 'bold':
			applyToDescription(s => toggleInlineFormat(s, '**'));
			break;
		case 'italic':
			applyToDescription(s => toggleInlineFormat(s, '*'));
			break;
		case 'link': {
			const handle = editorRef.current;
			if (!handle) break;

			// Pre-fill the label with the current selection, if any
			const state = handle.getTextState();
			setLinkDialogState({
				label: state.value.slice(state.selectionStart, state.selectionEnd),
				url: '',
			});
			break;
		}
		case 'code':
			applyToDescription(toggleCode);
			break;
		case 'bulletedList':
			applyToDescription(s => toggleList(s, ListType.Bulleted));
			break;
		case 'numberedList':
			applyToDescription(s => toggleList(s, ListType.Numbered));
			break;
		case 'checkboxList':
			applyToDescription(s => toggleList(s, ListType.Checkbox));
			break;
		case 'indent':
			applyToDescription(indentLines);
			break;
		case 'unindent':
			applyToDescription(unindentLines);
			break;
		case 'horizontalRule':
			applyToDescription(insertHorizontalRule);
			break;
		case 'blockquote':
			applyToDescription(toggleBlockquote);
			break;
		case 'table':
			applyToDescription(insertTable);
			break;
		case 'time':
			applyToDescription(s => insertTextAtCursor(s, formatDateTime(Date.now(), props.appSettings.dateFormat + ' ' + props.appSettings.timeFormat)));
			break;
		}
	}, [applyToDescription, props.appSettings]);

	const onLinkDialogConfirm = useCallback(() => {
		if (!linkDialogState) return;
		const { label, url } = linkDialogState;
		applyToDescription(s => insertLink(s, url.trim(), label.trim()));
		setLinkDialogState(null);
	}, [linkDialogState, applyToDescription]);

	const onLinkDialogKeyDown = useCallback<React.KeyboardEventHandler>((event) => {
		if (event.key === 'Enter' && linkDialogState && linkDialogState.url.trim()) {
			event.preventDefault();
			onLinkDialogConfirm();
		}
	}, [linkDialogState, onLinkDialogConfirm]);

	const renderLinkDialog = () => {
		if (!linkDialogState) return null;

		return (
			<Dialog open={true} onClose={() => setLinkDialogState(null)} fullWidth maxWidth="xs" sx={viewportSx}>
				<DialogTitle>Insert link</DialogTitle>
				<DialogContent>
					<TextField
						label="Label (optional)"
						variant="outlined"
						fullWidth
						value={linkDialogState.label}
						onChange={(event) => setLinkDialogState({ ...linkDialogState, label: event.currentTarget.value })}
					/>
					<div style={{ marginTop: '16px' }}>
						<TextField
							label="URL"
							variant="outlined"
							fullWidth
							autoFocus
							value={linkDialogState.url}
							onChange={(event) => setLinkDialogState({ ...linkDialogState, url: event.currentTarget.value })}
							onKeyDown={onLinkDialogKeyDown}
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setLinkDialogState(null)}>Cancel</Button>
					<Button color="primary" disabled={!linkDialogState.url.trim()} onClick={onLinkDialogConfirm}>OK</Button>
				</DialogActions>
			</Dialog>
		);
	}

	const onTitleKeyDown = useCallback<React.KeyboardEventHandler>((event) => {
		// Enter confirms the dialog directly - the standard form convention, and
		// the quickest way to add a card without description. This also covers
		// Ctrl+Enter.
		if (event.key === 'Enter') {
			event.preventDefault();
			if (isMobile) {
				// The keyboard's Enter key is labelled "next" on mobile (see
				// enterKeyHint) and moves to the description
				editorRef.current?.focus();
			} else {
				onEditorSubmit();
			}
		} else if (event.key === 'Tab' && !event.shiftKey) {
			// Tab skips the toolbar buttons and moves directly into the
			// description editor
			event.preventDefault();
			editorRef.current?.focus();
		}
	}, [onEditorSubmit, isMobile]);

	const renderDiscardDialog = () => {
		if (!discardDialogShown) return null;

		return (
			<Dialog open={true} onClose={() => setDiscardDialogShown(false)} fullWidth maxWidth="xs" sx={viewportSx}>
				<DialogTitle>Discard changes?</DialogTitle>
				<DialogContent>
					<Typography>All your changes will be lost.</Typography>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={() => setDiscardDialogShown(false)}>Keep editing</Button>
					<Button color="error" onClick={() => {
						setDiscardDialogShown(false);
						props.onCancel();
					}}>Discard</Button>
				</DialogActions>
			</Dialog>
		);
	}

	const renderFields = () => {
		return (
			<>
				<TextField
					inputRef={titleInputRef}
					fullWidth
					variant="outlined"
					placeholder="Title"
					value={title}
					onChange={(event) => setTitle(event.currentTarget.value)}
					onKeyDown={onTitleKeyDown}
					inputProps={isMobile ? { enterKeyHint: 'next' } : undefined}
				/>
				{/* The editor comes before the toolbar in the DOM so that Tab from
				the title field moves directly into the text, skipping the toolbar
				buttons. The CSS visually places the toolbar above the editor. */}
				<div className="card-dialog-editor">
					<CardDialogEditor
						editorHandleRef={editorRef}
						initialValue={props.initialDescription ?? ''}
						isDarkMode={props.isDarkMode}
						platform={props.platform}
						onOpenLink={props.onOpenLink}
						onSubmit={onEditorSubmit}
					/>
					<CardDialogToolbar onCommand={onFormattingCommand} touch={isMobile} />
				</div>
				{/* The color row is a separate element below the editor box:
				the color applies to the whole card, not to the description. */}
				<CardDialogColorRow
					colors={backgroundColors}
					value={color}
					onChange={setColor}
				/>
			</>
		);
	}

	if (isMobile) {
		return (
			<Dialog open={true} onClose={onEditorCancel} fullScreen className="card-dialog -mobile" sx={viewportSx}>
				<div className="card-dialog-topbar">
					<Button onClick={onEditorCancel} sx={{ justifySelf: 'start' }}>Cancel</Button>
					<DialogTitle className="title" sx={{ p: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{labels.dialogTitle}</DialogTitle>
					<Button onClick={onEditorSubmit} color="primary" disabled={!title.trim()} sx={{ justifySelf: 'end', fontWeight: 'bold' }}>{labels.confirmButton}</Button>
				</div>
				<DialogContent ref={contentRef} className="card-dialog-content" sx={{ px: 2, pb: 2 }}>
					{renderFields()}
				</DialogContent>
				{renderLinkDialog()}
				{renderDiscardDialog()}
			</Dialog>
		);
	}

	return (
		<Dialog open={true} onClose={onEditorCancel} fullWidth maxWidth="sm">
			<DialogTitle>{labels.dialogTitle}</DialogTitle>
			<DialogContent>
				{renderFields()}
			</DialogContent>
			<DialogActions>
				<Button onClick={onEditorCancel}>Cancel</Button>
				<Button onClick={onEditorSubmit} color="primary" disabled={!title.trim()}>{labels.confirmButton}</Button>
			</DialogActions>
			{renderLinkDialog()}
			{renderDiscardDialog()}
		</Dialog>
	);
}
