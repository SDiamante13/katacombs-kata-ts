import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ledgerFile, ledgerRoot } from '../../scripts/ledger-path.mjs';
import { record } from '../../scripts/session-ledger.mjs';

const traversals = [
  '../../../tmp/escaped',
  'nested/session',
  '..',
  '/absolute/session',
  'has space',
  '',
];

describe('a session id is untrusted input that names a file', () => {
  it.each(traversals)('keeps %j inside the ledger directory', (session) => {
    expect(path.dirname(ledgerFile(session, '.txt'))).toBe(ledgerRoot);
  });

  it('lets an ordinary session id through unchanged', () => {
    expect(ledgerFile('abc-123_XYZ', '.txt')).toBe(
      path.join(ledgerRoot, 'abc-123_XYZ.txt'),
    );
  });

  it('keeps two unsafe ids apart instead of collapsing them together', () => {
    expect(ledgerFile('../a', '.txt')).not.toBe(ledgerFile('/b', '.txt'));
  });

  it('never throws out of the hook when the ledger cannot be written', () => {
    expect(() => record('\0bad', ['src/x.ts'])).not.toThrow();
  });
});

describe('two sessions with unusable ids must not share one ledger', () => {
  it('gives different rejected ids different files', () => {
    expect(ledgerFile('team/alpha', '.txt')).not.toBe(ledgerFile('team/beta', '.txt'));
  });

  it('gives the same rejected id the same file every time', () => {
    expect(ledgerFile('team/alpha', '.txt')).toBe(ledgerFile('team/alpha', '.txt'));
  });

  it('keeps only a genuinely absent id in the shared bucket', () => {
    expect(path.basename(ledgerFile('', '.txt'))).toBe('unidentified.txt');
    expect(path.basename(ledgerFile(undefined, '.txt'))).toBe('unidentified.txt');
  });
});
