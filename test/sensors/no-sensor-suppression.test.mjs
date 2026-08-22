import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { noSensorSuppression } from '../../scripts/eslint-rules/no-sensor-suppression.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const flagged = [{ messageId: 'suppressed' }];

ruleTester.run('no-sensor-suppression', noSensorSuppression, {
  valid: [
    'const x = 1;',
    '// The mutation sensor is what tells you the assertion is missing.\nconst x = 1;',
    "const flag = '--ignore-gitleaks-allow';",
    '/* Stryker is the tool; this comment is about it, not aimed at it. */',
  ],
  invalid: [
    { code: '// Stryker disable next-line all\nconst x = 1;', errors: flagged },
    { code: '// Stryker disable all\nconst x = 1;', errors: flagged },
    {
      code: '/* stryker disable next-line ArithmeticOperator */\nconst x = 1;',
      errors: flagged,
    },
    { code: 'const key = "abc"; // gitleaks:allow', errors: flagged },
    { code: '// jscpd:ignore-start\nconst x = 1;', errors: flagged },
  ],
});
