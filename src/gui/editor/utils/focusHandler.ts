// Reimplementation of @joplin/lib/utils/focusHandler.ts (from the Joplin
// source repository, Copyright (c) Laurent Cozic, MIT licensed - same license
// as this plugin). Joplin's version routes all focus/blur calls through a
// logger, which depends on @joplin/utils - not available here. This is a
// simple pass-through with the same interface.
//
interface FocusOptions {
	preventScroll: boolean;
}

type MaybeFocusable = {
	focus?: (...args: unknown[])=> void;
	blur?: (...args: unknown[])=> void;
};

const toggleFocus = (source: string, element: unknown, action: 'focus'|'blur', options: FocusOptions|null) => {
	if (!element) return;
	const focusable = element as MaybeFocusable;
	const fn = focusable[action];
	if (typeof fn !== 'function') return;
	if (options) {
		fn.call(focusable, options);
	} else {
		fn.call(focusable);
	}
};

export const focus = (source: string, element: unknown, options: FocusOptions|null = null) => {
	return toggleFocus(source, element, 'focus', options);
};

export const blur = (source: string, element: unknown, options: FocusOptions|null = null) => {
	return toggleFocus(source, element, 'blur', options);
};
