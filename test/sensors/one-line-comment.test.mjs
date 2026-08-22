import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { oneLineComment } from '../../scripts/eslint-rules/one-line-comment.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const flagged = [{ messageId: 'longComment' }];

ruleTester.run('one-line-comment', oneLineComment, {
  valid: [
    { code: '// the vault door sticks because the table is 1-indexed\nconst a = 1;' },
    { code: 'const a = 1; // 1-indexed on purpose\nconst b = 2;' },
    { code: '/* one line is fine */\nconst a = 1;' },
    { code: '// why this is odd\nconst a = 1;\n// why that is odd\nconst b = 2;' },
    { code: '#!/usr/bin/env node\n// the one line it gets\nconst a = 1;' },
    {
      code: '/* eslint-disable no-console */\nconst a = 1;',
    },
    { code: '// see `context/sensor-triggers.md`\nconst a = 1;' },
  ],
  invalid: [
    { code: '// first line\n// second line\nconst a = 1;', errors: flagged },
    { code: '// one\n// two\n// three\nconst a = 1;', errors: flagged },
    { code: '/*\n * a block that spans lines\n */\nconst a = 1;', errors: flagged },
    {
      code: '// a\n// b\nconst a = 1;\n// c\n// d\nconst b = 2;',
      errors: [{ messageId: 'longComment' }, { messageId: 'longComment' }],
    },
  ],
});
