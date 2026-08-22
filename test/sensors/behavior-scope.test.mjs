import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { requestedScope } from '../../scripts/behavior-sensor.mjs';
import { scopeOf } from '../../scripts/behavior-scope.mjs';
import { dirtyPaths } from '../../scripts/git-changes.mjs';
import { record } from '../../scripts/session-ledger.mjs';
import { plant, session, source, spec, uproot, WEAK } from './behavior-fixture.mjs';

describe('what the behavioral tier looks at', () => {
  afterEach(uproot);

  it('mutates source under src, and never a test', () => {
    plant(WEAK);

    expect(scopeOf([source, spec, 'scripts/behavior-sensor.mjs']).mutated).toEqual([
      source,
    ]);
  });

  it('runs tests for both the source and the tests that changed', () => {
    plant(WEAK);

    expect(scopeOf([source, spec]).tests).toEqual([source, spec]);
  });

  it('sees the same file however the caller spells the path', () => {
    plant(WEAK);

    const spelled = [`./${source}`, path.resolve(source), source];

    expect(scopeOf(spelled).mutated).toEqual([source]);
  });

  it('refuses a path that points outside the project', () => {
    expect(scopeOf(['../elsewhere/thing.ts', '/etc/passwd.ts']).tests).toEqual([]);
  });

  it('keeps a file git says the change deleted, so its tests still run', () => {
    const removed = ['src/deleted-by-this-change.ts'];

    expect(scopeOf(removed, removed).gone).toEqual(removed);
  });

  it('refuses to call a path deleted when git never knew it', () => {
    const scope = scopeOf(['src/never-existed.ts'], []);

    expect(scope.gone).toEqual([]);
    expect(scope.unknown).toEqual(['src/never-existed.ts']);
  });

  it('will not read a path with a mutation range stuck on the end', () => {
    expect(scopeOf(['src/cave.ts:1:1-1:2'], []).malformed).toEqual([
      'src/cave.ts:1:1-1:2',
    ]);
  });

  it.each(['package.json', 'src/cave.tsx', 'tsconfig.json', 'src/a.mjson'])(
    'does not mistake %s for a mangled source path',
    (file) => {
      expect(scopeOf([file], []).malformed).toEqual([]);
    },
  );
});

describe('the scope it works out for itself', () => {
  afterEach(uproot);

  it('sees a file the change created, which no diff against HEAD lists', () => {
    plant(WEAK);

    expect(requestedScope([], undefined)).toContain(source);
  });

  it('prefers what the caller named over anything it could work out', () => {
    expect(requestedScope(['src/named.ts'], undefined)).toEqual(['src/named.ts']);
  });

  it('drops ledger entries the change no longer contains', () => {
    plant(WEAK);
    record(session, ['src/touched-then-reverted.ts', source]);

    expect(requestedScope([], session)).toEqual([source]);
  });

  it('falls back to the worktree when the ledger has nothing at all', () => {
    expect(requestedScope([], 'a-session-that-never-recorded')).toEqual(dirtyPaths());
  });
});
