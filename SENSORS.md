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
| `scripts/eslint-rules/`               | structural          | five rules you write yourself, three of them about prose  | live    |
| `scripts/sensor-report.mjs`           | all                 | the one `SENSOR x: PASS/FAIL` line every sensor prints    | live    |
| `scripts/eslint-sensor-formatter.mjs` | structural + design | turns a rule id into a coaching guide                     | live    |
| `.prettierrc.json`                    | none                | formatting, auto-fixed and never reported                 | live    |
| `.jscpd.json`                         | structural          | duplication across files                                  | live    |
| `context/comments.md`                 | structural          | what a comment may be, and which half a sensor can check  | live    |
| `scripts/jscpd-sensor.mjs`            | structural          | duplication findings, in the same coached format          | live    |
| `stryker.config.mjs`                  | behavioral          | mutation testing, scoped to changed files                 | pending |
| `scripts/edit-sensors.mjs`            | trigger             | runs the cheap tier over the files an edit just touched   | live    |
| `scripts/sensor-tier.mjs`             | trigger             | the `SENSORS` switch that decides which tier owns them    | live    |
| `scripts/session-ledger.mjs`          | trigger             | the changed-path ledger the Stop hooks will read          | live    |
| `scripts/worktree-watch.mjs`          | trigger             | catches a file a shell command wrote, which names no path | live    |
| `scripts/worktree-baseline.mjs`       | trigger             | SessionStart; the one hook both runtimes share unchanged  | live    |
| `.claude/settings.json`               | trigger             | SessionStart and PostToolUse wiring for Claude Code       | live    |
| `.claude/hooks/`                      | trigger             | the Claude Code adapter; PreToolUse pending               | live    |
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

## The behavioral sensor

```sh
npm run behavior:sensor   # types, then the tests, then the mutants they miss — coached
npm run behavior:report   # opens the last run's HTML report
```

Coverage is the gameable metric. A suite can execute every line in a file, assert almost nothing,
and report 100%. Mutation testing asks the only question that matters about a test: **if the code
were wrong, would this test say so?** Stryker changes the code on purpose — flips a comparison,
empties a string, inverts a condition — and reruns the tests. A mutant that dies is a test doing its
job. A mutant that survives is a line your tests execute and do not care about.

### An escalation, and each stage gates the next

0. **The cheap sensors, at the Stop hook only.** eslint, jscpd and gitleaks over what the turn
   changed, in about a second. If the millisecond tier still has findings, the expensive tier does
   not run — its answer would be about code that is about to change again. This is the layered loop
   enforcing itself rather than being described.
1. **`tsc --noEmit`.** Vitest strips types rather than checking them, so a type error rides through
   a green suite. If the compiler is unhappy, everything below this line is measuring the wrong
   program.
2. **vitest, on the tests related to what changed.** If they are red, the tier stops and says so. A
   mutation score over a failing suite is noise. (If the change _deleted_ a source file, the tier
   widens to the whole product suite instead — a deleted file cannot be named to `vitest related`,
   and its importers are exactly what needs checking.)
3. **Stryker, scoped with `--mutate` to the changed source files.**

Each stage is cheap next to the one after it, and a failure at any stage makes the next stage's
answer meaningless. That is the whole reason for the order.

### Four things it can say, and they are not interchangeable

| Line                                       | Means                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `SENSOR behavior: PASS (0 findings)`       | It ran, and here is the count of what it ran on                 |
| `SENSOR behavior: FAIL (n findings)`       | It ran and found n things                                       |
| `SENSOR behavior: SKIP (nothing in scope)` | Nothing it watches changed. **Not a pass** — it checked nothing |
| `SENSOR behavior: UNAVAILABLE`             | The mutation run did not finish, so nothing has been checked    |

The distinction between the first and third is the point. A sensor whose "all clear" is
byte-identical whether it examined forty mutants or zero files has told you nothing, and the reader
cannot tell which happened. So a pass always carries its accounting:

```
SENSOR behavior: PASS (0 findings)
  3 files · 30 mutants · 30 killed · 0 survived · 0 untried
```

A pass has nothing surviving and nothing untried by construction — either would be a finding. The
line is there so you can see the _size_ of the check that passed.

Timeouts count as killed — a mutant that hangs the suite was detected by it. Mutants that could not
be evaluated at all (a mutation that does not compile, a crash in the runner) are counted separately
as `not evaluated`, because "we could not try" is not "we tried and it was fine".

`UNAVAILABLE` is the same rule the secret sensor follows: **a sensor that cannot run must never
report green.**

### The findings

| Rule               | Fires when                                                          |
| ------------------ | ------------------------------------------------------------------- |
| `broken-types`     | `tsc` rejects the change; the stages below it are not run           |
| `broken-behavior`  | the related tests are red; mutation is not run                      |
| `mutant-survived`  | a test executes the line, the behaviour changed, and nothing failed |
| `mutant-uncovered` | no test reaches the line at all — a coverage gap in front of that   |

