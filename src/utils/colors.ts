export type Colors = Record<number, string>;

// Background color palettes of the cards and stacks.
//
// The palette is ordered so that it can be used as a priority scale -
// green (low / done), yellow, orange, red (urgent) - followed by pink,
// purple and the remaining colors for free use.
//
// The colors are deliberately vivid: the light variants are bright,
// saturated tints and the dark variants deep, saturated tones, so that
// every color is immediately recognizable (a red card looks red). They
// are bounded by the readability of the card text - WCAG AA, at least
// 4.5:1 against the text color of Joplin's default themes (#32373F in
// the light theme, #dddddd in the dark theme) - which the test suite
// checks. The dark theme is bounded harder than the light one: its
// near-white text forces the dark variants to stay deep.
//
// The blue follows the family of Joplin's own blues (#155BDA / #4a90e2),
// adapted for use as a background; the rest of the palette follows the
// same modern, flat aesthetic.
//
// NOTE: The color IDs are part of the note format (they are stored in the
// card-settings / stack-settings blocks). They were redefined when the
// palette was reordered in this fork, and the hex values behind an ID
// changed again when the whiteboard-matched values were replaced with this
// palette: notes created with the official plugin or in between those
// versions show shifted colors - re-assign the colors once.

export const lightBackgroundColors: Colors = {
	0: '', // Default
	1: '#69db7c', // green
	2: '#fde047', // yellow
	3: '#ff7f00', // orange
	4: '#f08080', // red
	5: '#f783ac', // pink
	6: '#b197fc', // purple
	7: '#66d9e8', // cyan
	8: '#4dabf7', // blue
	9: '#c99a63', // brown
	10: '#94a3b8', // grey
};

export const darkBackgroundColors: Colors = {
	0: '', // Default
	1: '#1b6b2e', // green
	2: '#6a6200', // yellow
	3: '#964b00', // orange
	4: '#b02525', // red
	5: '#a61e4d', // pink
	6: '#862e9c', // purple
	7: '#0a6274', // cyan
	8: '#145da0', // blue
	9: '#7d4f1f', // brown
	10: '#495057', // grey
};

// Human-readable name of each palette entry, used for the tooltips and the
// accessibility labels of the swatches.
export const backgroundColorLabels: Record<number, string> = {
	1: 'Green',
	2: 'Yellow',
	3: 'Orange',
	4: 'Red',
	5: 'Pink',
	6: 'Purple',
	7: 'Cyan',
	8: 'Blue',
	9: 'Brown',
	10: 'Grey',
};

export const getColorValues = (colors:Colors) => {
	const output:string[] = [];
	for (const [, value] of Object.entries(colors)) {
		if (!value) continue;
		output.push(value);
	}
	return output;
}

// Returns the IDs of the palette entries that have a color, in ascending
// order - the swatches to display in a color row. The entry 0 is the
// default ("no color") and is not included.
export const getColorIds = (colors:Colors):number[] => {
	const output:number[] = [];
	for (const [id, value] of Object.entries(colors)) {
		if (!value) continue;
		output.push(Number(id));
	}
	return output.sort((a, b) => a - b);
}

export const colorValueToId = (colors:Colors, colorValue:string) => {
	colorValue = colorValue.toLowerCase();
	for (const [id, value] of Object.entries(colors)) {
		if (value === colorValue) return Number(id);
	}
	throw new Error('Invalid color value: ' + colorValue);
}

export const colorsToCss = (colors:Colors, classPrefix:string, cssProp:string) => {
	const output:string[] = [];
	for (const [id, value] of Object.entries(colors)) {
		if (!value) continue;
		output.push(`.${classPrefix}-${id} { ${cssProp}: ${value}; }`)
	}
	return output.join('\n');
}