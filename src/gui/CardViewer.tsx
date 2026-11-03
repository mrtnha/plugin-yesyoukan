import * as React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useCallback, useMemo } from "react";
import { AppSettings, Card, Platform } from "../utils/types";
import KebabButton, { ItemClickEventHandler, MenuItem } from "./KebabButton";
import { parseAsNoteLink } from "../utils/noteParser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateTime } from "../utils/time";

export interface CardEvent {
	cardId: string;
}

export type CardHandler = (event:CardEvent) => void;

export interface DeleteEvent {
	cardId: string;
}

export type DeleteEventHandler = (event:DeleteEvent) => void;

interface Props {
	value: Card;
	appSettings: AppSettings;
	index: number;
	isLast: boolean;
	onDelete: DeleteEventHandler;
	onScrollToCard: CardHandler;
	onCreateNoteFromCard: CardHandler;
	onCreateTodoFromCard: CardHandler;
	onOpenAssociatedNote: CardHandler;
	onEditSettings: CardHandler;
	onDuplicate: CardHandler;
	onSingleClick: CardHandler;
	showCardBody: boolean;
	platform: Platform;
}

export default (props:Props) => {
	const card = props.value;

	const parsedTitle = useMemo(() => {
		return parseAsNoteLink(card.title);
	}, [card.title]);

	const isNoteLink = !!parsedTitle && card.noteExists;
	const isInTrash = !!card.deleted_time;
	const isPermanentlyDeleted = !!parsedTitle && !card.noteExists;
	const hasDueDate = card.is_todo && card.todo_due;
	const isOverdue = hasDueDate && !card.todo_completed && card.todo_due <= Date.now();

	const openLinkedNote = useCallback(() => {
		if (isInTrash) {
			alert('This card has been deleted - move it outside of the trash to open it from here');
		} else {
			props.onOpenAssociatedNote({ cardId: card.id });
		}
	}, [isInTrash, props.onOpenAssociatedNote, card.id]);

	const openCard = useCallback(() => {
		if (isNoteLink) {
			// Cards linked to a note are edited in the note itself.
			openLinkedNote();
		} else {
			props.onSingleClick({ cardId: card.id });
		}
	}, [isNoteLink, openLinkedNote, props.onSingleClick, card.id]);

	const onCardClick = useCallback<React.MouseEventHandler>((event) => {
		// The drag and drop library blocks the click that follows a drag.
		if (event.defaultPrevented) return;

		// The kebab menu is rendered in a portal: its DOM lives outside the
		// card, but it is part of the card's React tree, so clicks on its
		// items propagate to this handler through the React tree. Only handle
		// clicks that physically happen inside the card element.
		const cardElement = event.currentTarget as HTMLElement;
		const target = event.target as HTMLElement;
		if (!cardElement.contains(target)) return;

		// Ignore clicks on interactive elements (links, checkboxes, the kebab
		// menu button, etc.) - they handle their own clicks.
		if (target.closest('a, button, input, textarea, select')) return;

		// Ignore clicks that end a text selection - the user is selecting text
		// to copy it, not opening the card.
		if (window.getSelection()?.toString()) return;

		openCard();
	}, [openCard]);

	const onKebabItemClick = useCallback<ItemClickEventHandler>((event) => {
		if (event.itemId === 'edit') {
			openCard();
		} else if (event.itemId === 'delete') {
			props.onDelete({ cardId: card.id });
		} else if (event.itemId === 'duplicate') {
			props.onDuplicate({ cardId: card.id });
		} else if (event.itemId === 'scrollToCard') {
			props.onScrollToCard({ cardId: card.id });
		} else if (event.itemId === 'createNoteFromCard') {
			props.onCreateNoteFromCard({ cardId: card.id });
		} else if (event.itemId === 'createTodoFromCard') {
			props.onCreateTodoFromCard({ cardId: card.id });
		} else if (event.itemId === 'editSettings') {
			props.onEditSettings({ cardId: card.id });
		} else {
			throw new Error('Unknown item ID: ' + event.itemId);
		}
	}, [openCard, props.onDelete, props.onDuplicate, props.onScrollToCard, props.onCreateNoteFromCard, props.onCreateTodoFromCard, props.onEditSettings, card.id]);

	const renderKebabButton = () => {
		const menuItems:MenuItem[] = [];

		if (props.platform === "desktop" && !isNoteLink) {
			menuItems.push({
				id: 'scrollToCard',
				label: 'Open in note...',
			});
		}

		if (!isNoteLink) {
			menuItems.push({
				id: 'createNoteFromCard',
				label: 'Create note from card...',
			});

			menuItems.push({
				id: 'createTodoFromCard',
				label: 'Create to-do from card...',
			});
		}

		if (menuItems.length) {
			menuItems.push({
				isDivider: true,
			});
		}
			
		menuItems.push({
			id: 'edit',
			label: 'Edit',
		});

		menuItems.push({
			id: 'duplicate',
			label: 'Duplicate',
		});

		menuItems.push({
			id: 'delete',
			label: 'Delete',
		});

		menuItems.push({
			isDivider: true,
		});

		menuItems.push({
			id: 'editSettings',
			label: 'Properties...',
		});

		return (
			<div className="kebab-button-wrapper">
				<KebabButton
					menuItems={menuItems}
					onItemClick={onKebabItemClick}
				/>
			</div>
		);
	}

	const renderTags = () => {
		if (!card.tags || !card.tags.length) return null;

		const tagComponents = [];

		for (const tag of card.tags) {
			tagComponents.push(<div key={tag.id} className="tag">{tag.title}</div>);
		}

		return (
			<div className="tags">
				{tagComponents}
			</div>
		);
	}

	const renderDueDate = () => {
		if (!hasDueDate) return null;

		const dateClasses = ['date'];
		if (card.todo_completed) dateClasses.push('-done');
		if (isOverdue) dateClasses.push('-overdue');

		const icon = isOverdue ? "triangle-exclamation" : "clock";
		
		return (
			<div className="duedate">
				<FontAwesomeIcon className="icon" icon={icon} /><span className={dateClasses.join(' ')}>{formatDateTime(card.todo_due, props.appSettings.dateFormat + ' ' + props.appSettings.timeFormat)}</span>
			</div>
		);
	}

	const renderContent = () => {
		return (
			<div className="content">
				<div className={headerClasses.join(' ')}>
					<h3 className="title" dangerouslySetInnerHTML={{ __html: card.titleHtml} }></h3>{renderKebabButton()}
				</div>
				{renderTags()}
				{renderDueDate()}
				<p className="body" dangerouslySetInnerHTML={{ __html: props.showCardBody ? card.bodyHtml : '' }}></p>
			</div>
		);
	}

	// The color is applied to the header only - the title area - when the
	// card shows a body: tags, due date and body then stay on the card
	// background, so a colored card still reads as a card and not as a
	// colored block. A card that shows no body at all is colored as a
	// whole: it is just a title, so it reads as a colored label, and the
	// empty space below the title (the body paragraph is always rendered,
	// even when empty) is colored too instead of sticking out below the
	// strip. The strip spans the whole card - see the -colored rule of
	// .header in main.css.
	const showsBody = props.showCardBody && !!card.body && !!card.body.trim();

	const headerClasses = useMemo(() => {
		const classes = ['header'];

		if (card.settings?.backgroundColor && showsBody) {
			classes.push('-colored', 'background-' + card.settings.backgroundColor);
		}

		return classes;
	}, [card.settings?.backgroundColor, showsBody]);

	const cardClasses = useMemo(() => {
		const classes = ['card'];

		if (card.settings?.backgroundColor && !showsBody) {
			classes.push('background-' + card.settings.backgroundColor);
		}

		if (props.isLast) classes.push('-last');
		if (isInTrash || isPermanentlyDeleted) classes.push('-deleted');
		if (isOverdue) classes.push('-overdue');

		return classes;
	}, [card.settings?.backgroundColor, showsBody, props.isLast, isInTrash, isPermanentlyDeleted, isOverdue]);
	
	return (
		<Draggable draggableId={card.id} index={props.index}>
			{(provided) => {
				const classes = cardClasses;
				return (
					<div className={classes.join(' ')} {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} onClick={onCardClick}>
						{renderContent()}
					</div>
				);
			}}
		</Draggable>
	);
}
