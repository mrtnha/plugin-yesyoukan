import { useEffect, useState } from 'react';

export interface VisualViewportBox {
	top: number;
	left: number;
	width: number;
	height: number;
}

const readVisualViewport = (): VisualViewportBox => {
	const vv = window.visualViewport;
	if (vv) {
		return {
			top: vv.offsetTop,
			left: vv.offsetLeft,
			width: vv.width,
			height: vv.height,
		};
	}

	return {
		top: 0,
		left: 0,
		width: window.innerWidth,
		height: window.innerHeight,
	};
};

// Tracks the visual viewport: the part of the page that is actually visible
// on screen. On mobile, it shrinks when the on-screen keyboard opens (and it
// moves when the page is zoomed or panned), while the layout viewport - which
// `position: fixed` elements such as the MUI dialogs are sized against - does
// not. An element sized to this box therefore ends exactly at the top of the
// keyboard.
//
// When `enabled` is false, no listener is registered and the initial box is
// returned, so that the desktop app does not re-render on every resize.
export default (enabled: boolean): VisualViewportBox => {
	const [box, setBox] = useState<VisualViewportBox>(readVisualViewport);

	useEffect(() => {
		if (!enabled) return () => {};

		const onChange = () => {
			const newBox = readVisualViewport();
			setBox(current => {
				if (
					current.top === newBox.top &&
					current.left === newBox.left &&
					current.width === newBox.width &&
					current.height === newBox.height
				) return current;
				return newBox;
			});
		};

		onChange();

		const vv = window.visualViewport;
		if (vv) {
			vv.addEventListener('resize', onChange);
			vv.addEventListener('scroll', onChange);
		} else {
			window.addEventListener('resize', onChange);
		}

		return () => {
			if (vv) {
				vv.removeEventListener('resize', onChange);
				vv.removeEventListener('scroll', onChange);
			} else {
				window.removeEventListener('resize', onChange);
			}
		};
	}, [enabled]);

	return box;
};
