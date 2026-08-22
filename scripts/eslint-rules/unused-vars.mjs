const shared = {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  ignoreRestSiblings: false,
};

export const unusedVars = ['error', { ...shared, args: 'all' }];

// The per-edit tier fires inside the red-green loop, where the hardcode-first
// stub is `function toRoman(value: number) { return ''; }` -- a parameter the
// body does not use yet, because the signature came from the test and the
// implementation is deliberately minimal. That state is one the method this
// repo teaches requires you to pass through, and it ends one edit later at
// green. Reporting it tells the agent to rename to _value and then rename back.
//
// An unused *local* is never a legitimate intermediate, so only args relax.
// The commit gate uses the strict version, by which point the loop has closed.
export const unusedVarsInLoop = ['error', { ...shared, args: 'none' }];
