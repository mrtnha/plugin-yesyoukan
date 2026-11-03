// Vendored type definitions from the Joplin source repository
// (packages/editor/types.ts), Copyright (c) Laurent Cozic, MIT licensed -
// same license as this plugin. Trimmed for this plugin:
//
// - EditorTheme is flattened to the fields actually used: it extends the
// Theme type from @joplin/lib in Joplin, which is not available inside a
// plugin webview, and fontSize may also be a CSS variable - Joplin always
// passes a plain number.
// - EditorSettings is trimmed to the fields used by the vendored extensions:
// the interactive table widget only reads preferMacShortcuts.

export interface EditorTheme {
	appearance: 'dark' | 'light';
	themeId: number;
	fontFamily: string;
	fontSize: number|string;
	fontSizeUnits?: string;
	isDesktop?: boolean;
	monospaceFont?: string;
	contentMaxWidth?: number;
	marginLeft?: number;
	marginRight?: number;
	paddingBottom: number;

	// From @joplin/lib's Theme:
	color: string;
	colorFaded: string;
	backgroundColor: string;
	dividerColor: string;
	selectedColor: string;
	urlColor: string;
	blockQuoteOpacity: number;
	searchMarkerColor: string;
	searchMarkerBackgroundColor: string;
}

export interface EditorSettings {
	preferMacShortcuts: boolean;
}
