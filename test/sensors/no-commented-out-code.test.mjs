import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { noCommentedOutCode } from '../../scripts/eslint-rules/no-commented-out-code.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const flagged = [{ messageId: 'commentedOutCode' }];

ruleTester.run('no-commented-out-code', noCommentedOutCode, {
  valid: [
    { code: 'const a = 1; // the vault door sticks because the table is 1-indexed' },
    { code: '// set the counter to zero\nconst a = 1;' },
    { code: '/** Returns the room name. */\nconst a = 1;' },
    { code: '// see https://example.com/rooms for the table\nconst a = 1;' },
    { code: '// eslint-disable-next-line no-console\nconst a = 1;' },
    { code: '// @ts-expect-error vendor types are wrong\nconst a = 1;' },
    { code: '// prettier-ignore\nconst a = 1;' },
    { code: '// x\nconst a = 1;' },
    { code: '// name\nconst a = 1;' },
    { code: '// handles the locked door case\nconst a = 1;' },
  ],
  invalid: [
    { code: '// const legacy = buildRoom(name);\nconst a = 1;', errors: flagged },
    {
      code: '// if (label === "north") return "You head north.";\nconst a = 1;',
      errors: flagged,
    },
    { code: '// doThing();\nconst a = 1;', errors: flagged },
    { code: '// return room.name;\nconst a = 1;', errors: flagged },
    { code: '// counter++;\nconst a = 1;', errors: flagged },
    { code: '// items.map((i) => i.name)\nconst a = 1;', errors: flagged },
    { code: '/* function go() { return 1; } */\nconst a = 1;', errors: flagged },
  ],
});
