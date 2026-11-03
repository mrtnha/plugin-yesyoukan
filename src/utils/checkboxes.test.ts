import {
	checkedCheckboxRegex, emptyCheckboxLineRegex, isEmptyCheckboxLine,
	uncheckedCheckboxRegex, uncheckedCheckboxWithoutSpaceRegex,
} from './checkboxes';

describe('checkboxes', () => {

	it('should match a checkbox marker only when followed by a space or the end of the line', () => {
		expect(uncheckedCheckboxRegex.test('- [ ] Task')).toBe(true);
		expect(uncheckedCheckboxRegex.test('- [ ]')).toBe(true);
		expect(uncheckedCheckboxRegex.test('- [ ]x')).toBe(false);

		expect(checkedCheckboxRegex.test('- [x] Task')).toBe(true);
		expect(checkedCheckboxRegex.test('- [X]')).toBe(true);
		expect(checkedCheckboxRegex.test('- [x]x')).toBe(false);
	});

	it('should recognize an empty checkbox item, with or without its trailing space', () => {
		for (const line of ['- [ ]', '- [ ] ', '- [x]', '- [x]  ', '  - [ ] ']) {
			expect(isEmptyCheckboxLine(line)).toBe(true);
		}

		for (const line of ['- [ ] Task', '- [x] Task', 'Task - [ ]', '- [ ] https://example.com']) {
			expect(isEmptyCheckboxLine(line)).toBe(false);
		}

		// The regex itself must also reject a marker with content - a URL
		// right after the marker is still content.
		expect(emptyCheckboxLineRegex.test('- [ ] https://example.com')).toBe(false);
	});

	it('should match an empty unchecked item only when its trailing space is missing', () => {
		expect(uncheckedCheckboxWithoutSpaceRegex.test('- [ ]')).toBe(true);
		expect(uncheckedCheckboxWithoutSpaceRegex.test('  - [ ]')).toBe(true);
		expect(uncheckedCheckboxWithoutSpaceRegex.test('- [ ] ')).toBe(false);
		expect(uncheckedCheckboxWithoutSpaceRegex.test('- [x]')).toBe(false);
		expect(uncheckedCheckboxWithoutSpaceRegex.test('- [ ] Task')).toBe(false);
	});

});
