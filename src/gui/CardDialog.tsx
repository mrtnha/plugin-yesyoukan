import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import moveCaretToEnd from '../utils/moveCaretToEnd';
import CardDialogToolbar, { FormattingCommand } from './CardDialogToolbar';
import {
	TextState, getTextareaState, setTextareaState,
	toggleInlineFormat, toggleCode, toggleList, ListType, toggleBlockquote,
	indentLines, unindentLines, continueListMarkup,
	insertHorizontalRule, insertTable, insertTextAtCursor, insertLink,
	lineIsListItem, indentUnit,
} from '../utils/markdownTextEditing';
import { formatDateTime } from '../utils/time';
import { AppSettings } from '../utils/types';

export interface CardDialogData {
	title: string;
	description: string;
}

interface Props {
	mode: 'add' | 'edit';
	appSettings: AppSettings;
	onConfirm: (data:CardDialogData) => void;
	onCancel: () => void;
	// Only used in edit mode - the current title and description of the card.
	initialTitle?: string;
	initialDescription?: string;
}

// Dialog that lets the user add a new card (mode "add") or edit an existing
// one (mode "edit") from a title and an optional description.
//
// The title is required - the dialog can only be confirmed once the title is
// non-empty. The description is optional and multi-line, and has a formatting
// toolbar with the same actions as Joplin's own editor.
//
// Keyboard behaviour:
// - Title: Enter confirms the dialog, Tab moves to the description field.
// - Description: Enter inserts a newline (continuing list markup like
//   Joplin's editor), Ctrl/Cmd+Enter confirms the dialog, Tab indents the
//   current list item (or inserts an indent unit outside of a list), and
//   Shift+Tab unindents. Ctrl/Cmd+[ and Ctrl/Cmd+] also indent and unindent.
// - Escape closes the dialog (handled by the dialog itself).
export default (props:Props) => {
	const [title, setTitle] = useState(props.initialTitle ?? '');
	const [linkDialogState, setLinkDialogState] = useState<{ label: string, url: string }|null>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const labels = props.mode === 'edit'
		? { dialogTitle: 'Edit card', confirmButton: 'Save' }
		: { dialogTitle: 'Add card', confirmButton: 'Add' };

	useEffect(() => {
		// Focus the title field when the dialog opens. MUI normally focuses the
		// first focusable element, but we do it explicitly to be sure the caret
		// is in the title field.
		requestAnimationFrame(() => {
			titleInputRef.current.focus();

			// In edit mode, place the caret at the end of the prefilled title.
			if (props.mode === 'edit') moveCaretToEnd(titleInputRef.current);
		});
	}, []);

	const onEditorSubmit = useCallback(() => {
		// The confirm button is disabled while the title is empty, but be
		// defensive in case a stray keyboard event triggers the submit.
		if (!title.trim()) return;

		props.onConfirm({
			title: title.trim(),
			description: descriptionRef.current.value.trim(),
		});
	}, [props.onConfirm, title]);

	const onEditorCancel = useCallback(() => {
		props.onCancel();
	}, [props.onCancel]);

	// Applies a text transformation to the description. The toolbar buttons
	// take the focus away from the text area when clicked, so the focus is
	// restored afterwards.
	const applyToDescription = useCallback((transform:(state:TextState)=>TextState) => {
		const textarea = descriptionRef.current;
		setTextareaState(textarea, transform(getTextareaState(textarea)));
		textarea.focus();
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
			// Pre-fill the label with the current selection, if any
			const state = getTextareaState(descriptionRef.current);
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
			<Dialog open={true} onClose={() => setLinkDialogState(null)} fullWidth maxWidth="xs">
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
			onEditorSubmit();
		}
	}, [onEditorSubmit]);

	const onDescriptionKeyDown = useCallback<React.KeyboardEventHandler>((event) => {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			// Ctrl/Cmd+Enter is the universal way to confirm from a multi-line
			// field - plain Enter always inserts a newline.
			event.preventDefault();
			onEditorSubmit();
		} else if (event.key === 'Tab') {
			// Tab indents the current list item (and any selected lines).
			// Outside of a list, it inserts an indent unit, like Joplin's
			// editor. Shift+Tab unindents.
			event.preventDefault();
			if (event.shiftKey) {
				applyToDescription(unindentLines);
			} else {
				const state = getTextareaState(descriptionRef.current);
				if (lineIsListItem(state) || state.selectionStart !== state.selectionEnd) {
					applyToDescription(indentLines);
				} else {
					applyToDescription(s => insertTextAtCursor(s, indentUnit));
				}
			}
		} else if ((event.ctrlKey || event.metaKey) && event.key === ']') {
			// Same shortcuts as Joplin's editor
			event.preventDefault();
			applyToDescription(indentLines);
		} else if ((event.ctrlKey || event.metaKey) && event.key === '[') {
			event.preventDefault();
			applyToDescription(unindentLines);
		} else if (event.key === 'Enter') {
			// Continue the list markup when pressing Enter at the end of a list
			// item, like Joplin's editor - otherwise let the browser insert a
			// plain newline.
			const newState = continueListMarkup(getTextareaState(descriptionRef.current));
			if (newState) {
				event.preventDefault();
				setTextareaState(descriptionRef.current, newState);
			}
		}
	}, [onEditorSubmit, applyToDescription]);

	return (
		<Dialog open={true} onClose={onEditorCancel} fullWidth maxWidth="sm">
			<DialogTitle>{labels.dialogTitle}</DialogTitle>
			<DialogContent>
				<TextField
					inputRef={titleInputRef}
					fullWidth
					variant="outlined"
					placeholder="Title"
					value={title}
					onChange={(event) => setTitle(event.currentTarget.value)}
					onKeyDown={onTitleKeyDown}
				/>
				{/* The text area comes before the toolbar in the DOM so that Tab from
				the title field moves directly into the text, skipping the toolbar
				buttons. The CSS visually places the toolbar above the text area. */}
				<div className="card-dialog-editor">
					<textarea
						ref={descriptionRef}
						className="note-editor"
						placeholder="Description (optional)"
						defaultValue={props.initialDescription ?? ''}
						onKeyDown={onDescriptionKeyDown}
					></textarea>
					<CardDialogToolbar onCommand={onFormattingCommand} />
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={onEditorCancel}>Cancel</Button>
				<Button onClick={onEditorSubmit} color="primary" disabled={!title.trim()}>{labels.confirmButton}</Button>
			</DialogActions>
			{renderLinkDialog()}
		</Dialog>
	);
}