`mutant-uncovered` findings are collapsed to one per line, because twelve untried mutants on one
line are one piece of news. Eight findings print in full; the rest are counted, and the HTML report
has all of them. When several tests fail at once, `broken-behavior` keeps each failure's name and
assertion — a flat tail of the output drops the first one, which is usually the one that matters.

### What it costs

Median of three runs each, on an idle ten-core machine:

| Change                                        | Mutants | Wall clock |
| --------------------------------------------- | ------- | ---------- |
| Nothing it watches changed                    | —       | **0.06s**  |
| Related tests are red (stops at stage 2)      | —       | **1.2s**   |
| One small file, well covered                  | 10      | **6.0s**   |
| Three files, well covered                     | 30      | **7.5s**   |
| Ten small files, well covered                 | 140     | **6.7s**   |
| One file, almost nothing covered              | 442     | **7.9s**   |
| Ten files, five functions each, fully covered | 700     | **33s**    |

The model, and it is worth stating precisely because the obvious guess is wrong: about four seconds
is fixed, and **the rest scales with the mutants your tests actually cover** — very roughly
0.03–0.09 seconds each, shared across cores and sensitive to what else the machine is doing.
Uncovered mutants are nearly free, which is why the 442-mutant row costs less than the 30-mutant
one. A well-covered change is the expensive kind, which is the right way round: the tier costs most
where it has most to say.

Note what this does **not** say. `complexity: 5` caps how many mutants a single _function_ can have;
it says nothing about how many functions a change touches. The structural tier bounds the worst case
per unit, not per turn. So this tier bounds itself, twice:

- more than 25 changed source files, and it refuses before starting;
- more than 90 seconds mutating, and it stops and says so.

Both come back as `scope-too-large`, pointing at `npm run check` — the commit gate has time this
tier does not. Raising either number is a decision about how long a pause you will tolerate, not a
detail.

The hung-test case has its own bound: the test stage is killed at 120 seconds, and the product's own
suite sets `testTimeout` to 10 seconds in `vitest.mutation.config.ts` so one stuck test fails rather
than waits. This repository's _sensor_ tests are allowed 30 seconds, because they spawn real linters
and real mutation runs, which is a fact about them rather than a slackening.

This is the end-of-turn cost, not the commit cost. `npm run check` runs the whole suite and takes
about eighty seconds here, almost all of it those sensor tests.

### Why it fires when the agent stops

Structural sensors compare a file against a threshold, and a file half-way through an edit is still
a file. Mutation testing compares tests against code, and mid-edit those two are legitimately out of
step — the red half of red-green is a state the method requires you to pass through. Firing this
tier per edit would report a finding on every first step of TDD. End of turn is the first moment the
two are meant to agree.

`scripts/stop-sensor.mjs` is the whole hook, and **both runtimes point at the same file** — the
second one they share unchanged, after `worktree-baseline.mjs`. Where `PostToolUse` forced two
adapters, `Stop` needs none: neither runtime hands the hook anything it needs.

### Not blocking forever

A Stop hook that blocks whenever it has something to say is a loop. Three guards, in order:

- `stop_hook_active`, when the runtime sets it. Claude Code does; do not rely on it alone.
- **A fingerprint of the findings.** The same set of findings buys one push-back, not one per turn.
  Fix some and break others and the fingerprint changes, which is new information and earns another.
- **A cap of three** push-backs per session, whatever the agent does in between.

Past those, the sensor still reports — it just stops standing in the doorway. The findings go out on
`systemMessage` _and_ on stderr, because only one of those is verified to reach the agent in each
runtime.

### Suppression

Stryker honours `// Stryker disable` comments, which is a suppression an agent can write. There is
no flag to turn that off, so it is closed twice, in both tiers that could be fooled by it:

- `sensors/no-sensor-suppression` reports the comment as a structural finding — along with
  `jscpd:ignore` and `gitleaks:allow`.
- The behavioral verdict refuses it directly. A suppressed mutant comes back from Stryker with
  status `Ignored`, and `mutation-suppressed` turns that into a finding rather than a quiet line in
  the accounting.

The second one matters because the first lives in a different tier. A sensor that relies on another
sensor to notice it has been switched off is one config change away from silent. Same philosophy as
`--ignore-gitleaks-allow`: **a sensor you can switch off from inside the file it would have reported
is not a sensor.**

For what this tier is pointed at and what it deliberately leaves alone, see
[`context/mutation-scope.md`](context/mutation-scope.md).

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

**Codex asks for a one-time approval the first time a hook fires, and nothing in the repository can
tell you it is waiting.** Before you approve it there are no events, no ledger entries, no error and
no log line. Silence before approval looks exactly like silence after a clean edit — which is the
whole failure mode this apparatus exists to prevent, reproduced in the wiring of the apparatus
itself.

So there is a command whose only job is to answer _is this thing actually on?_

```sh
npm run sensors:doctor
```

