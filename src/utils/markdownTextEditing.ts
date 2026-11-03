// Markdown text editing helpers.
//
// Each helper takes the current state of the editor (the text and the
// selection) and returns the new state. The helpers are pure functions - they
// never touch the DOM or any particular editor - which makes them easy to
// unit test. The caller (the CodeMirror editor of the card dialog) is
// responsible for applying the returned state to the editor.
//
// The behaviour mirrors Joplin's own Markdown editor where it makes sense (see
// the Joplin source: packages/editor/CodeMirror/editorCommands/), simplified
// to a plain text buffer: no syntax tree and a single selection.

export interface TextState {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

// Joplin's default indent unit (its "indent with tabs" setting is off by
// default).
export const indentUnit = '    ';

// ----------------------------------------------------------------------------
// Text area helpers (the only functions that touch the DOM)
// ----------------------------------------------------------------------------

export const getTextareaState = (textarea: HTMLTextAreaElement): TextState => {
	return {
		value: textarea.value,
		selectionStart: textarea.selectionStart,
		selectionEnd: textarea.selectionEnd,
	};
};

export const setTextareaState = (textarea: HTMLTextAreaElement, state: TextState) => {
	textarea.value = state.value;
	textarea.selectionStart = state.selectionStart;
	textarea.selectionEnd = state.selectionEnd;
};

// ----------------------------------------------------------------------------
// Line utilities
// ----------------------------------------------------------------------------

interface LineBounds {
	startIndex: number;
	endIndex: number; // exclusive - the index of the newline character, or value.length
}

// Returns the bounds of the full lines covered by the selection.
const lineBounds = (value: string, selectionStart: number, selectionEnd: number): LineBounds => {
	const startIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
	const endPos = selectionEnd > selectionStart ? selectionEnd - 1 : selectionEnd;
	let endIndex = value.indexOf('\n', endPos);
	if (endIndex < 0) endIndex = value.length;
	return { startIndex, endIndex };
};

const countLeadingSpaces = (line: string): number => {
	const m = line.match(/^\s*/);
	return m ? m[0].length : 0;
};

// ----------------------------------------------------------------------------
// List items
// ----------------------------------------------------------------------------

export enum ListType {
	Bulleted = 'bulleted',
	Numbered = 'numbered',
	Checkbox = 'checkbox',
}

const checkboxItemRegex = /^(\s*)([-*])\s\[[ xX]\]\s/;
const bulletedItemRegex = /^(\s*)([-*])\s(?!\[[ xX]\]\s)/;
const numberedItemRegex = /^(\s*)(\d+)\.\s/;

export interface ListItemInfo {
	type: ListType;
	indent: string;
	markerLength: number; // length of the indent + the marker
	number?: number; // only for numbered items
}

// Parses the list item marker at the beginning of a line, if any.
export const parseListItem = (line: string): ListItemInfo | null => {
	let m = line.match(checkboxItemRegex);
	if (m) return { type: ListType.Checkbox, indent: m[1], markerLength: m[0].length };
	m = line.match(numberedItemRegex);
	if (m) return { type: ListType.Numbered, indent: m[1], markerLength: m[0].length, number: Number(m[2]) };
	m = line.match(bulletedItemRegex);
	if (m) return { type: ListType.Bulleted, indent: m[1], markerLength: m[0].length };
	return null;
};

// Returns true if the line that contains the cursor is a list item.
export const lineIsListItem = (state: TextState): boolean => {
	const { value, selectionStart } = state;
	const bounds = lineBounds(value, selectionStart, selectionStart);
	return !!parseListItem(value.slice(bounds.startIndex, bounds.endIndex));
};

// ----------------------------------------------------------------------------
// Inline formats (bold, italic, code)
// ----------------------------------------------------------------------------

// Toggles the given marker (e.g. "**") around the selection. With an empty
// selection, inserts an empty marked region with the caret inside it, or
// removes the markers if the caret is inside a marked region.
export const toggleInlineFormat = (state: TextState, marker: string): TextState => {
	const { value, selectionStart, selectionEnd } = state;

	if (selectionStart === selectionEnd) {
		const before = value.slice(Math.max(0, selectionStart - marker.length), selectionStart);
		const after = value.slice(selectionStart, selectionStart + marker.length);

		if (before === marker && after === marker) {
			// The caret is inside an empty marked region - remove both markers
			return {
				value: value.slice(0, selectionStart - marker.length) + value.slice(selectionStart + marker.length),
				selectionStart: selectionStart - marker.length,
				selectionEnd: selectionStart - marker.length,
			};
		}

		// Insert an empty marked region, with the caret inside it
		return {
			value: value.slice(0, selectionStart) + marker + marker + value.slice(selectionStart),
			selectionStart: selectionStart + marker.length,
			selectionEnd: selectionStart + marker.length,
		};
	}

	// Non-empty selection: toggle the markers around it
	if (
		selectionEnd - selectionStart >= marker.length * 2 &&
		value.slice(selectionStart, selectionStart + marker.length) === marker &&
		value.slice(selectionEnd - marker.length, selectionEnd) === marker
	) {
		return {
			value: value.slice(0, selectionStart)
				+ value.slice(selectionStart + marker.length, selectionEnd - marker.length)
				+ value.slice(selectionEnd),
			selectionStart,
			selectionEnd: selectionEnd - marker.length * 2,
		};
	}

	return {
		value: value.slice(0, selectionStart)
			+ marker
			+ value.slice(selectionStart, selectionEnd)
			+ marker
			+ value.slice(selectionEnd),
		selectionStart,
		selectionEnd: selectionEnd + marker.length * 2,
	};
};

// Toggles inline code for a single-line selection, and a fenced code block for
// a multi-line selection.
export const toggleCode = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;

