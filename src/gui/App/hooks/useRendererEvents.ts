import { useEffect, useState } from "react";
import { Board, IpcMessage, WebviewApi } from "../../../utils/types";
import { produce } from "immer";
import { findCardOrNull } from "../../../utils/board";
import { toggleCheckbox } from "../../../utils/renderMarkupUtils";
import { parseAsNoteLink } from "../../../utils/noteParser";

// We support anything that looks like a URL - we just want to send it back to the app via the
// `openItem` command.
const isSupportedUrl = (text:string) => {
	return !!text.match(/^[a-zA-Z\-]+:.+/);
}

interface NoteCheckboxToUpdate {
	cardMessage: string;
	noteId: string;
}

interface Props {
	webviewApi: WebviewApi;
	board: Board;
	setBoard: (value: React.SetStateAction<Board>) => void;
}

export default (props:Props) => {
	const [noteCheckboxToUpdate, setNoteCheckboxToUpdate] = useState<NoteCheckboxToUpdate|null>(null);

	useEffect(() => {
		const handleCheckboxClick = (cardId:string, cardMessage:string) => {
			// A checkbox belongs either to the body of a plain card - which is
			// part of the board note - or to the note a card is linked to:
			// such a card shows the note's content, so its checkbox is toggled
			// in the note itself.
			//
			// The card is looked up before the board is updated: the rendered
			// body that received the click can be stale while the board is
			// being updated, and the card may already be gone.
			const card = findCardOrNull(props.board, cardId);
			if (!card) {
				console.warn('Checkbox click on a card that does not exist:', cardId);
				return;
			}

			const linkedNote = parseAsNoteLink(card.title);
			if (linkedNote) {
				setNoteCheckboxToUpdate({ cardMessage, noteId: linkedNote.id });
				return;
			}

			// The body is read from the up-to-date board inside the updater,
			// so that two clicks in quick succession toggle the checkbox
			// twice. findCardOrNull is used again for the rare case where the
			// card is gone by the time the update is applied.
			props.setBoard(current => produce(current, draft => {
				const card = findCardOrNull(draft, cardId);
				if (!card) return;
				card.body = toggleCheckbox(cardMessage, card.body);
			}));
		}

		const handleUrl = async (message:string) => {
			if (isSupportedUrl(message)) {
				await props.webviewApi.postMessage<string>({ type: 'openItem', value: message });
			}
		}

		const onMessage = async (event: MessageEvent<any>) => {
			const message = event.data;

			// These messages are internal messages sent within the (mobile?) app webview and can be
			// ignored
			if ((message as any).kind === 'ReturnValueResponse') return;
			if ((message as any).postMessage?.kind === 'ReturnValueResponse') return;

			if (typeof message === 'string') {
				await handleUrl(message);
			} else {
				const asIpcMessage = message as IpcMessage;
				if (asIpcMessage && asIpcMessage.type === "cardMessage") {
					const cardId = asIpcMessage.value.cardId;
					const cardMessage = asIpcMessage.value.message as string;

					if (cardMessage.startsWith('checkboxclick:')) {
						handleCheckboxClick(cardId, cardMessage);
					} else {
						await handleUrl(cardMessage);
					}
				}
			}
		}

		window.addEventListener("message", onMessage);

		return () => {
			window.removeEventListener('message', onMessage);
		}
	}, [props.webviewApi, props.board, props.setBoard]);

	useEffect(() => {
		if (!noteCheckboxToUpdate) return;

		const fn = async () => {
			try {
				await props.webviewApi.postMessage({
					type: 'setNoteCheckbox',
					value: noteCheckboxToUpdate,
				});
			} catch (error) {
				// For example when the note has been deleted since the card
				// body was rendered.
				console.warn('Could not toggle checkbox in note ' + noteCheckboxToUpdate.noteId + ':', error);
			}

			setNoteCheckboxToUpdate(null);
		}

		void fn();
	}, [noteCheckboxToUpdate, props.webviewApi]);

	useEffect(() => {
		// "cardPostMessage" is defined when calling the `renderMarkup` command. The checkbox
		// rendered by this command will post a message in the form `checkboxclick:<line_index>`. We
		// capture this message and send it back - it will then be processed at the app level.
		//
		// We wrap it in a second function so that we can capture the card ID, which is needed to
		// know which part of the note needs to be updated.

		const script = document.createElement('script');
		script.textContent =  `
			const cardPostMessage = (cardId) => {
				return (message) => {
					postMessage({
						type: "cardMessage",
						value: {
							cardId,
							message,
						},
					});
				};
			}
		`;

		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		}
	}, []);
}
