# v1.3.0

- Mobile: the card dialog is now a full-screen sheet that ends at the top of the on-screen keyboard, with Cancel and Add/Save in a bar at the top - always visible, never behind the keyboard or off the edge of the screen
- Mobile: the keyboard's Enter key in the card title now moves to the description ("next") instead of adding the card; the description fills the space left, and the formatting toolbar is one row of larger buttons that scrolls sideways and no longer closes the keyboard when tapped
- Mobile: editing a card no longer opens the keyboard straight away, so the card can be read first
- Fixed the board making the whole page wider than the screen on mobile, which pushed dialogs off to the right and below the visible area. Only the stacks scroll sideways now

# v1.2.1

- Fixed cards with a color being taller than the same cards without a color: every colored area is now the same fixed-height header with the title centered in it, and a card keeps its height when a color is assigned or cleared, whether it has a description or not
- Cards without a description no longer carry invisible empty space below the title - such a card is now exactly the colored header strip of a card with a description

# v1.2.0

- Cards are now edited in a dialog, opened by a single click on the card. The "+" button of a stack opens the same dialog to add a card. The dialog has separate title and description fields and asks for confirmation before discarding unsaved changes
- The description editor is a full Markdown editor with Joplin's own editor theme and inline rendering (checkboxes, lists, tables, ...), a formatting toolbar with the same actions as Joplin's own editor, and Joplin-like keyboard behaviour: Enter continues lists, Tab/Shift+Tab indent and unindent, Ctrl/Cmd+Enter saves the card
- A row of colour swatches in the card dialog sets the card's background colour. The palette is new - vivid, readable on both themes, and ordered so that it can double as a priority scale: green (done), yellow, orange, red (urgent), then pink, purple, cyan, blue, brown and grey
- On the board, the colour of a card is applied to its title area; a card without a body is coloured as a whole
- Fixed empty checkbox items ("- [ ] ") losing the trailing space that makes them checkboxes, so they no longer turn into plain text when saved, rendered or toggled
- The in-place card editor and its confirm/newline/double-click settings were removed in favour of the click-to-open dialog
- Improved spacing between the stack header elements
- Note for users switching from the official plugin: the colour palette was reordered and redefined, and colours are stored in the note by their palette index - existing boards may show shifted colours, re-assign them once after switching

# v1.1.3

- Added option to display a card counter on each stack (enabled by default)
- Add support for Cmd or Ctrl + double-click on a card
- Resolves #41: Multi-window support in the desktop app
- Fixes #79: Tags only show on first instance of Card

# v1.1.2

- Fix auto-archiving
- Resolves #68: Newly created cards are empty instead of having the placeholder title "New card"
- Auto-archive: Remove old card hashes to avoid huge setting values being saved
- Do not process archive notes with auto-archiving

# v1.0.19

- Fixes #64: Archive is not created in a correct notebook
- Remove support for (broken) bi-directional note udpates
- Resolves #65: Allow showing or hiding the card body

# v1.0.18

- Fixed auto-archiving

# v1.0.17

- Fixes #60: Scrollbar is broken on card content
- Fixes #55: Using Duplicate on a Card from Note causes Uncaught Exception

# v1.0.16

- Resolves #45: Allow right-clicking on a link inside a card to copy it
- Resolves #47: Ask for confirmation when closing the editor would cause changes to be lost
- Resolves #52: Improved various components in dark theme
- Resolves #49: Make header of stacks sticky
- Resolves #48: Handle case where an external note is deleted
- Resolves #37: Change border of card when the date is due
- Resolves #43: If note is a to-do and is placed in the last stack, mark it as completed

# v1.0.15

- Fixes #31: Clicking Checkbox card with associated note crashes Kanban editor
- Fixes #32: Fixed card title top margin
- Resolves #33: Add support for filering by tag
- Resolves #44: Allow duplicating cards
- Made board comparison more reliable to avoid unnecessary save operations
- Display the number of cards that have been filtered out
- Resolves #39: Auto archive completed items

# v1.0.13

- Fixes #26: Opening a card in note while body is being edited loses the changes
- Improve rendering performance for large boards with many cards
- Resolves #23: Add due date to cards

# v1.0.12

- Resolves #14: Add support for mobile
- Resolves #17: Allow using notes as cards
- Render Markdown card titles as HTML
- Resolves #6: Add support for card colors and added option dialog for cards
- Resolves #24: Add option to set color to stack
- Resolves #22: Display tags associated with the cards
- Resolves #25: Add support for stack dynamic width
- Resolves #27: Allow drag and dropping a note on the board
- Add setting "Card double-click action"

# v1.0.11

- Fixes #13: Rendered links in cards are broken

# v1.0.10

- Add support for "Open in note" menu item, to edit the card content inside the Markdown or RTE editor
- Fixes #10: Clicking Checkbox affects multiple cards
- Fixed issue that could cause cards to be associated with the wrong stack
- Fixed issue with checkbox messaging

# v1.0.8

- Added more option to set validation of text and newlines
- Support links inside cards

# v1.0.7

- Allow running the Kanban board as an alternative editor
- Fixed logic of hidding/showing the panel while browsing notes
- Fixed styling
- Allow pressing the tab key on the mini-note editor
- Support checkboxes in kanban board

# v1.0.6

- Render card content as Markdown
- Make note and board two-way sync more robust and safer
- Do not update note if board has not changed

# v1.0.4

- Fixed horizontal scrolling
- Fixes #1: Display list bullets and numbers in cards
- Added settings for stack width and confirm key behaviour

# v1.0.3

- First release