	if (!value.slice(selectionStart, selectionEnd).includes('\n')) {
		return toggleInlineFormat(state, '`');
	}

	const bounds = lineBounds(value, selectionStart, selectionEnd);

	// Previous and next lines, to check whether the selection is already
	// fenced
	let prevLine = '';
	if (bounds.startIndex > 0) {
		const prevStart = value.lastIndexOf('\n', bounds.startIndex - 2) + 1;
		prevLine = value.slice(prevStart, bounds.startIndex - 1);
	}
	let nextLine = '';
	if (bounds.endIndex < value.length) {
		const nextEnd = value.indexOf('\n', bounds.endIndex + 1);
		nextLine = value.slice(bounds.endIndex + 1, nextEnd < 0 ? value.length : nextEnd);
	}

	if (prevLine === '```' && nextLine === '```') {
		// Remove the fences around the selected lines
		const prevStart = value.lastIndexOf('\n', bounds.startIndex - 2) + 1;
		const nextEnd = value.indexOf('\n', bounds.endIndex + 1);
		const removeEnd = nextEnd < 0 ? value.length : nextEnd;

		const selectedLines = value.slice(bounds.startIndex, bounds.endIndex);
		const newValue = value.slice(0, prevStart) + selectedLines + value.slice(removeEnd);

		return {
			value: newValue,
			selectionStart: prevStart,
			selectionEnd: prevStart + selectedLines.length,
		};
	}

	// Add fences around the selected lines
	return {
		value: value.slice(0, bounds.startIndex)
			+ '```\n'
			+ value.slice(bounds.startIndex, bounds.endIndex)
			+ '\n```'
			+ value.slice(bounds.endIndex),
		selectionStart: bounds.startIndex,
		selectionEnd: bounds.endIndex,
	};
};

// ----------------------------------------------------------------------------
// Line formats (lists, blockquote)
// ----------------------------------------------------------------------------

