import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { noStaleReference } from '../../scripts/eslint-rules/no-stale-reference.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('no-stale-reference', noStaleReference, {
  valid: [
    { code: '// `readHookPayload` parses it\nfunction readHookPayload() {}' },
    { code: '// `toRoman()` is greedy on purpose\nfunction toRoman() {}' },
    { code: '// the vault door is `never` open\nconst a = 1;' },
    { code: '// run `npm run check` first\nconst a = 1;' },
    { code: '// see `context/sensor-triggers.md`\nconst a = 1;' },
    { code: '// see `README.md`\nconst a = 1;' },
    { code: '// a plain sentence about rooms\nconst a = 1;' },
    { code: '// `1-indexed` on purpose\nconst a = 1;' },
  ],
  invalid: [
    {
      code: '// `readHookPayload` parses it\nconst a = 1;',
      errors: [{ messageId: 'staleName' }],
    },
    {
      code: '// `toRoman()` is greedy\nconst a = 1;',
      errors: [{ messageId: 'staleName' }],
    },
    {
      code: '// see `context/does-not-exist.md`\nconst a = 1;',
      errors: [{ messageId: 'staleFile' }],
    },
    {
      code: '// `snake_case_thing` handles it\nconst a = 1;',
      errors: [{ messageId: 'staleName' }],
    },
  ],
});
