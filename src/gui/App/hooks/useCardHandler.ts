import * as React from 'react';
import { produce } from "immer";
import { useCallback } from "react";
import { DeleteEventHandler as CardDeleteEventHandler, CardEvent, CardHandler } from "../../CardViewer";
import { Board, Card, CardInsertLocation, cardSettingItems, CardSettings, Note, WebviewApi } from "../../../utils/types";
import { PushUndo } from "./useHistory";
import { findCard, findCardIndex, findStackIndex } from "../../../utils/board";
import { AddCardEvent } from "../../../gui/StackViewer";
import { CardDialogData } from "../../../gui/CardDialog";
import { parseAsNoteLink, serializeNoteToCard, trimCardBody } from "../../../utils/noteParser";
import { DialogConfig } from "../utils/types";
import { createCard, duplicateCard } from '../../../utils/cards';

export interface CreateCardEvent extends AddCardEvent, CardDialogData {}

export type CreateCardEventHandler = (event:CreateCardEvent) => void;

export interface UpdateCardEvent extends CardEvent, CardDialogData {}

export type UpdateCardEventHandler = (event:UpdateCardEvent) => void;

interface Props {
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
	pushUndo: PushUndo;
	webviewApi: WebviewApi;
	setDialogConfig: (value: React.SetStateAction<DialogConfig>) => void;
	cardInsertLocation: CardInsertLocation;
}

export default (props:Props) => {
	const insertCardByLocation = (
		cards: Card[],
		card: Card,
		location: CardInsertLocation
	) => {
		if (location === CardInsertLocation.Top) {
			cards.unshift(card);
		} else {
			cards.push(card);
		}
	}

	const onUpdateCard = useCallback<UpdateCardEventHandler>((event) => {
		// The dialog disables the confirm button while the title is empty, but
		// be defensive in case the handler is called from elsewhere.
		if (!event.title.trim()) return;

		props.pushUndo(props.board);

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			const card = draft.stacks[stackIndex].cards[cardIndex];
			card.title = event.title.trim();
			card.body = trimCardBody(event.description);

			// The color comes from the swatch row of the card dialog: a
			// palette ID as a string, or '' for no color. An empty color
			// removes the setting, so that no card-settings block is left
			// behind in the note.
			if (event.color) {
				card.settings = { ...card.settings, backgroundColor: event.color };
			} else if (card.settings?.backgroundColor) {
				delete card.settings.backgroundColor;
			}
		});

		props.setBoard(newBoard);
	}, [props.board, props.setBoard, props.pushUndo]);

	const onAddCard = useCallback<CreateCardEventHandler>((event) => {
		// A card without a title cannot be created. The dialog disables the Add
		// button until the title is non-empty, but be defensive in case the
		// handler is called from elsewhere.
		if (!event.title.trim()) return;

		props.pushUndo(props.board);

		const newBoard = produce(props.board, draft => {
			const stackIndex = findStackIndex(draft, event.stackId);
			const card = createCard(event.title.trim(), trimCardBody(event.description));

			// The color comes from the swatch row of the card dialog: a
			// palette ID as a string, or '' for no color.
			if (event.color) card.settings = { backgroundColor: event.color };

			insertCardByLocation(
				draft.stacks[stackIndex].cards,
				card,
				props.cardInsertLocation
			);
		});

		props.setBoard(newBoard);
	}, [props.board, props.setBoard, props.pushUndo, props.cardInsertLocation]);

	const onDeleteCard = useCallback<CardDeleteEventHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);
		const parsedTitle = parseAsNoteLink(card.title);

		if (parsedTitle) {
			// Probably better not to delete the associated note? Let's see depending on feedback

			// const answer = confirm('This will also delete the associated note. Continue?');
			// if (!answer) return;

			// await props.webviewApi.postMessage({
			// 	type: 'deleteNote',
			// 	value: parsedTitle.id
			// });
		} else {
			props.pushUndo(props.board);
		}

		const newBoard = produce(props.board, draft => {
			const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
			draft.stacks[stackIndex].cards.splice(cardIndex, 1);
		});

		props.setBoard(newBoard);
	}, [props.board, props.pushUndo, props.setBoard, props.webviewApi]);

	const onDuplicateCard = useCallback<CardDeleteEventHandler>(async (event) => {
		const [stackIndex, cardIndex] = findCardIndex(props.board, event.cardId);
		const card = props.board.stacks[stackIndex].cards[cardIndex];
		const parsedTitle = parseAsNoteLink(card.title);

		if (parsedTitle) {
			const newNote = await props.webviewApi.postMessage<Note>({
				type: 'duplicateNote',
				value: parsedTitle.id,
			});

			const newBoard = produce(props.board, draft => {
				const newCard = createCard();
				insertCardByLocation(
					draft.stacks[stackIndex].cards,
					{
						...newCard,
						...serializeNoteToCard(newNote),
					},
					props.cardInsertLocation
				);
			});

			props.setBoard(newBoard);
		} else {
			props.pushUndo(props.board);

			const newBoard = produce(props.board, draft => {
				insertCardByLocation(draft.stacks[stackIndex].cards,
					duplicateCard(card),
					props.cardInsertLocation);
			});

			props.setBoard(newBoard);
		}
	}, [props.board, props.pushUndo, props.setBoard, props.webviewApi]);

	const onEditCardSettings = useCallback<CardHandler>(async (event) => {
		const card = findCard(props.board, event.cardId);
		props.setDialogConfig({
			title: 'Card properties',
			settingItems: cardSettingItems,
			settings: { ...card.settings },
			onSave: (newSettings: CardSettings) => {
				const newBoard = produce(props.board, draft => {
					const [stackIndex, cardIndex] = findCardIndex(draft, event.cardId);
					draft.stacks[stackIndex].cards[cardIndex].settings = newSettings;
				});
				props.setBoard(newBoard);
			},
		});
	}, [props.board, props.setBoard, props.setDialogConfig]);

	return {
		onUpdateCard,
		onEditCardSettings,
		onDeleteCard,
		onAddCard,
		onDuplicateCard,
	};
}