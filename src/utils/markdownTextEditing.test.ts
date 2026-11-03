import {
	continueListMarkup,
	indentLines,
	insertHorizontalRule,
	insertLink,
	insertTable,
	insertTextAtCursor,
	lineIsListItem,
	ListType,
	toggleBlockquote,
	toggleCode,
	toggleInlineFormat,
	toggleList,
	unindentLines,
} from './markdownTextEditing';

const state = (value: string, selectionStart: number, selectionEnd: number = selectionStart) => {
	return { value, selectionStart, selectionEnd };
};

describe('markdownTextEditing', () => {

	describe('toggleInlineFormat', () => {

		it('should wrap the selection', () => {
			expect(toggleInlineFormat(state('hello world', 6, 11), '**')).toEqual(state('hello **world**', 6, 15));
		});

		it('should unwrap an already-wrapped selection', () => {
			expect(toggleInlineFormat(state('hello **world**', 6, 15), '**')).toEqual(state('hello world', 6, 11));
		});

		it('should insert an empty marked region around the caret', () => {
			expect(toggleInlineFormat(state('hello', 5), '**')).toEqual(state('hello****', 7));
		});

		it('should remove the markers when the caret is inside an empty marked region', () => {
			expect(toggleInlineFormat(state('hello ****', 8), '**')).toEqual(state('hello ', 6));
		});

		it('should not unwrap when the selection is shorter than the two markers', () => {
			// Selecting only "**" must not produce a negative selection - it is
			// wrapped instead, like any other selection
			expect(toggleInlineFormat(state('a ** b', 2, 4), '**')).toEqual(state('a ****** b', 2, 8));
		});

	});

	describe('toggleCode', () => {

		it('should toggle inline code for a single-line selection', () => {
			expect(toggleCode(state('some code', 5, 9))).toEqual(state('some `code`', 5, 11));
		});

		it('should add fences around a multi-line selection', () => {
			expect(toggleCode(state('line1\nline2', 0, 11))).toEqual(state('```\nline1\nline2\n```', 0, 11));
		});

		it('should remove the fences around a fenced selection', () => {
			expect(toggleCode(state('```\ncode1\ncode2\n```', 4, 15))).toEqual(state('code1\ncode2', 0, 11));
		});

	});

	describe('toggleList', () => {

		it('should add a bulleted list marker to the current line', () => {
			expect(toggleList(state('hello', 5), ListType.Bulleted)).toEqual(state('- hello', 7));
		});

		it('should remove the bulleted list marker when all lines have it', () => {
			expect(toggleList(state('- hello', 0, 7), ListType.Bulleted)).toEqual(state('hello', 0, 5));
		});

		it('should convert a bulleted item to a checkbox', () => {
			expect(toggleList(state('- hello', 0, 7), ListType.Checkbox)).toEqual(state('- [ ] hello', 4, 11));
		});

		it('should number consecutive lines', () => {
			expect(toggleList(state('a\nb', 0, 3), ListType.Numbered)).toEqual(state('1. a\n2. b', 0, 9));
		});

		it('should convert only the lines that do not have the marker yet', () => {
			expect(toggleList(state('- a\nplain', 0, 9), ListType.Bulleted)).toEqual(state('- a\n- plain', 0, 11));
		});

		it('should preserve the indentation', () => {
			expect(toggleList(state('    hello', 8), ListType.Bulleted)).toEqual(state('    - hello', 10));
		});

		it('should leave blank lines untouched', () => {
			expect(toggleList(state('a\n\nb', 0, 4), ListType.Bulleted)).toEqual(state('- a\n\n- b', 0, 8));
		});

		it('should renumber ordered lists after converting to numbered', () => {
			expect(toggleList(state('- a\n- b\n- c', 0, 11), ListType.Numbered)).toEqual(state('1. a\n2. b\n3. c', 0, 14));
		});

		it('should apply the marker to an empty line, with the caret after it', () => {
			expect(toggleList(state('', 0), ListType.Bulleted)).toEqual(state('- ', 2));
			expect(toggleList(state('', 0), ListType.Numbered)).toEqual(state('1. ', 3));
			expect(toggleList(state('', 0), ListType.Checkbox)).toEqual(state('- [ ] ', 6));
		});

		it('should apply the marker to an empty line in the middle of the text', () => {
			expect(toggleList(state('a\n\nb', 2), ListType.Bulleted)).toEqual(state('a\n- \nb', 4));
		});

		it('should keep the caret at the same position in the text', () => {
			// The caret stays between "hello" and "world" - nothing is selected
			// that the next keystroke would replace
			expect(toggleList(state('hello world', 5), ListType.Bulleted)).toEqual(state('- hello world', 7));
		});

	});

	describe('toggleBlockquote', () => {

		it('should add a quote marker to the selected lines', () => {
			expect(toggleBlockquote(state('hello', 5))).toEqual(state('> hello', 7));
		});

		it('should apply the quote marker to an empty line, with the caret after it', () => {
			expect(toggleBlockquote(state('', 0))).toEqual(state('> ', 2));
		});

		it('should remove the quote marker', () => {
			expect(toggleBlockquote(state('> hello', 0, 7))).toEqual(state('hello', 0, 5));
		});

		it('should remove one level of quoting at a time', () => {
			expect(toggleBlockquote(state('>> hello', 0, 8))).toEqual(state('> hello', 0, 7));
		});

	});

	describe('indentLines / unindentLines', () => {

		it('should indent the current line', () => {
			expect(indentLines(state('hello', 5))).toEqual(state('    hello', 9));
		});

		it('should keep the caret at the end of the line when indenting', () => {
			// A subtask is created and the user can keep typing - nothing is
			// selected that the next keystroke would replace
			expect(indentLines(state('- [ ] task', 10))).toEqual(state('    - [ ] task', 14));
			expect(indentLines(state('- [ ] ', 6))).toEqual(state('    - [ ] ', 10));
		});

		it('should indent all the selected lines', () => {
			expect(indentLines(state('a\nb', 0, 3))).toEqual(state('    a\n    b', 0, 11));
		});

		it('should restart the numbering of an ordered item moved to a deeper level', () => {
			expect(indentLines(state('1. a\n2. b\n3. c', 5, 9)))
				.toEqual(state('1. a\n    1. b\n2. c', 9, 13));
		});

		it('should continue the parent numbering when an item returns to the parent level', () => {
			expect(unindentLines(state('1. a\n    1. b\n2. c', 5, 13)))
				.toEqual(state('1. a\n2. b\n3. c', 5, 9));
		});

		it('should unindent one indent unit (spaces or tab)', () => {
			expect(unindentLines(state('    hello', 9))).toEqual(state('hello', 5));
			expect(unindentLines(state('\thello', 6))).toEqual(state('hello', 5));
			expect(unindentLines(state('  hello', 7))).toEqual(state('hello', 5));
		});

		it('should keep the caret at the end of the line when unindenting', () => {
			expect(unindentLines(state('    - [ ] subtask', 17))).toEqual(state('- [ ] subtask', 13));
		});

		it('should not unindent a line that is not indented', () => {
			expect(unindentLines(state('hello', 5))).toEqual(state('hello', 5));
		});

	});

	describe('continueListMarkup', () => {

		it('should continue a bulleted list', () => {
			expect(continueListMarkup(state('- item', 6))).toEqual(state('- item\n- ', 9));
		});

		it('should continue a numbered list', () => {
			expect(continueListMarkup(state('1. item', 7))).toEqual(state('1. item\n2. ', 11));
		});

		it('should continue a checklist with an unchecked item', () => {
			expect(continueListMarkup(state('- [x] done', 10))).toEqual(state('- [x] done\n- [ ] ', 17));
		});

		it('should exit the list on an empty item', () => {
			expect(continueListMarkup(state('- ', 2))).toEqual(state('', 0));
		});

		it('should preserve the indentation when continuing', () => {
			expect(continueListMarkup(state('    - item', 10))).toEqual(state('    - item\n    - ', 17));
		});

		it('should do nothing on a line without list marker', () => {
			expect(continueListMarkup(state('plain text', 10))).toBe(null);
		});

		it('should do nothing when the caret is not at the end of the line', () => {
			expect(continueListMarkup(state('- item', 3))).toBe(null);
		});

		it('should do nothing when the selection is not empty', () => {
			expect(continueListMarkup(state('- item', 0, 6))).toBe(null);
		});

	});

	describe('insertions', () => {

		it('should insert text at the caret, replacing the selection', () => {
			// The selection "bc" is replaced by "X"
			expect(insertTextAtCursor(state('abc', 1, 3), 'X')).toEqual(state('aX', 2));
		});

		it('should insert a link with a label', () => {
			expect(insertLink(state('hello', 5), 'https://example.com', 'Example'))
				.toEqual(state('hello[Example](https://example.com)', 35));
		});

		it('should insert the bare URL when the label is empty', () => {
			expect(insertLink(state('hello', 5), 'https://example.com', ''))
				.toEqual(state('hellohttps://example.com', 24));
		});

		it('should insert a horizontal rule at the end of the current line', () => {
			expect(insertHorizontalRule(state('hello', 5))).toEqual(state('hello\n* * *', 11));
		});

		it('should insert a horizontal rule without a leading newline on an empty line', () => {
			expect(insertHorizontalRule(state('\n', 0))).toEqual(state('* * *\n', 5));
		});

		it('should insert a table at the end of the current line', () => {
			expect(insertTable(state('', 0))).toEqual(state('|  |  |\n| --- | --- |\n|  |  |', 29));
		});

	});

	describe('lineIsListItem', () => {

		it('should detect list items', () => {
			expect(lineIsListItem(state('- item', 4))).toBe(true);
			expect(lineIsListItem(state('1. item', 4))).toBe(true);
			expect(lineIsListItem(state('- [ ] item', 4))).toBe(true);
			expect(lineIsListItem(state('    - item', 8))).toBe(true);
		});

		it('should not detect plain text as a list item', () => {
			expect(lineIsListItem(state('plain text', 4))).toBe(false);
		});

	});

});