```text
SENSORS DOCTOR

  Claude Code
    manifest    .claude/settings.json  ok
    adapter     .claude/hooks/post-edit-sensor.mjs  ok
    last fired  2026-08-22 14:13

  Codex CLI
    manifest    .codex/hooks.json  ok
    adapter     .codex/hooks/post-edit-sensor.mjs  ok
    last fired  never
```

`last fired` is the only line that is evidence. The other two say the wiring is _declared_; a hook
can be perfectly declared and never run.

Read `never` carefully, because it means two different things. The mark lives in gitignored
`reports/`, so a fresh clone or a new worktree reads `never` however well the hooks work — that is a
cold start, not a diagnosis. **`never` after you have made an edit is the diagnosis.** Make one
trivial edit, run the doctor again, and if it still says `never`, the hook is not firing.

Codex approval is per machine rather than per checkout: approve once and your clones and worktrees
inherit it.

**A hook cannot verify that hooks run.** That check has to live in the tier below, which is why the
pre-commit hook asserts it when you have told it not to repeat the cheap sensors:

```sh
node scripts/sensors-doctor.mjs --assert
```

Under `SENSORS=agent` the commit gate skips the cheap sensors on the claim that the agent loop
already ran them. That assertion demands evidence — a hook run more recent than the newest staged
file — and fails the commit rather than taking the claim on trust.

One thing the doctor deliberately does not do: `codex exec` **does not re-verify hook trust once you
have approved it**. The manifest's timeout, the hook's path, and the hook script's own contents can
all be changed afterwards and non-interactive runs will re-run them without asking again. Nothing
here notices that, and nothing here pretends to — the checksum tamper sensor is what covers it.

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

### The comment sensors

Comments are the only artifact here that can be wrong for a year without anything noticing. Nothing
compiles them, no test asserts them, and readers trust prose more than code — so a wrong comment
does more damage than no comment.

Two of the ways they go wrong are mechanical:

```sh
sensors/one-line-comment    a comment block longer than one line
sensors/no-stale-reference  a backticked name or path that no longer resolves
```

The first says: if the why fits in a line, keep it in the code; if it does not, it is a document,
and a document kept in a comment cannot be linked to and will not be maintained. Write it in
`context/` and leave a one-line comment pointing at the page. Splitting the paragraph into
consecutive one-liners does not work — the rule counts the run, not the line.

The second is the drift detector, and it is the reason to write code names in backticks:

```js
// `readHookPayload` parses it     <- checked against this file's identifiers
// see `context/comments.md`       <- checked against the filesystem
// the door is `never` open        <- prose, ignored
// run `npm run check` first       <- prose, ignored
```

A comment naming a function that has since been renamed is worse than unhelpful. It teaches the
reader that comments in this repository cannot be trusted, which costs you every other comment too.

**Neither rule can tell a why from a what.** That is judgment and it stays with the design sensor.
What these two buy is that the judgment gets spent on comments that are at least short and at least
true — and the coaching guides spend most of their words on the question the sensors cannot ask:
_can the code say this instead?_ Nine times in ten it can, and the comment was a name nobody wrote.
Full policy in [`context/comments.md`](context/comments.md).

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

### One rule the per-edit tier does not enforce

Red-green requires passing through a state where the signature exists and the body does not use it
yet:

```ts
export function toRoman(value: number): string {
  return '';
}
```

That is the hardcode-first stub, and at that instant it is correct — the parameter is unused because
the implementation is deliberately minimal, and it stops being unused one edit later at green. A
sensor that reports it tells the agent to rename to `_value` and then rename back. Churn the sensor
induced.

So `@typescript-eslint/no-unused-vars` runs with `args: 'none'` in the per-edit tier and `args:
'all'` at the commit gate. An unused _local_ is never a legal intermediate and is reported in both.

**A per-edit sensor must be true of every state the method it enforces requires you to pass
through.** That is a different axis from cost and from what a sensor compares against — two good
rules can disagree at a boundary, and the trigger is where you settle it rather than by weakening
either one.

The override lives in `eslint.edit.config.mjs`, which is the whole of `eslint.config.mjs` plus two
scoped blocks. It imports the base config, so it cannot drift on anything else.

Two blocks, not one, and the reason is worth knowing before you copy this. `no-unused-vars` is two
different rules: TypeScript files get it from the `typescript-eslint` plugin, `.mjs` files from base
ESLint. Relaxing one leaves the other strict — and if your repository is mostly `.mjs`, as this one
is, relaxing only the TypeScript rule relaxes nothing you actually write.

Widening the first block's glob to cover `.mjs` does not work either:

```text
A configuration object specifies rule "@typescript-eslint/no-unused-vars",
but could not find plugin "@typescript-eslint".
```

That is the same failure as passing `--rule` from the command line, reached by a different route. A
rule has to be applied in a block whose files its plugin actually covers, which is why the fix is a
second block using the base rule id rather than a wider glob on the first.

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
