# Why the game runs with no build, and what the `.ts` in every import buys

`npm run play` starts the game by handing Node a TypeScript file:

```sh
node --disable-warning=ExperimentalWarning src/adapters/terminal/main.ts
```

There is no compiler in that line, and there is no `dist/`. Node strips the types as it loads each
module and runs what is left. `tsc` still runs — as `npm run typecheck`, over the whole program —
but it emits nothing, and nothing it emits is ever executed.

## The cost: every internal import ends in `.ts`

Node resolves a specifier literally. It will not accept `./direction.js` for a file called
`direction.ts`, and it does not rewrite the suffix the way a bundler would. So the imports say what
is actually on disk:

```ts
import { opposite } from './direction.ts';
```

That is why `tsconfig.json` sets `allowImportingTsExtensions`. Without it, `tsc` refuses the
specifier that Node requires. The flag is safe here only because `noEmit` is on: a compiler that
emitted this code would emit an import of a file the output does not contain.

**The suffix is load-bearing, and no sensor here can tell you that.** `tsc` and Vitest both resolve
`./direction.js` and `./direction.ts` alike, so a tidy-up that changes them back to `.js` leaves the
whole check green and breaks only `npm run play` — which nothing but a human ever runs.

## Why not a build step, or a loader

Three options were on the table.

- **`tsc` to `dist/`.** Adds an artifact to keep in sync, a stale-output failure mode, and a build
  the agent has to remember before playing. The kata is six files; the build would be the biggest
  thing in the repository.
- **`tsx` or another loader.** A dependency, and a second resolution algorithm to reason about when
  something does not load. It is already present transitively, which is exactly the argument
  against depending on it.
- **Node's own type stripping.** No dependency, no artifact, and the file you run is the file you
  edited. It costs one compiler flag, one warning suppression, and the suffix rule above.

The third is the only one where **the thing that runs is the thing under the sensors**. Mutation
testing mutates `src/**/*.ts`; with a build step it would be mutating a source that a stale `dist/`
could contradict.

## What the warning suppression is hiding

`--disable-warning=ExperimentalWarning` silences one line: Node announcing that type stripping is
experimental. It is suppressed because it prints above the game's opening description and makes a
text adventure look like a crash. If type stripping ever changes behaviour under a Node upgrade,
the failure will be a resolution error at startup rather than a silent one — the suppressed warning
was never going to be the thing that told you.
