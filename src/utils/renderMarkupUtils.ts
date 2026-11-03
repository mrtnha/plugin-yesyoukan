import Logger from "@joplin/utils/Logger";
import {
	checkedCheckboxRegex, uncheckedCheckboxRegex, uncheckedCheckboxWithoutSpaceRegex,
} from "./checkboxes";

const logger = Logger.create('YesYouKan: renderMarkupUtils');

// Toggles the checkbox of the rendered card at the line described by the IPC
// message ("checkboxclick:<checked|unchecked>:<line_index>"). Returns the new
// body, or the original body when the message does not match a checkbox.
export const toggleCheckbox = (ipcMessage: string, noteBody: string) => {
	const newBody = noteBody.split('\n');
	const p = ipcMessage.split(':');
	const lineIndex = Number(p[p.length - 1]);
	if (lineIndex < 0 || lineIndex >= newBody.length) {
		logger.warn('Checkbox line out of bounds: ', ipcMessage);
		return noteBody;
	}

	const line = newBody[lineIndex];
	const trimmedLine = line.trim();

	const noCrossIndex = trimmedLine.search(uncheckedCheckboxRegex);
	const crossIndex = trimmedLine.search(checkedCheckboxRegex);

	if (noCrossIndex < 0 && crossIndex < 0) {
		logger.warn('Could not find matching checkbox for message: ', ipcMessage);
		return noteBody;
	}

	// A line containing both markers is pathological, but toggle the one
	// that appears first, like the previous implementation did.
	const isCrossLine = noCrossIndex >= 0 && crossIndex >= 0
		? crossIndex < noCrossIndex
		: crossIndex >= 0;

	let newLine;
	if (!isCrossLine) {
		newLine = line.replace('- [ ]', '- [x]');
	} else {
		newLine = line.replace(/- \[[xX]\]/, '- [ ]');

		// An empty unchecked item needs its trailing space: without it, the
		// item is not recognized as a checkbox (trimCardBody restores it on
		// the save path - this function writes the body directly).
		if (uncheckedCheckboxWithoutSpaceRegex.test(newLine)) newLine += ' ';
	}

	newBody[lineIndex] = newLine;
	return newBody.join('\n');
};
