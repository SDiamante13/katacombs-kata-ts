import { comments } from './guides/comments.mjs';
import { design } from './guides/design.mjs';
import { mechanical } from './guides/mechanical.mjs';
import { secrets } from './guides/secrets.mjs';
import { structural } from './guides/structural.mjs';
import { types } from './guides/types.mjs';

export const guides = Object.fromEntries(
  Object.entries({
    ...structural,
    ...comments,
    ...design,
    ...secrets,
    ...types,
    ...mechanical,
  }).map(([name, lines]) => [name, lines.join('\n')]),
);

export const kernels = {
  'long-function': 'extract one function per job',
  'boundary-violation': 'point the arrow inward',
  'impure-domain': 'take a port, not the world',
  'nondeterministic-domain': 'pass the clock in',
  'mocking-library': 'hand-roll a Fake',
  'leaked-secret': 'rotate it first, then remove it',
  'commented-out-code': 'delete it, git remembers',
  'deferred-work': 'do it, or track it properly',
  'long-file': 'decide which kind of big it is',
  'high-complexity': 'name the conditions first',
  'deep-nesting': 'guard clauses, return early',
  'too-many-statements': 'separate deciding from doing',
  'too-many-parameters': 'name the clump, pass one object',
  'duplicated-code': 'find what varies, parameterise it',
  'untyped-value': 'declare the shape',
  'unsafe-value': 'fix the any at the source',
  'mixed-returns': 'answer on every path',
  'missing-return-type': 'write the contract you intended',
  'suppressed-finding': 'fix the cause, not the report',
  'floating-promise': 'await it or handle the failure',
  'unused-binding': 'delete it',
  'as-const': 'use as const',
  'default-export': 'export it by name',
  'import-order': 'run the fixer',
  'sensor-contract': 'fix the cause, never the rule',
};

const guideByRule = {
  'max-lines-per-function': 'long-function',
  'sensors/no-commented-out-code': 'commented-out-code',
  'sensors/no-mocking-library': 'mocking-library',
  'no-restricted-imports': 'boundary-violation',
  'no-restricted-globals': 'impure-domain',
  'no-restricted-syntax': 'nondeterministic-domain',
  'no-warning-comments': 'deferred-work',
  'max-lines': 'long-file',
  complexity: 'high-complexity',
  'max-depth': 'deep-nesting',
  'max-statements': 'too-many-statements',
  'max-params': 'too-many-parameters',
  'consistent-return': 'mixed-returns',
  'import/order': 'import-order',
  'import/no-default-export': 'default-export',
  '@typescript-eslint/no-explicit-any': 'untyped-value',
  '@typescript-eslint/no-unsafe-argument': 'unsafe-value',
  '@typescript-eslint/no-unsafe-assignment': 'unsafe-value',
  '@typescript-eslint/no-unsafe-call': 'unsafe-value',
  '@typescript-eslint/no-unsafe-member-access': 'unsafe-value',
  '@typescript-eslint/no-unsafe-return': 'unsafe-value',
  '@typescript-eslint/no-unused-vars': 'unused-binding',
  '@typescript-eslint/explicit-function-return-type': 'missing-return-type',
  '@typescript-eslint/prefer-as-const': 'as-const',
  '@typescript-eslint/ban-ts-comment': 'suppressed-finding',
  '@typescript-eslint/no-floating-promises': 'floating-promise',
  '@typescript-eslint/no-misused-promises': 'floating-promise',
};

export function guideForRule(ruleId) {
  const name = guideByRule[ruleId] ?? 'sensor-contract';

  return { name, text: guides[name], kernel: kernels[name] };
}
