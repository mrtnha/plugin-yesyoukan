import * as React from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faEllipsisH, faIndent, faOutdent, faTable } from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import {
	iconAddDate, iconBold, iconBulletedList, iconCode, iconItalic, iconLink,
	iconNumberedList, iconQuote, iconToDoList,
} from './joplinIcons';

export type FormattingCommand =
	| 'bold'
	| 'italic'
	| 'link'
	| 'code'
	| 'bulletedList'
	| 'numberedList'
	| 'checkboxList'
	| 'indent'
	| 'unindent'
	| 'horizontalRule'
	| 'blockquote'
	| 'table'
	| 'time';

// The formatting toolbar of the card dialog. It offers the same actions as
// Joplin's own Markdown editor toolbar, in the same order, with the same
// icons: the glyphs are extracted from Joplin's own icon font (see
// joplinIcons.ts), and the horizontal rule and table buttons use the same
// Font Awesome icons Joplin uses. The indent and unindent buttons have no
// Joplin counterpart (Joplin has the commands, but no toolbar buttons), so
// Font Awesome icons are used for them.
//
// Deliberately not included:
//
// - Heading: the board format uses "# " (stack) and "## " (card) at line
//   starts, so headings in a card description would corrupt the board the
//   next time the note is parsed. Bold text can be used for emphasis instead.
//
// - Attach file: attaching a file would require creating a Joplin resource
//   from the plugin and resources are currently not rendered reliably inside
//   the plugin editor webview. If this is needed in the future, it can be
//   implemented via the plugin API (dialogs.showOpenDialog + POST /resources)
//   together with resource URL handling in the card rendering.
//
// - Link to note: would require a note picker with access to the search API
//   (IPC message + joplin.data.get(['search'])). The link format itself,
//   "[Title](:/id)", is already supported by the cards. See also the "Editing
//   cards" section of the README.
//
// - Insert drawing: not available to plugin editors at all.
interface ToolbarButton {
	command: FormattingCommand;
	icon: IconProp;
	title: string;
}

const toolbarButtons: ToolbarButton[] = [
	{ command: 'bold', icon: iconBold, title: 'Bold' },
	{ command: 'italic', icon: iconItalic, title: 'Italic' },
	{ command: 'link', icon: iconLink, title: 'Hyperlink' },
	{ command: 'code', icon: iconCode, title: 'Code' },
	{ command: 'bulletedList', icon: iconBulletedList, title: 'Bulleted List' },
	{ command: 'numberedList', icon: iconNumberedList, title: 'Numbered List' },
	{ command: 'checkboxList', icon: iconToDoList, title: 'Checkbox' },
	{ command: 'indent', icon: faIndent, title: 'Indent more' },
	{ command: 'unindent', icon: faOutdent, title: 'Indent less' },
	{ command: 'horizontalRule', icon: faEllipsisH, title: 'Horizontal Rule' },
	{ command: 'blockquote', icon: iconQuote, title: 'Blockquote' },
	{ command: 'table', icon: faTable, title: 'Insert table' },
	{ command: 'time', icon: iconAddDate, title: 'Insert time' },
];

interface Props {
	onCommand: (command: FormattingCommand) => void;
}

export default (props: Props) => {
	const renderButtons = () => {
		return toolbarButtons.map(button => {
			return (
				<Button
					key={button.command}
					icon={button.icon}
					title={button.title}
					onClick={() => props.onCommand(button.command)}
				/>
			);
		});
	}

	return (
		<div className="card-dialog-toolbar">
			{renderButtons()}
		</div>
	);
}
