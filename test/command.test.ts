import { describe, expect, it } from 'vitest';

import { commands, parse } from '../src/domain/command.ts';

describe('reading what the player typed', () => {
  it('takes GO with a direction as a move', () => {
    expect(parse('GO N')).toEqual({ kind: 'go', direction: 'N' });
  });

  it('takes the same words in lower case', () => {
    expect(parse('go n')).toEqual({ kind: 'go', direction: 'N' });
  });

  it('takes the same words padded with spaces', () => {
    expect(parse('  go n  ')).toEqual({ kind: 'go', direction: 'N' });
  });

  it('takes ? as a request for the command list', () => {
    expect(parse('?')).toEqual({ kind: 'help' });
  });

  it('takes QUIT as a request to leave', () => {
    expect(parse('QUIT')).toEqual({ kind: 'quit' });
  });

  it('does not understand a direction the compass lacks', () => {
    expect(parse('GO SIDEWAYS')).toEqual({ kind: 'unknown' });
  });

  it('does not understand GO with nothing after it', () => {
    expect(parse('GO')).toEqual({ kind: 'unknown' });
  });

  it('does not understand a word that is not a command', () => {
    expect(parse('xyzzy')).toEqual({ kind: 'unknown' });
  });

  it('does not understand a blank line', () => {
    expect(parse('')).toEqual({ kind: 'unknown' });
  });
});

describe('the command list', () => {
  it('names every command the game accepts, and nothing else', () => {
    expect(commands()).toEqual([
      'GO <N|E|S|W|UP|DOWN> — walk through an exit',
      '? — list what the game understands',
      'QUIT — leave the katacombs',
    ]);
  });
});
