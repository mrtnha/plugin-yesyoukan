// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/extensions/editorSettingsExtension.ts
//
//
import { Facet, StateEffect, StateField } from '@codemirror/state';
import { EditorSettings } from './editorTypes';

export const setEditorSettingsEffect = StateEffect.define<EditorSettings>();

export const editorSettingsFacet = Facet.define<EditorSettings|null, EditorSettings|null>({
	combine: (possibleValues) => {
		return possibleValues.filter(value => !!value)[0] ?? null;
	},
});

export default (initialSettings: EditorSettings) => [
	StateField.define<EditorSettings|null>({
		create: () => initialSettings,
		update: (oldValue, transaction) => {
			for (const e of transaction.effects) {
				if (e.is(setEditorSettingsEffect)) {
					return e.value;
				}
			}
			return oldValue;
		},
		provide: (field) => editorSettingsFacet.from(field),
	}),
];
