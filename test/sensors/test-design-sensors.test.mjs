import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { namedArrange } from '../../scripts/eslint-rules/named-arrange.mjs';
import { noAssertionFreeTest } from '../../scripts/eslint-rules/no-assertion-free-test.mjs';
import { noBranchingTest } from '../../scripts/eslint-rules/no-branching-test.mjs';
import { noInteractionAssertion } from '../../scripts/eslint-rules/no-interaction-assertion.mjs';
import { noLoopingTest } from '../../scripts/eslint-rules/no-looping-test.mjs';
import { noMysteryGuest } from '../../scripts/eslint-rules/no-mystery-guest.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const setup = Array.from({ length: 9 }, (_, index) => `const v${index} = ${index};`).join(
  '\n',
);

ruleTester.run('no-assertion-free-test', noAssertionFreeTest, {
  valid: [
    "it('answers', () => { expect(f()).toBe(1); });",
    "it('answers', async () => { await waitFor(() => expect(f()).toBe(1)); });",
    "it('answers', async () => { await thenUserSees('a lamp'); });",
    "it('answers', () => { shouldReadAs('a lamp'); });",
    'beforeEach(() => { reset(); });',
    "it.each([1])('answers %i', (n) => { expect(f(n)).toBe(n); });",
  ],
  invalid: [
    { code: "it('answers', () => { f(); });", errors: [{ messageId: 'noAssertion' }] },
    {
      code: "test('answers', () => { render(app); });",
      errors: [{ messageId: 'noAssertion' }],
    },
    {
      code: "it('answers', () => { const x = f(); });",
      errors: [{ messageId: 'noAssertion' }],
    },
  ],
});

ruleTester.run('no-mystery-guest', noMysteryGuest, {
  valid: [
    "const lamp = aLamp(); it('lights', () => { expect(lamp.lit).toBe(true); });",
    "it('lights', () => { let lamp = aLamp(); lamp = lamp.light(); expect(lamp.lit).toBe(true); });",
    "let lamp; it('lights', () => { lamp = aLamp(); expect(lamp).toBeTruthy(); });",
    'beforeEach(() => { localStorage.clear(); });',
  ],
  invalid: [
    {
      code: "let lamp; beforeEach(() => { lamp = aLamp(); }); it('lights', () => { expect(lamp.lit).toBe(true); });",
      errors: [{ messageId: 'guest' }],
    },
    {
      code: 'let a, b; beforeAll(() => { a = 1; });',
      errors: [{ messageId: 'guest' }],
    },
  ],
});

ruleTester.run('no-branching-test', noBranchingTest, {
  valid: [
    "it('lights', () => { expect(f()).toBe(1); });",
    "const label = ready ? 'on' : 'off';",
    'beforeEach(() => { if (dirty) reset(); });',
  ],
  invalid: [
    {
      code: "it('lights', () => { if (dark) { expect(f()).toBe(1); } });",
      errors: [{ messageId: 'branching' }],
    },
    {
      code: "it('lights', () => { expect(dark ? f() : g()).toBe(1); });",
      errors: [{ messageId: 'branching' }],
    },
  ],
});

ruleTester.run('no-looping-test', noLoopingTest, {
  valid: [
    "it.each([1, 2])('doubles %i', (n) => { expect(f(n)).toBe(n * 2); });",
    'for (const n of [1, 2]) { it(`doubles ${n}`, () => { expect(f(n)).toBe(n * 2); }); }',
  ],
  invalid: [
    {
      code: "it('doubles', () => { for (const n of [1, 2]) { expect(f(n)).toBe(n * 2); } });",
      errors: [{ messageId: 'looping' }],
    },
    {
      code: "it('doubles', () => { while (more()) { expect(f()).toBe(1); } });",
      errors: [{ messageId: 'looping' }],
    },
  ],
});

ruleTester.run('named-arrange', namedArrange, {
  valid: [
    "it('lights', () => { const lamp = aLamp(); expect(lamp.lit).toBe(true); });",
    `it('lights', () => { givenACave(); ${setup} expect(1).toBe(1); });`.replace(
      setup,
      '',
    ),
    `it('lights', () => { thenTheCaveIsLit(); ${setup} });`,
  ],
  invalid: [
    {
      code: `it('lights', () => { ${setup} expect(1).toBe(1); });`,
      errors: [{ messageId: 'unnamed' }],
    },
  ],
});

ruleTester.run('no-interaction-assertion', noInteractionAssertion, {
  valid: [
    'expect(store.saved()).toEqual([lamp]);',
    "expect(result).toBe('lit');",
    'expect(calls).toHaveLength(1);',
  ],
  invalid: [
    { code: 'expect(save).toHaveBeenCalled();', errors: [{ messageId: 'interaction' }] },
    {
      code: 'expect(save).toHaveBeenCalledWith(lamp);',
      errors: [{ messageId: 'interaction' }],
    },
    {
      code: 'expect(save).toHaveBeenCalledTimes(2);',
      errors: [{ messageId: 'interaction' }],
    },
    {
      code: 'expect(read).toHaveReturnedWith(1);',
      errors: [{ messageId: 'interaction' }],
    },
  ],
});
