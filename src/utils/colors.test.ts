import {
	backgroundColorLabels, darkBackgroundColors, getColorIds, lightBackgroundColors,
} from './colors';

// Relative luminance and contrast ratio as defined by WCAG, to check the
// readability bound of the palettes: every color must carry the card text
// with at least 4.5:1 (WCAG AA for normal text). The card text color is
// the one of Joplin's default themes (theme.color in the Joplin repository,
// packages/lib/themes/light.ts and dark.ts) - the plugin renders card text
// with var(--joplin-color).
const srgbChannelToLinear = (channel:number) => {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex:string) => {
	const r = parseInt(hex.substring(1, 3), 16);
	const g = parseInt(hex.substring(3, 5), 16);
	const b = parseInt(hex.substring(5, 7), 16);
	return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b);
};

const contrastRatio = (hex1:string, hex2:string) => {
	const [l1, l2] = [relativeLuminance(hex1), relativeLuminance(hex2)];
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
};

const lightThemeTextColor = '#32373F';
const darkThemeTextColor = '#dddddd';

describe('colors', () => {

	it('should return the IDs of the palette entries that have a color, in ascending order', () => {
		const palette = {
			0: '', // Default ("no color") - not a swatch
			2: '#fffacd',
			1: '#fff8dc',
			15: '#f0f0f0',
		};

		expect(getColorIds(palette)).toEqual([1, 2, 15]);
	});

	it('should have the same color IDs in the light and dark palettes, and a label for each', () => {
		const expectedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		expect(getColorIds(lightBackgroundColors)).toEqual(expectedIds);
		expect(getColorIds(darkBackgroundColors)).toEqual(expectedIds);

		for (const id of expectedIds) {
			expect(backgroundColorLabels[id]).toBeTruthy();
		}
	});

	it('should keep the card text readable on every color', () => {
		const failures:string[] = [];

		for (const id of getColorIds(lightBackgroundColors)) {
			const ratio = contrastRatio(lightBackgroundColors[id], lightThemeTextColor);
			if (ratio < 4.5) failures.push(`light ${backgroundColorLabels[id] ?? id} ${lightBackgroundColors[id]}: only ${ratio.toFixed(2)}:1 with ${lightThemeTextColor} text`);
		}

		for (const id of getColorIds(darkBackgroundColors)) {
			const ratio = contrastRatio(darkBackgroundColors[id], darkThemeTextColor);
			if (ratio < 4.5) failures.push(`dark ${backgroundColorLabels[id] ?? id} ${darkBackgroundColors[id]}: only ${ratio.toFixed(2)}:1 with ${darkThemeTextColor} text`);
		}

		// The message lists the offending entries, so that a failing tweak
		// can be adjusted directly.
		expect(failures).toEqual([]);
	});

});
