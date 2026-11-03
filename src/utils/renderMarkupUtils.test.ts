import { toggleCheckbox } from './renderMarkupUtils';

describe('renderMarkupUtils', () => {

	it('should toggle a checkbox', () => {
		expect(toggleCheckbox('checkboxclick:unchecked:0', '- [ ] first\n- [ ] second'))
			.toBe('- [x] first\n- [ ] second');
	});

	it('should toggle a checked checkbox back to unchecked', () => {
		expect(toggleCheckbox('checkboxclick:checked:1', '- [ ] first\n- [x] second'))
			.toBe('- [ ] first\n- [ ] second');
	});

	it('should toggle an empty checkbox item', () => {
		// The trailing space of an empty checkbox item is meaningful - it is
		// what makes the item a checkbox - and must be preserved.
		expect(toggleCheckbox('checkboxclick:unchecked:0', '- [ ] '))
			.toBe('- [x] ');
		expect(toggleCheckbox('checkboxclick:unchecked:1', 'some text\n- [ ] '))
			.toBe('some text\n- [x] ');
	});

	it('should restore the trailing space when an empty item is toggled back to unchecked', () => {
		expect(toggleCheckbox('checkboxclick:checked:0', '- [x] '))
			.toBe('- [ ] ');
		expect(toggleCheckbox('checkboxclick:checked:0', '- [x]'))
			.toBe('- [ ] ');
	});

	it('should toggle an indented empty checkbox item', () => {
		expect(toggleCheckbox('checkboxclick:unchecked:0', '  - [ ] '))
			.toBe('  - [x] ');
	});

	it('should return the body unchanged when the line has no checkbox', () => {
		// This used to throw a TypeError: the failure path of the line
		// lookup returned a string where an array was expected.
		const body = 'not a checkbox line';
		expect(toggleCheckbox('checkboxclick:unchecked:0', body)).toBe(body);
	});

	it('should return the body unchanged when the line index is out of bounds', () => {
		const body = '- [ ] one\n- [ ] two';
		expect(toggleCheckbox('checkboxclick:unchecked:2', body)).toBe(body);
		// A negative index used to read an undefined line and throw.
		expect(toggleCheckbox('checkboxclick:unchecked:-1', body)).toBe(body);
	});

});
