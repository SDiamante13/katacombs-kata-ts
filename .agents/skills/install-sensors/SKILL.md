---
name: install-sensors
description: Install quality sensors — structural, duplication, secrets, behavioral, design — into the repository you are working in, porting them to its language, build tool and agent runtime. Detects the stack, calibrates thresholds against the existing code rather than pasting defaults, wires a trigger, and proves each sensor fired before moving on. Use when asked to install, port, adopt or set up the sensors, to add quality feedback to an agent loop, or when someone points at the katacombs-kata-ts repository and asks for the same thing here.
---

# Install the sensors

You are porting a feedback loop into a repository that is probably not TypeScript and definitely not
this one. The apparatus is four rungs; you install them in order, and you do not climb past a rung
that is not green.

**A sensor detects, coaches, and is triggered by something.** A linter is one third of a sensor. If
you finish with findings that carry no guide, or guides that nothing runs, you have not installed a
sensor.

## Hard rules

- **MUST propose before applying.** Produce the plan, show what each rung will add, and stop. Do not
  write a file into the target repository until the human has approved the plan.
- **MUST NOT paste the reference thresholds.** They are the end of a conversation with a different
  codebase. Measure this one. A threshold that fires a thousand times on day one gets switched off
  on day two.
- **MUST prove each rung fired before starting the next.** Write the probe, watch the sensor fail,
  delete the probe. A sensor nobody has watched fail is a guess.
- **MUST keep the guide indirection.** Guide text is keyed by canonical finding id. You map the
  local linter's rule ids onto those ids; you do not rewrite the guides and you do not key them by
  rule id.
- **MUST NOT silence anything to make a rung pass.** If the structural sensor reports 400 findings,
  that is the calibration answer, not a problem to suppress.
- **MUST report honestly at the end** — what is installed, what is not, and what you could not
  verify. "Wired" and "verified" are different words.

## Procedure

```
- [ ] 0. Resolve the source repository
- [ ] 1. Read the ground — language, build tool, existing lint, agent runtime
- [ ] 2. Calibrate thresholds against the code that is actually here
- [ ] 3. Propose the plan and STOP for approval
- [ ] 4. Rung 1 — duplication and secrets, then prove both
- [ ] 5. Rung 2 — structural, then prove it
- [ ] 6. Rung 3 — the trigger, then prove it fired
- [ ] 7. Report what is installed, what is not, and what is unverified
```

### 0. Resolve the source

You need a checkout of `katacombs-kata-ts` to copy from. Ask where it is. If there is none, clone it
to a scratch directory outside the target repository — never inside it.

Read `INSTALL.md` and `SENSORS.md` there before proposing anything. They hold the reasoning; this
file holds the procedure.

### 1. Read the ground

Detect rather than ask, then confirm what you detected. Ask only what the repository cannot tell
you.

| Look at                            | Tells you                     |
| ---------------------------------- | ----------------------------- |
| `pom.xml`, `build.gradle*`         | Java — Maven or Gradle        |
| `package.json`                     | JS/TS, and the script surface |
| `pyproject.toml`, `setup.cfg`      | Python                        |
| `go.mod`, `Cargo.toml`             | Go, Rust                      |
| existing lint config               | What already runs, and how    |
| `.claude/`, `.codex/`, `AGENTS.md` | Which agent runtime is in use |
| `node --version`                   | Whether the wrappers can run  |
| `gitleaks version`                 | Whether rung 1 is complete    |

Node 22 is a prerequisite for the sensor wrappers. It is glue that shells out to tools and formats
what comes back, so it does not care what language it is inspecting — but it does have to run. Say
so plainly if it is missing, and offer the two honest options: install Node, or port the glue.

### 2. Calibrate

This is the step that makes an agent worth more than a copied config, so do not skip it.

**Read the reference values out of the source repository's `eslint.config.mjs`.** Do not carry them
in your head and do not take them from this file — a threshold written into a document is a copy of
the config that goes stale without anything noticing. Six of them are set there: function length,
file length, cyclomatic complexity, parameters, nesting depth, statements.

For each one, measure the current distribution across the target repository, then **propose the
tightest value that leaves fewer than about twenty findings today**. The direction of travel is
always tighter, because an agent never gets tired of refactoring — but a wall of red on day one gets
the whole apparatus deleted.

Report both numbers to the human, always as a pair. "Complexity 8 today, 5 is where the source repo
runs it, here is the gap and here are the twelve methods in the way" is a conversation. A pasted `5`
is an argument. Expect file length to be the loosest of the six in a language more ceremonious than
TypeScript, and say so rather than quietly setting it high.

### 3. Propose, then stop

Show the rungs you intend to install, the files each adds, the thresholds you measured, and anything
you could not detect. Then stop and wait. This is the rule most likely to be broken under momentum.

### 4. Rung 1 — the two that do not parse code

