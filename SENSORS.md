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
| `scripts/edit-sensors.mjs`            | trigger             | runs the cheap tier over the files an edit just touched   | live    |
| `scripts/sensor-tier.mjs`             | trigger             | the `SENSORS` switch that decides which tier owns them    | live    |
| `scripts/session-ledger.mjs`          | trigger             | the changed-path ledger the Stop hooks will read          | live    |
| `scripts/worktree-watch.mjs`          | trigger             | catches a file a shell command wrote, which names no path | live    |
| `scripts/worktree-baseline.mjs`       | trigger             | SessionStart; the one hook both runtimes share unchanged  | live    |
| `.claude/settings.json`               | trigger             | SessionStart and PostToolUse wiring for Claude Code       | live    |
| `.claude/hooks/`                      | trigger             | the Claude Code adapter; Stop and PreToolUse pending      | live    |
| `.codex/hooks.json`                   | trigger             | the same wiring for Codex CLI                             | live    |
| `.codex/hooks/`                       | trigger             | the Codex adapter                                         | live    |
| `.claude/skills/design-sensor/`       | design              | the inferential reviewer and its charter                  | pending |
| `AGENTS.md`                           | contract            | what the agent is told, including sensor integrity        | pending |

## The structural sensor

```sh
npm run lint:sensor    # thresholds, type safety — coached
npm run dup:sensor     # duplication — coached
npm run secret:sensor  # credentials — coached
npm run docs:sensor    # documentation that lies — coached
npm run format         # prettier, silent, never a finding
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

## Secrets

`gitleaks` scans the working tree on every `npm run check`. It needs the binary on PATH —
`brew install gitleaks`, or see the project's releases. It is the one sensor here with an external
prerequisite, and that is deliberate: the alternative was an unofficial npm wrapper, and a repo
about code integrity should not take a supply-chain shortcut to get a supply-chain tool.

Three choices worth copying:

- **It never prints the secret.** The finding gives you the rule, the file and the line; the value
  stays redacted. A sensor that echoes the credential into a terminal, a CI log and an agent's
  context has widened the leak in the course of reporting it.
- **`--ignore-gitleaks-allow`.** By default a `// gitleaks:allow` comment silences a finding. That
  is a suppression an agent can write, so the flag closes it. The `.gitleaksignore` file is the
  same hole with a different shape; there isn't one in this repo.
- **It fails when it cannot run.** No binary, a bad exit code, a missing report — all of them
  report `UNAVAILABLE` and exit non-zero rather than `PASS`. **A scanner that cannot run must never
  report green**, and that is not hypothetical: the first version of this sensor passed a malformed
  flag, silently scanned the wrong directory, and reported PASS on a file containing a live-looking
  token. The test that now catches it plants a credential and demands a FAIL.

Note where this sits. Secret scanning is not about maintainability, so it is not one of the three
sensors — but it is deterministic, it costs milliseconds, and it fires on every edit, so it belongs
in the same cheap tier. **The cheap tier is not a category of problem, it is a category of cost.**

## Documentation

Every sensor above watches the code. None of them can read, so the prose beside the code is the one
artifact in the repo that nothing checks — and the prose is what people copy.

This is not hypothetical. `README.md` in this repo told readers to run `npm start` for months. There
has never been a `start` script. Four sensors ran on every edit and not one of them could tell.

`scripts/docs-sensor.mjs` closes the cheap half of that. Over every markdown file git tracks, it
checks two things and no more:

- **every `npm run x`, `npm start`, `npm test` the docs mention has a matching script** in
  `package.json` — the exact bug above;
- **every relative link resolves** to a file that exists.

It verifies that claims _exist_; it never runs them. A doc sensor that executed the commands it
found would be a remote-code-execution hole pointed at your own README.

### Should a sensor be committed, or ignored?

This repo has both. The rule:

> **A sensor ships if it checks something the clone contains. It is gitignored only if it checks
> something that exists on one machine.**

`.claude/hooks/notes-sensor.sh` is gitignored because it enforces a writing habit against a
directory that only exists on the author's laptop — useful, and meaningless to you. The
documentation sensor is committed, because every repository has a README and every README rots.
A sensor you cannot copy is not a sensor you can adopt.

## The design sensor, computationally

Most of design is not a judgment call. These rules cost the same milliseconds as the structural
ones and fire on the same edit — they are `no-restricted-imports`, `no-restricted-globals` and
`no-restricted-syntax`, aimed at `src/domain/**` and `src/ports/**`.

| Fires when the domain…                                          | Because                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| imports from `src/adapters`                                     | dependencies point inward; the domain never knows an adapter          |
| imports `node:fs`, `readline`, `http`…                          | I/O belongs at the outer shell, behind a port                         |
| touches `console`, `process`, `fetch`, `window`                 | the domain does not print, read the environment, or reach the network |
| calls `Math.random()`, `Date.now()`, `new Date()`, `setTimeout` | time and randomness are inputs, not ambient facts                     |

And in the tests, `sensors/no-mocking-library` bans `vi.mock`, `jest.spyOn`, `sinon.stub` and their
relatives. That one is Michael Feathers' argument compiled into a lint rule: hard-to-test code is
badly designed code, so mocking pain is design feedback. A mocking library medicates the pain and
throws the feedback away. Write a Fake in `test/fakes/`; if the Fake is awkward, the port is wrong,
and that is worth more than the test you were about to write.

**These rules were written before `src/domain` existed.** A glob that matches nothing is inert, and
it starts biting the instant the first domain file lands — so there is never a window where the
architecture is unwatched.

Note what this buys that the structural sensor cannot: no threshold can see that a function reached
for the file system. **Structural sensors buy clean shape; only boundary sensors buy clean
boundaries.**

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

