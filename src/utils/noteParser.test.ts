import { parseNote, serializeBoard, trimCardBody } from "./noteParser";
import { Board, Card } from "./types";

const noteBody1 = `# Draft

## Post 1

Content 1

## Post 2

Content 2

# To review

## Post 3

Content 3

\`\`\`card-settings
backgroundColor: #ff0000
\`\`\`

# To publish

\`\`\`stack-settings
backgroundColor: #00ff00
\`\`\`

## Post 4

Content 4


Some empty lines above

# Completed

\`\`\`kanban-settings
# Do not remove this block
filters: {"tagIds":["1"]}
stackWidth: 100
\`\`\`
`

const getDefaultCard = ():Card => {
	return {
		id: '',
		is_todo: 0,
		title: '',
		todo_completed: 0,
		todo_due: 0,
	}
}

describe('noteParser', () => {

	test.each<[string, Board]>([
		[
			noteBody1,
			{
				noteId: '',
				stacks: [
					{
						id: '',
						title: 'Draft',
						cards: [
							{
								...getDefaultCard(),
								id: '',
								title: 'Post 1',
								body: 'Content 1',
							},
							{
								...getDefaultCard(),
								id: '',
								title: 'Post 2',
								body: 'Content 2',
							},
						]
					},

					{
						id: '',
						title: 'To review',
						cards: [
							{
								...getDefaultCard(),
								id: '',
								title: 'Post 3',
								settings: {
									backgroundColor: '#ff0000',
								},
								body: 'Content 3',
							},
						]
					},

					{
						id: '',
						title: 'To publish',
						settings: {
							backgroundColor: '#00ff00',
						},
						cards: [
							{
								...getDefaultCard(),
								id: '',
								title: 'Post 4',
								body: 'Content 4\n\n\nSome empty lines above',
							},
						]
					},


					{
						id: '',
						title: 'Completed',
						cards: []
					},
				],
				settings: {
					stackWidth: 100,
					filters: { tagIds: ["1"] },
				}
			},
		],
	])('should parse a note', async (noteBody, board) => {
		const actual = await parseNote('', noteBody)
		
		actual.stacks = actual.stacks.map(s => {
			s.id = ''
			s.cards = s.cards.map(c => {
				c.id = '';
				return c;
			});
			return s;
		});

		expect(actual).toEqual(board);

		{
			const actual = serializeBoard(board);
			expect(actual).toBe(noteBody);
		}
	});

	it('should preserve the trailing space of empty checkbox items', async () => {
		// The trailing space is required for "- [ ]" to be recognized as a
		// checkbox by the Markdown parsers, so it must survive parsing the note
		// and serializing the board again. Two trailing spaces (a hard line
		// break) must also survive.
		const noteBody = `# Stack

## Card

- [ ] task
- [ ] 
line one  
line two

\`\`\`kanban-settings
# Do not remove this block
\`\`\`
`;

		const board = await parseNote('', noteBody);

		expect(board.stacks[0].cards[0].body).toBe('- [ ] task\n- [ ] \nline one  \nline two');

		expect(serializeBoard(board)).toBe(noteBody);
	});

	it('trimCardBody should trim but restore the trailing space of checkbox markers', () => {
		expect(trimCardBody('- [ ] task\n- [ ] ')).toBe('- [ ] task\n- [ ] ');
		expect(trimCardBody('  - [ ]  ')).toBe('- [ ] ');
		expect(trimCardBody('- [x] ')).toBe('- [x] ');
		expect(trimCardBody('text\n\n\n')).toBe('text');
		expect(trimCardBody('text  ')).toBe('text');
		expect(trimCardBody('')).toBe('');
	});

});