`jscpd` covers around 150 languages and `gitleaks` scans text, so neither needs porting. Copy
verbatim: `.jscpd.json`, `scripts/sensor-report.mjs`, `scripts/sensor-guides.mjs`, `scripts/guides/`,
`scripts/jscpd-sensor.mjs`, `scripts/gitleaks-sensor.mjs`.

Point `.jscpd.json` at real source roots — in Maven that is `src/main/java` and `src/test/java`, not
`src`.

**Probe.** Paste one identical 60-token block into two files and confirm a duplication `FAIL`. Put
`AKIAIOSFODNN7EXAMPLE` — AWS's published dummy key, so nothing real is at risk — into a scratch file
and confirm a secret `FAIL`. Delete both.

### 5. Rung 2 — structural, in this language

Bind the local linter's rules to canonical finding ids. The guide text then works unchanged.

| Canonical id          | Java (Checkstyle)                 | Python (Ruff) | Go / Rust                          |
| --------------------- | --------------------------------- | ------------- | ---------------------------------- |
| `long-function`       | `MethodLength`                    | `PLR0915`     | `funlen`, `clippy::too_many_lines` |
| `long-file`           | `FileLength`                      | —             | —                                  |
| `high-complexity`     | `CyclomaticComplexity`            | `C901`        | `gocyclo`, `cognitive_complexity`  |
| `deep-nesting`        | `NestedIfDepth`, `NestedForDepth` | —             | `nestif`                           |
| `too-many-statements` | `JavaNCSS`                        | `PLR0915`     | —                                  |
| `too-many-parameters` | `ParameterNumber`                 | `PLR0913`     | `clippy::too_many_arguments`       |

Two rules have no off-the-shelf equivalent in any ecosystem: **commented-out code** and the **ban on
mocking libraries**. Write them. In Checkstyle they are a `RegexpSinglelineJava` check and an
`IllegalImport` check; in PMD, custom XPath rules. Each is around twenty-five lines, and they are
the part most worth having.

Where the linter writes XML or JSON, parse it and emit the report format below. Do not scrape human
output — it changes without warning and a parser that silently matches nothing reports `PASS`.

**Probe.** Write a function with one more parameter than the threshold allows. You want the finding
_and_ its guide, not just a count.

### 6. Rung 3 — the trigger

Three tiers. Install the strongest one available and say which:

1. **Agent hooks** — fires inside the loop and can block completion. Copy `edit-sensors.mjs`,
   `sensor-tier.mjs`, `session-ledger.mjs`, `ledger-path.mjs`, `node-runner.mjs`,
   `worktree-baseline.mjs`, `worktree-watch.mjs` and the adapter for the runtime in use.
2. **Git hooks** — agent-independent, fires at the commit gate.
3. **The contract file** — `AGENTS.md` asking for the check before work is called done. Universal,
   and unreliable on its own, which is exactly why it is the fallback rather than the plan.

`edit-sensors.mjs` is the one file that knows it lives in the source repository. Four things in it
are hardcoded: the linter and formatter binary paths, `LINTABLE`, `CLONE_SCANNED` and
`OUT_OF_SCOPE`. `CLONE_SCANNED` is the one to check twice — wrong, and duplication silently goes
unscanned, which reports `PASS`. A false green is the failure this apparatus exists to prevent.

If the runtime is Codex, say this out loud: **it asks for a one-time approval the first time a hook
fires, and until it is approved nothing runs and nothing says so.**

**Probe.** Edit a file and confirm the roll call appears. Then confirm the sensor is not merely
wired but has actually run.

### 7. Report

State what is installed, what is deferred, and what you could not verify. Never write "verified"
about something you only wired. Rung 4 — mutation testing and the inferential design review — is
deliberately not in this procedure; point at `SENSORS.md` and leave it until rung 3 has been green
for a while.

## The contract you must not break

Four rules. Everything else is an implementation of them.

**One report line per sensor**, so a turn can be scanned:

```text
SENSOR jscpd: PASS (0 findings)
SENSOR checkstyle: FAIL (2 findings)
```

**Findings carry their guide, and each guide appears once per report.** The second occurrence is a
back-reference. The guide goes below the finding, because attention clumps at the end of the text.

**Guides are keyed by canonical id.** `max-lines-per-function` and `MethodLength` are one finding in
two coats. This indirection is why the catalogue ports without being rewritten.

**Trigger frequency matches sensor cost.** Milliseconds per edit, seconds per turn, dollars per
session.

## What good looks like

The agent edits a file, and without being asked:

```text
EDIT SENSORS: checkstyle FAIL · jscpd PASS · gitleaks PASS
```

followed by the finding, and under it the guide that says what to do instead — and, just as
importantly, which fix is the gaming move. Cutting a long method at the line limit and naming the
second half after where it sat is not a fix. The guide has to say so, or the number goes green and
the evidence disappears.
