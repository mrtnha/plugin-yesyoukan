import * as React from 'react';
import { useEffect,useMemo, useCallback } from 'react';
import { Colors, colorValueToId, getColorValues } from '../utils/colors';

interface Props {
	colors: Colors;
	// The selected color: a palette ID as a string (e.g. '3'), or '' for no
	// color - the representation stored in the card and stack settings, and
	// expected by the .background-N CSS classes.
	value: string;
	onChange: (color: string) => void;
	isDarkMode: boolean;
}

const ColorPicker = (props:Props) => {
	const componentId = useMemo(() => {
		return 'color-picker-' + (Math.floor(Math.random() * 100000000));
	}, []);

	// The color is looked up directly in the palette rather than via a
	// throwing helper: a value that is not part of the palette - a
	// hand-typed hex value in the card-settings block, or an ID from the
	// palette of another version of the plugin - then simply displays like
	// "no color" instead of taking the whole dialog down.
	const colorValue = props.colors[Number(props.value)] ?? props.colors[0];

	const onChange = useCallback((color:string) => {
		props.onChange(String(colorValueToId(props.colors, color)));
	}, [props.onChange]);

	useEffect(() => {
		(window as any).Coloris({
			swatchesOnly: true,
			parent: '#' + componentId,
			swatches: getColorValues(props.colors),
			themeMode: props.isDarkMode ? 'dark' : 'light',
			onChange,
		});
	}, [props.colors, props.isDarkMode]);

	const inputStyle = useMemo(() => {
		return {
			backgroundColor: colorValue,
		}
	}, [colorValue]);

	return (
		<div id={componentId} className="color-picker">
			<input
				type="text"
				style={inputStyle}
				data-coloris
				defaultValue={colorValue}
				readOnly={true}
			/>
		</div>
	);
};

export default ColorPicker;