// Renumber the ordered list items around the current selection, so that each
// run of ordered items at the same indent level is numbered 1, 2, 3... Nested
// items restart at 1, and returning to the parent level continues the parent's
// numbering - like Joplin's own editor does after indenting or unindenting.
const renumberOrderedLists = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;

	const lines = value.split('\n');
	const lineStarts: number[] = [];
	let pos = 0;
	for (const line of lines) {
		lineStarts.push(pos);
		pos += line.length + 1;
	}

	const lineIndexOf = (index: number): number => {
		for (let i = lines.length - 1; i >= 0; i--) {
			if (lineStarts[i] <= index) return i;
		}
		return 0;
	};

	let startLine = lineIndexOf(selectionStart);
	let endLine = lineIndexOf(Math.max(selectionStart, selectionEnd - 1));

	const isListItem = (line: string) => !!parseListItem(line);

	// Expand the range to the surrounding block of consecutive list items.
	// Blank lines between items are included if the list continues after them.
	while (startLine > 0) {
		const prev = lines[startLine - 1];
		if (isListItem(prev)) { startLine--; continue; }
		if (prev.trim() === '' && startLine >= 2 && isListItem(lines[startLine - 2])) { startLine -= 2; continue; }
		break;
	}
	while (endLine < lines.length - 1) {
		const next = lines[endLine + 1];
		if (isListItem(next)) { endLine++; continue; }
		if (next.trim() === '' && endLine <= lines.length - 3 && isListItem(lines[endLine + 2])) { endLine += 2; continue; }
		break;
	}

	if (!lines.slice(startLine, endLine + 1).some(l => parseListItem(l)?.type === ListType.Numbered)) {
		return state;
	}

	const counters: number[] = [];
	const newLines = [...lines];
	let changed = false;
	let newSelStart = selectionStart;
	let newSelEnd = selectionEnd;
	let afterBlankLine = false;

	for (let i = startLine; i <= endLine; i++) {
		const line = lines[i];
		let newLine = line;
		const indent = countLeadingSpaces(line);
		const item = parseListItem(line);

		if (line.trim() === '') {
			// A blank line does not interrupt a list by itself
			afterBlankLine = true;
		} else if (!item) {
			// A content line that directly follows a list item is a lazy
			// continuation of it (in CommonMark) and does not interrupt the
			// list. A content line that follows a blank line interrupts the
			// list, unless it is indented deep enough to still belong to the
			// item above.
			const maxLevel = afterBlankLine ? indent : indent + 3;
			if (counters.length > maxLevel) counters.length = maxLevel;
			afterBlankLine = false;
		} else if (item.type === ListType.Numbered) {
			if (counters.length > indent + 1) counters.length = indent + 1;
			counters[indent] = (counters[indent] || 0) + 1;
			newLine = line.replace(numberedItemRegex, `${item.indent}${counters[indent]}. `);
			afterBlankLine = false;
		} else {
			// A bulleted or checkbox item interrupts the ordered list at the
			// same level
			if (counters.length > indent + 1) counters.length = indent + 1;
			counters[indent] = 0;
			afterBlankLine = false;
		}

		if (lineStarts[i] < selectionStart) newSelStart += newLine.length - line.length;
		if (lineStarts[i] < selectionEnd) newSelEnd += newLine.length - line.length;
		if (newLine !== line) changed = true;
		newLines[i] = newLine;
	}

	if (!changed) return state;

	return {
		value: newLines.join('\n'),
		selectionStart: newSelStart,
		selectionEnd: newSelEnd,
	};
};

// Toggles a list marker on the selected lines: applies the marker if they are
// not all of the given type yet, and removes it otherwise. Converting between
// list types replaces the marker. Blank lines are left untouched.
export const toggleList = (state: TextState, listType: ListType): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const lines = value.slice(bounds.startIndex, bounds.endIndex).split('\n');

	const nonEmptyLines = lines.filter(l => l.trim() !== '');
	if (!nonEmptyLines.length) return state;

	const allLinesAreOfType = nonEmptyLines.every(l => {
		const item = parseListItem(l);
		return item && item.type === listType;
	});

	const newLines = lines.map(line => {
		if (line.trim() === '') return line;

		const item = parseListItem(line);
		if (allLinesAreOfType) {
			// Remove the marker
			return line.slice(item.markerLength);
		}

		// Apply the marker, or convert the existing marker to it
		const indent = item ? item.indent : line.slice(0, countLeadingSpaces(line));
		const content = item ? line.slice(item.markerLength) : line.slice(indent.length);

		if (listType === ListType.Bulleted) return `${indent}- ${content}`;
		if (listType === ListType.Checkbox) return `${indent}- [ ] ${content}`;
		return `${indent}1. ${content}`; // renumbered below
	});

	const newText = newLines.join('\n');
	const newValue = value.slice(0, bounds.startIndex) + newText + value.slice(bounds.endIndex);

	return renumberOrderedLists({
		value: newValue,
		selectionStart: bounds.startIndex,
		selectionEnd: bounds.startIndex + newText.length,
	});
};

// Toggles a blockquote marker ("> ") on the selected lines.
export const toggleBlockquote = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const lines = value.slice(bounds.startIndex, bounds.endIndex).split('\n');

	const nonEmptyLines = lines.filter(l => l.trim() !== '');
	if (!nonEmptyLines.length) return state;

	const allLinesAreQuoted = nonEmptyLines.every(l => /^>\s?/.test(l));

	const newLines = lines.map(line => {
		if (line.trim() === '') return line;
		if (allLinesAreQuoted) {
			// Remove one level of quoting
			return line.replace(/^>\s?/, '');
		}
		return '> ' + line;
	});

	const newText = newLines.join('\n');
	const newValue = value.slice(0, bounds.startIndex) + newText + value.slice(bounds.endIndex);

	return {
		value: newValue,
		selectionStart: bounds.startIndex,
		selectionEnd: bounds.startIndex + newText.length,
	};
};

// ----------------------------------------------------------------------------
// Indentation
// ----------------------------------------------------------------------------

