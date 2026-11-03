import * as React from 'react';
import { backgroundColorLabels, Colors, getColorIds } from '../utils/colors';

interface Props {
	colors: Colors;
	// The selected color: a palette ID as a string (e.g. '3'), or '' when
	// the card has no color.
	value: string;
	onChange: (color: string) => void;
}

// The color row of the card dialog: a "no color" swatch first, then one
// swatch per color of the palette. It reuses the pattern of Joplin's
// whiteboard color swatches: round swatches, the selected one marked with a
// ring, and a "no color" swatch with a diagonal slash on the background
// color. The styling lives in main.css (.card-dialog-color-row).
//
// The value is the palette ID as a string, because that is what
// CardSettings.backgroundColor stores and what the .background-N CSS classes
// expect - not the hex color itself. A value that matches no palette entry
// (e.g. a hand-typed hex color in the note) marks no swatch as selected,
// and is left unchanged until the user picks a swatch.
export default (props:Props) => {
	const renderNoColorSwatch = () => {
		const active = !props.value;

		return (
			<button
				type="button"
				className={active ? 'color-swatch -none -active' : 'color-swatch -none'}
				title="No colour"
				aria-label="No colour"
				aria-pressed={active}
				onClick={() => props.onChange('')}
			/>
		);
	}

	const renderColorSwatch = (colorId:number) => {
		const active = props.value === String(colorId);
		const label = backgroundColorLabels[colorId] ?? `Colour ${colorId}`;

		return (
			<button
				type="button"
				key={colorId}
				className={active ? 'color-swatch -active' : 'color-swatch'}
				title={label}
				aria-label={label}
				aria-pressed={active}
				style={{ backgroundColor: props.colors[colorId] }}
				onClick={() => props.onChange(String(colorId))}
			/>
		);
	}

	return (
		<div className="card-dialog-color-row">
			{renderNoColorSwatch()}
			{getColorIds(props.colors).map(renderColorSwatch)}
		</div>
	);
}
