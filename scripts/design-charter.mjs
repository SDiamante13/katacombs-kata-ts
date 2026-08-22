// Without a charter it becomes the slop it exists to prevent — context/design-charter.md.
export const charter = [
  {
    id: 1,
    group: 'Placement',
    ask: 'Does anything sit in the wrong layer or module?',
    kernel: 'move it to where it belongs',
  },
  {
    id: 2,
    group: 'Placement',
    ask: 'Is any module doing two unrelated jobs?',
    kernel: 'one reason to change',
  },
  {
    id: 3,
    group: 'Abstraction',
    ask: 'Is there semantic duplication a token matcher cannot see?',
    kernel: 'same idea, different words',
  },
  {
    id: 4,
    group: 'Abstraction',
    ask: 'Did one change ripple across more files than it should?',
    kernel: 'a missing abstraction leaves a wide diff',
  },
  {
    id: 5,
    group: 'Naming',
    ask: 'Does any name lie about what the thing does?',
    kernel: 'rename it, or make it true',
  },
  {
    id: 6,
    group: 'Naming',
    ask: 'Primitive obsession — is there a value object waiting to be born?',
    kernel: 'the type is the invariant',
  },
  {
    id: 7,
    group: 'Test design',
    ask: 'Do the tests read as a specification of behavior, or as a transcript of the implementation?',
    kernel: 'a test that follows the code cannot outlive it',
  },
  {
    id: 8,
    group: 'Test design',
    ask: 'Is there test pain — heavy setup, fakes that know internals — that is really a design problem?',
    kernel: 'test pain is design feedback',
  },
  {
    id: 9,
    group: 'Comments',
    ask: 'Does any comment explain what the code does instead of why it is that way?',
    kernel: 'a what comment is a name nobody wrote',
  },
  {
    id: 10,
    group: 'Documentation',
    ask: 'Does anything record a decision whose reason cannot be recovered from the code or the tests?',
    kernel: 'write down what the code cannot say',
  },
  {
    id: 11,
    group: 'Documentation',
    ask: 'Has any existing document stopped being true?',
    kernel: 'prose that lies survives every other sensor here',
  },
  {
    id: 12,
    group: 'Documentation',
    ask: 'Does any document restate what the code already shows?',
    kernel: 'if a test asserts it, the test is the documentation',
  },
];

export const groups = [...new Set(charter.map((question) => question.group))];

export function questionById(id) {
  return charter.find((question) => question.id === id) ?? null;
}
