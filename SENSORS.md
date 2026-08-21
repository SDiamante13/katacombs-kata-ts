# Sensors

How each sensor is wired, and which files to copy into your own project.

> **Status: stub.** The sensors land one at a time as this repo is built. Rows marked _pending_
> are not written yet. Nothing here describes a file that does not exist.

## What to copy

| File                                  | Sensor              | Does                                                      | Status  |
| ------------------------------------- | ------------------- | --------------------------------------------------------- | ------- |
| `eslint.config.mjs`                   | structural + design | thresholds and type safety; boundary and purity pending   | live    |
| `scripts/sensor-guides.mjs`           | structural + design | maps a rule id to its guide, with a fallback for the rest | live    |
| `scripts/guides/`                     | structural + design | the guide text, one file per tier                         | live    |
| `scripts/eslint-rules/`               | structural          | commented-out-code detection — a rule you write yourself  | live    |
| `scripts/sensor-report.mjs`           | all                 | the one `SENSOR x: PASS/FAIL` line every sensor prints    | live    |
| `scripts/eslint-sensor-formatter.mjs` | structural + design | turns a rule id into a coaching guide                     | live    |
| `.prettierrc.json`                    | none                | formatting, auto-fixed and never reported                 | live    |
| `.jscpd.json`                         | structural          | duplication across files                                  | live    |
| `scripts/jscpd-sensor.mjs`            | structural          | duplication findings, in the same coached format          | live    |
| `stryker.config.mjs`                  | behavioral          | mutation testing, scoped to changed files                 | pending |
| `.claude/hooks/`                      | trigger             | PostToolUse, Stop and PreToolUse wiring for Claude Code   | pending |
| `.codex/hooks.json`                   | trigger             | the same wiring for Codex CLI                             | pending |
| `.claude/skills/design-sensor/`       | design              | the inferential reviewer and its charter                  | pending |
| `AGENTS.md`                           | contract            | what the agent is told, including sensor integrity        | pending |

## The structural sensor

```sh
npm run lint:sensor   # thresholds, type safety — coached
npm run dup:sensor    # duplication — coached
npm run format        # prettier, silent, never a finding
```

| Threshold                | Value | Fires on                                     |
| ------------------------ | ----- | -------------------------------------------- |
| `max-lines-per-function` | 25    | a function doing more than one job           |
| `max-lines`              | 150   | a file holding more than one responsibility  |
| `complexity`             | 5     | branching that has to be held in your head   |
| `max-params`             | 4     | an unnamed concept passed as loose arguments |
| `max-depth`              | 2     | nesting instead of guard clauses             |
| `max-statements`         | 15    | orchestration mixed with computation         |
| jscpd `minTokens`        | 50    | the same idea written twice                  |

These are calibrated, not copied. Tighter than the defaults, and tighter than the same rules were
in an earlier project — an agent never gets tired of refactoring, so the cost of a tight threshold
is paid by the machine and the benefit is collected by the reader.

Two deliberate relaxations, both in `test/**`: `max-lines-per-function` and `max-statements` are
off, because a `describe` block is a suite and not a function, and return types are not required
on spec callbacks. Everything else applies to tests exactly as it applies to `src`.

### How a guide is written

A metric on its own makes things worse. In the study this workshop cites, telling an agent the
number and nothing else resolved the smell **11.1%** of the time — against **26.7%** for saying
nothing at all. Adding guidance took it to **77.8%**. The number is not the sensor; the number plus
the guide is the sensor.

So every guide in `scripts/sensor-guides.mjs` follows one shape:

1. **Name the smell.** `Long Method`, `Long Parameter List`, `Duplicate Code` — the agent needs to
   know what kind of problem this is, not which counter it exceeded.
2. **Give the first move.** The cheapest safe step, usually a rename or an Extract Variable. An
   agent told to "restructure this" will do the largest thing it can see; tell it where to start.
3. **Name the refactorings.** From Fowler's catalogue, verbatim — Extract Function, Introduce
   Parameter Object, Replace Nested Conditional with Guard Clauses. A named move is executable in a
   way that advice is not.
