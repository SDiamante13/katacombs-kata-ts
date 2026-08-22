# The per-edit tier is silent about unused parameters

Date: 2026-08-22

## Status

Accepted.

## Context

Red-green requires passing through a state that is incomplete on purpose:

```ts
export function toRoman(value: number): string {
  return '';
}
```

The signature came from the test; the implementation is deliberately minimal. The parameter is
unused, and it stops being unused one edit later at green.

`no-unused-vars` reported it, and the coaching guide's advice was actively wrong here — rename to
`_value`, then rename back. Churn the sensor induced. Two rules this repository teaches, colliding
at the RED→GREEN boundary.

## Decision

`@typescript-eslint/no-unused-vars` runs with `args: 'none'` in the per-edit tier and `args: 'all'`
at the commit gate. An unused _local_ is never a legal intermediate and stays reported in both.

**A per-edit sensor must be true of every state the method it enforces requires you to pass
through.** That is a third axis for choosing a trigger, after cost and after what the sensor
compares against — see [`sensor-triggers.md`](sensor-triggers.md). A sensor can be right about the
end state and wrong about a legal intermediate one, and the trigger is where you settle that rather
than by weakening either rule.

## Consequences

The override lives in `eslint.edit.config.mjs`, which imports the base config and appends two
blocks, so it cannot drift on anything else.

**Two blocks, because `no-unused-vars` is two rules.** TypeScript files get it from the
`typescript-eslint` plugin; `.mjs` files get it from base ESLint. Relaxing one leaves the other
strict, and this repository is almost entirely `.mjs` — the first version of this fix covered only
`src/**/*.ts` and `test/**/*.ts`, which is game code that did not exist yet, and left every sensor,
adapter and sensor test on the strict rule.

Widening the first block's glob does not work:

```text
A configuration object specifies rule "@typescript-eslint/no-unused-vars",
but could not find plugin "@typescript-eslint".
```

A rule must be applied in a block whose files its plugin covers. The same error appears if you try
to do this with a `--rule` flag from the command line, which applies to every file regardless.

Scoped to `src/`, `test/` and `scripts/` rather than `**/*.mjs`, so a config file at the repository
root stays strict.

**If you change this, test both extensions.** A fixture covering one cannot see that the relaxation
is scoped to a rule id the other never uses.