// Indents the selected lines by one indent unit (4 spaces).
export const indentLines = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const lines = value.slice(bounds.startIndex, bounds.endIndex).split('\n');

	const newLines = lines.map(l => indentUnit + l);
	const newText = newLines.join('\n');
	const newValue = value.slice(0, bounds.startIndex) + newText + value.slice(bounds.endIndex);

	return renumberOrderedLists({
		value: newValue,
		selectionStart: bounds.startIndex,
		selectionEnd: bounds.startIndex + newText.length,
	});
};

// Unindents the selected lines by one indent unit (removes one tab, or up to 4
// leading spaces, from each line).
export const unindentLines = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const lines = value.slice(bounds.startIndex, bounds.endIndex).split('\n');

	const newLines = lines.map(l => l.replace(/^(?:\t|[ ]{1,4})/, ''));
	const newText = newLines.join('\n');
	const newValue = value.slice(0, bounds.startIndex) + newText + value.slice(bounds.endIndex);

	return renumberOrderedLists({
		value: newValue,
		selectionStart: bounds.startIndex,
		selectionEnd: bounds.startIndex + newText.length,
	});
};

// ----------------------------------------------------------------------------
// Line continuation (Enter key)
// ----------------------------------------------------------------------------

// When the caret is at the end of a list item line, returns the state with a
// new line started below with the same markup (like Joplin's editor does when
// pressing Enter inside a list). On a line that contains only the list marker,
// the marker is removed instead, to exit the list. Returns null when the
// default "insert a newline" behaviour should be used instead.
export const continueListMarkup = (state: TextState): TextState | null => {
	const { value, selectionStart, selectionEnd } = state;

	// Only handle a simple caret at the end of a line
	if (selectionStart !== selectionEnd) return null;

	const bounds = lineBounds(value, selectionStart, selectionEnd);
	if (selectionStart !== bounds.endIndex) return null;

	const line = value.slice(bounds.startIndex, bounds.endIndex);
	const item = parseListItem(line);
	if (!item) return null;

	const content = line.slice(item.markerLength);

	if (content.trim() === '') {
		// The line contains only the marker - remove it to exit the list
		return {
			value: value.slice(0, bounds.startIndex) + value.slice(bounds.endIndex),
			selectionStart: bounds.startIndex,
			selectionEnd: bounds.startIndex,
		};
	}

	let marker: string;
	if (item.type === ListType.Numbered) {
		marker = `${item.indent}${item.number + 1}. `;
	} else if (item.type === ListType.Checkbox) {
		// The new item is always unchecked
		marker = `${item.indent}- [ ] `;
	} else {
		marker = `${item.indent}- `;
	}

	const insert = '\n' + marker;

	return {
		value: value.slice(0, selectionStart) + insert + value.slice(selectionStart),
		selectionStart: selectionStart + insert.length,
		selectionEnd: selectionStart + insert.length,
	};
};

// ----------------------------------------------------------------------------
// Insertions
// ----------------------------------------------------------------------------

// Inserts text at the caret, replacing the selection.
export const insertTextAtCursor = (state: TextState, text: string): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	return {
		value: value.slice(0, selectionStart) + text + value.slice(selectionEnd),
		selectionStart: selectionStart + text.length,
		selectionEnd: selectionStart + text.length,
	};
};

// Inserts a hyperlink. An empty label inserts the bare URL (like Joplin's
// editor does).
export const insertLink = (state: TextState, url: string, label: string = ''): TextState => {
	return insertTextAtCursor(state, label ? `[${label}](${url})` : url);
};

// Inserts a horizontal rule ("* * *" - the same marker Joplin uses) at the end
// of the current line.
export const insertHorizontalRule = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const prefix = value.slice(bounds.startIndex, bounds.endIndex).trim() === '' ? '' : '\n';
	const insert = `${prefix}* * *`;
	const insertPos = bounds.endIndex;
	return {
		value: value.slice(0, insertPos) + insert + value.slice(insertPos),
		selectionStart: insertPos + insert.length,
		selectionEnd: insertPos + insert.length,
	};
};

// Inserts an empty table at the end of the current line.
export const insertTable = (state: TextState): TextState => {
	const { value, selectionStart, selectionEnd } = state;
	const bounds = lineBounds(value, selectionStart, selectionEnd);
	const prefix = value.slice(bounds.startIndex, bounds.endIndex).trim() === '' ? '' : '\n';
	const insert = `${prefix}|  |  |\n| --- | --- |\n|  |  |`;
	const insertPos = bounds.endIndex;
	return {
		value: value.slice(0, insertPos) + insert + value.slice(insertPos),
		selectionStart: insertPos + insert.length,
		selectionEnd: insertPos + insert.length,
	};
};
