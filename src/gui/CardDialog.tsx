import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import moveCaretToEnd from '../utils/moveCaretToEnd';

export interface CardDialogData {
	title: string;
	description: string;
}

interface Props {
	mode: 'add' | 'edit';
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
// non-empty. The description is optional and multi-line: pressing Enter
// inserts a newline, so writing a description never accidentally closes the
// dialog.
//
// Keyboard behaviour:
// - Title: Enter confirms the dialog, Tab moves to the description field.
// - Description: Enter inserts a newline, Ctrl/Cmd+Enter confirms the dialog,
//   Tab inserts a tab character (like the in-place card editor).
// - Escape closes the dialog (handled by the dialog itself).
export default (props:Props) => {
	const [title, setTitle] = useState(props.initialTitle ?? '');
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
			// Insert a tab character, like the in-place card editor. A leading
			// tab is also meaningful in Markdown (code block).
			event.preventDefault();
			const textarea = event.currentTarget as HTMLTextAreaElement;
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			textarea.value = textarea.value.substring(0, start) + "\t" + textarea.value.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + 1;
		}
	}, [onEditorSubmit]);

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
				<div style={{ marginTop: '16px' }}>
					<textarea
						ref={descriptionRef}
						className="note-editor"
						placeholder="Description (optional)"
						defaultValue={props.initialDescription ?? ''}
						onKeyDown={onDescriptionKeyDown}
					></textarea>
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={onEditorCancel}>Cancel</Button>
				<Button onClick={onEditorSubmit} color="primary" disabled={!title.trim()}>{labels.confirmButton}</Button>
			</DialogActions>
		</Dialog>
	);
}
