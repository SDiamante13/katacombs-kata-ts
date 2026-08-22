import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ledgerPath } from '../../scripts/session-ledger.mjs';

export const session = 'behavior-scope-probe';

export const source = 'src/behavior-probe.ts';
export const spec = 'test/behavior-probe.test.ts';

export const CAVE = `export function describeCave(lit: boolean, visited: number): string {
  if (!lit) return 'It is pitch dark.';
  if (visited > 3) return 'The cave, familiar now.';

  return 'A damp cave.';
}
`;

export const WEAK = `import { describe, expect, it } from 'vitest';

import { describeCave } from '../src/behavior-probe.js';

describe('describeCave', () => {
  it('answers something', () => {
    expect(describeCave(false, 0)).toBe('It is pitch dark.');
  });
});
`;

export const STRONG = WEAK.replace(
  '  });\n});',
  `  });

  it('is damp on the first lit visits', () => {
    expect(describeCave(true, 3)).toBe('A damp cave.');
  });

  it('is familiar after the third lit visit', () => {
    expect(describeCave(true, 4)).toBe('The cave, familiar now.');
  });
});`,
);

export function plant(spec_) {
  mkdirSync(path.dirname(path.resolve(source)), { recursive: true });
  writeFileSync(path.resolve(source), CAVE);
  writeFileSync(path.resolve(spec), spec_);
}

export function uproot() {
  rmSync(ledgerPath(session), { force: true });
  rmSync(path.resolve(source), { force: true });
  rmSync(path.resolve(spec), { force: true });
}