4. **Close the cheap fix.** Each guide ends with a `Not this:` line naming the specific way _that
   rule_ gets gamed — splitting a file mid-responsibility, an anonymous options bag, a bare
   `return`, reordering a duplicate to slip past the detector.

Two lengths, chosen by how much judgment the fix needs. Structural findings get four lines.
Mechanical ones — import order, an unused binding — get one, because the fix is unambiguous and the
text is printed on every occurrence.

### Comments

Only **why** comments earn their place. Most of that is a judgment call and belongs to the design
sensor, but two parts of it are computable and cost nothing:

- **Commented-out code** is decidable, so `scripts/eslint-rules/no-commented-out-code.mjs` decides
  it — it parses each comment body as TypeScript and reports the ones that are code rather than
  prose. Parsing, not pattern-matching: a comment explaining _why_ the vault door sticks is left
  alone, and a commented-out `if` is not.
- **`no-warning-comments`** catches TODO, FIXME, XXX and HACK — a decision deferred with no owner
  and no date, filed in the one place nobody looks.

There is a third, already live: `@typescript-eslint/ban-ts-comment` requires a **description** on
every `@ts-expect-error`. You cannot computationally require a why-comment in general — but you can
require one wherever somebody suppresses a check, which is exactly where a why is non-negotiable.

What is deliberately _not_ here is a comment-density rule. Counting comments teaches an agent to
delete them, including the ones worth keeping. A metric without a guide destroys the evidence it
was measuring — the same failure that makes a bare threshold worse than saying nothing.

**Every rule is coached.** Any rule with no guide of its own falls back to `sensor-contract`: _fix
the cause, never the rule_. Nothing renders bare, and the fallback is the backstop against an agent
clearing a finding by editing the config.

A guide prints in full the first time it fires and collapses to `→ name (kernel), coached above`
afterwards, so one `any` producing a dozen findings coaches once. The guidance got four times
longer than the first draft and the total output got _smaller_.

Prettier is not a sensor. It fixes formatting silently and must never produce a finding —
agent attention is too expensive to spend on whitespace.

> **Fix what's mechanical. Coach what's judgment.**

## The three tiers

| Sensor                 | Detects                                                          | Cost             | Fires                   |
| ---------------------- | ---------------------------------------------------------------- | ---------------- | ----------------------- |
| Structural             | length, depth, parameters, complexity, duplication, unsafe types | milliseconds     | after every file edit   |
| Design (computational) | layer violations, impurity, mocking libraries                    | milliseconds     | after every file edit   |
| Behavioral             | broken behavior, then weak assertions                            | seconds          | end of turn             |
| Design (inferential)   | cohesion, naming, semantic duplication, missing abstraction      | dollars and ~30s | once per session, gated |

Trigger frequency matches sensor cost. The expensive sensors are gated behind the cheap ones
being green.

## Trigger tiers

If your agent has no hooks you still get the second and third.

1. **Agent-native hooks.** Fire inside the agent loop and can block completion. Strongest.
   Verified in Claude Code and Codex CLI.
2. **Git hooks.** Husky, agent-independent, nothing to configure per tool. Fires later in the
   cycle.
3. **The instruction file.** `AGENTS.md` asking for `npm run check` before declaring work done.
   Universal, zero-config, and unreliable on its own.

## Wiring, side by side

_Pending: the Claude Code and Codex CLI hook definitions, shown together._

## Other languages

| Tier                | JS/TS              | Java            | Python        | Go / Rust / PHP                        |
| ------------------- | ------------------ | --------------- | ------------- | -------------------------------------- |
| Structural          | ESLint             | PMD, Checkstyle | Ruff, pylint  | golangci-lint, clippy, PHPMD           |
| Duplication         | jscpd              | jscpd           | jscpd         | jscpd                                  |
| Behavioral          | Stryker            | PIT             | mutmut        | go-mutesting, cargo-mutants, Infection |
| Design (computable) | dependency-cruiser | ArchUnit        | import-linter | deptrac                                |

## Keeping a sensor honest

_Pending: the ways an agent kills a sensor, and the defence for each one._
