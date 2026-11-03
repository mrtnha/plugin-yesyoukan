// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/CodeMirror/editorCommands/tableCommands.ts
//
// Only the helpers used by the vendored renderTables extension are included
// here (TableRange, isUnescapedPipe, getCellContentPosition), the rest of
// the table editing commands are not vendored.
//
import { EditorState } from '@codemirror/state';

export interface TableRange {
	// Start position of the table in the document
	from: number;
	// End position of the table in the document
	to: number;
	// Raw table text
	text: string;
}

// Check if a pipe at position `i` in `text` is unescaped.
// A pipe is escaped if preceded by an odd number of backslashes.
const isUnescapedPipe = (text: string, i: number): boolean => {
	if (text[i] !== '|') return false;
	let backslashes = 0;
	let j = i - 1;
	while (j >= 0 && text[j] === '\\') {
		backslashes++;
		j--;
	}
	return backslashes % 2 === 0;
};

// Find the document offset for the content of a specific cell.
// Returns the position right after the leading space inside the cell.
export const getCellContentPosition = (
	_state: EditorState,
	tableRange: TableRange,
	row: number,
	col: number,
): number | null => {
	const lines = tableRange.text.split('\n');

	// Map row to line index: row 0 → line 0, row 1+ → line (row+1), skipping delimiter
	const lineIdx = row === 0 ? 0 : row + 1;
	if (lineIdx >= lines.length) return null;

	const lineText = lines[lineIdx];
	const hasLeadingPipe = lineText.trimStart().startsWith('|');
	let charIdx = 0;

	if (hasLeadingPipe) {
		// Standard format: | A | B | — find the (col)th pipe and skip past it
		let pipeCount = 0;
		for (; charIdx < lineText.length; charIdx++) {
			if (isUnescapedPipe(lineText, charIdx)) {
				if (pipeCount === col) {
					charIdx++;
					while (charIdx < lineText.length && lineText[charIdx] === ' ') charIdx++;
					break;
				}
				pipeCount++;
			}
		}
	} else {
		// No leading pipe: A | B — cells are separated by pipes
		if (col === 0) {
			// First cell starts at the beginning of the line (skip whitespace)
			while (charIdx < lineText.length && lineText[charIdx] === ' ') charIdx++;
		} else {
			// Find the (col-1)th pipe separator and skip past it
			let pipeCount = 0;
			for (; charIdx < lineText.length; charIdx++) {
				if (isUnescapedPipe(lineText, charIdx)) {
					if (pipeCount === col - 1) {
						charIdx++;
						while (charIdx < lineText.length && lineText[charIdx] === ' ') charIdx++;
						break;
					}
					pipeCount++;
			}
			}
		}
	}

	// Calculate absolute position
	let lineStart = tableRange.from;
	for (let i = 0; i < lineIdx; i++) {
		lineStart += lines[i].length + 1; // +1 for newline
	}

	return lineStart + charIdx;
};
