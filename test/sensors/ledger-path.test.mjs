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

  it('collapses every unsafe id to one name rather than inventing one', () => {
    expect(ledgerFile('../a', '.txt')).toBe(ledgerFile('/b', '.txt'));
  });

  it('never throws out of the hook when the ledger cannot be written', () => {
    expect(() => record('\0bad', ['src/x.ts'])).not.toThrow();
  });
});