The cheap tier fires after every edit. Both runtimes call the same core —
`scripts/edit-sensors.mjs` — behind a thin adapter, because the two of them hand you very
different things.

**Claude Code** names the file its edit tools wrote:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-sensor.mjs\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

The adapter reads `tool_input.file_path`, runs the sensors, and on a finding writes the coaching
to stderr and exits `2` — which is how Claude Code feeds a hook's output back to the model.

**Note `Bash` in that matcher.** An agent does not need the edit tools to write a file. `sed -i`,
a heredoc, a Python one-liner — all of them write, and none of them produce a `file_path`. A hook
matched only on `Edit|Write` is a hook the agent walks around without ever meaning to. So the
adapter also watches the working tree, and the `Bash` matcher is what gives it the chance to look.

**Codex** matches shell commands only, so it has nothing else to go on. There is no `file_path` in
the payload, because as far as Codex is concerned the agent ran `apply_patch`, not `Edit`. It keeps
a snapshot of `git status --porcelain` plus modification times, and the files whose stamp moved are
the files that changed. A `SessionStart` hook takes the first snapshot so the session's opening
state is never mistaken for an edit. Both runtimes share that script, because a session id is the
one thing they agree on.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/scripts/worktree-baseline.mjs\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "shell|Bash|apply_patch|exec_command",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$(git rev-parse --show-toplevel)/.codex/hooks/post-edit-sensor.mjs\"",
            "timeout": 60,
            "statusMessage": "Running the cheap sensors on what just changed"
          }
        ]
      }
    ]
  }
}
```

Codex takes its answer as JSON on stdout — `{"decision": "block", "reason": "..."}` — rather than
as an exit code.

That difference is the whole argument for keeping the sensors out of the hooks. The core knows
nothing about either runtime; the adapters know nothing about linting. Porting to a third agent is
one file.

### What the agent sees

Nothing at all, when the edit is clean. That is deliberate: a sensor that speaks on every edit is
a sensor the agent learns to skim. On a finding it gets a roll call and the coaching:

```text
EDIT SENSORS: eslint FAIL · jscpd PASS · gitleaks PASS

SENSOR eslint: FAIL (2 findings)

test/probe.mjs:1:8 ERROR max-params
  Function 'describeRoom' has too many parameters (5). Maximum allowed is 4.

  TOO-MANY-PARAMETERS
  Long Parameter List, with Data Clumps underneath it: parameters that always
  travel together are a concept nobody has named. ...
```

The roll call names the sensors that passed as well as the one that failed, so the agent learns
what is watching rather than only what it broke.

### Why the documentation sensor is not in that list

It is as cheap as ESLint, so on cost alone it belongs here. It was wired here first, and it was
wrong in both directions at once — it **fired** while a document was deliberately ahead of the code,
which is the normal state while a design is still settling, and it **stayed silent** when a script
was renamed in `package.json` and left every document naming it broken.

The difference is not cost, it is what the sensor measures against:

| Sensor   | Invalidated by editing                       | Trigger             |
| -------- | -------------------------------------------- | ------------------- |
| ESLint   | only the file itself                         | after every edit    |
| gitleaks | only the file itself                         | after every edit    |
| jscpd    | any other file — so it scans the whole tree  | after every edit    |
| docs     | `package.json`, or any file a link points at | completion boundary |

**Trigger frequency matches sensor cost, and trigger moment matches what the sensor compares
against.** A sensor whose invariant spans two artifacts says nothing true until both have settled,
and a sensor that can be broken by editing a file it is not watching will miss the break. The
documentation sensor runs at the commit boundary over every tracked document, which is what finally
catches the rename. Full reasoning in [`context/sensor-triggers.md`](context/sensor-triggers.md).

### Running both tiers without running everything twice

The agent hook and the pre-commit hook overlap: both run the cheap sensors. That redundancy is
the point of tier 2 — it is what covers you when your agent has no hooks — but it should be a
choice. One environment variable decides:

| `SENSORS`      | After every edit | At commit                                     |
| -------------- | ---------------- | --------------------------------------------- |
| unset or `all` | fires            | `npm run check` — everything                  |
| `agent`        | fires            | `npm run check:behavioral` — typecheck, tests |
| `git`          | silent           | `npm run check` — everything                  |

`agent` is the setting with no duplicated work: the cheap sensors already ran inside the loop, so
the commit gate only adds what they were too slow to do. `git` is for an agent with no hooks at
all. The default is both, because being told twice is cheaper than being told never.

## Other languages

| Tier                | JS/TS              | Java            | Python        | Go / Rust / PHP                            |
| ------------------- | ------------------ | --------------- | ------------- | ------------------------------------------ |
| Structural          | ESLint             | PMD, Checkstyle | Ruff, pylint  | golangci-lint, clippy, PHPMD               |
| Duplication         | jscpd              | jscpd           | jscpd         | jscpd — _one tool, ~150 languages_         |
| Secrets             | gitleaks           | gitleaks        | gitleaks      | gitleaks — _it scans text, so all of them_ |
| Behavioral          | Stryker            | PIT             | mutmut        | go-mutesting, cargo-mutants, Infection     |
| Design (computable) | dependency-cruiser | ArchUnit        | import-linter | deptrac                                    |

The two cheap-tier rows are the easy win: duplication and secret scanning are **one tool each,
whatever you write**. Neither parses your language, so neither needs a port.

Two of the rules in this repo have no off-the-shelf equivalent in any of those columns — the one
that finds commented-out code and the one that bans mocking libraries. Each is about
twenty-five lines. That is the part most worth copying: when your ecosystem has no rule for the
thing you care about, write it. Every linter in that table takes custom rules, and the rule is
usually shorter than the argument about whether you need it.

## Keeping a sensor honest

_Pending: the ways an agent kills a sensor, and the defence for each one._
