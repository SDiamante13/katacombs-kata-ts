# Installing the sensors in your own repository

A sensor has three parts: it **detects**, it **coaches**, and something **triggers** it. Most
projects already have the first. This guide is about getting all three, in whatever language you
write, without adopting this repository wholesale.

It is written to be read by a person and executed by an agent. If you would rather have the agent
do it, point it at the `install-sensors` skill — the same procedure, with the detection and the
copying automated. Everything below is what that skill follows.

> **Two things ported free.** Duplication and secret scanning do not parse your language, so they
> work in Java, Python, Go, Rust or PHP with no change at all. Start there.

---

## Before you copy anything

| Need                | Why                                                                     |
| ------------------- | ----------------------------------------------------------------------- |
| Node 22 LTS         | The sensor wrappers are Node scripts, and `jscpd` is an npm tool anyway |
| `gitleaks` on PATH  | A standalone binary, not an npm package — `brew install gitleaks`       |
| Your own toolchain  | Whatever your language already lints with                               |
| An agent with hooks | Optional. Rung 3 has a fallback for agents without them                 |

The wrappers are Node because they are glue — they shell out to a tool and format what comes back.
They do not care what language the tool inspects. If a Node dependency is unacceptable in your
project, the glue is about 150 lines and porting it is an afternoon; the contract it has to satisfy
is written down under [The contract](#the-contract).

---

## The ladder

Four rungs, cheapest and most portable first. Each one is useful on its own — stopping after rung 1
still leaves you better off than you started. Do not climb past a rung that is not green.

### Rung 0 — Know your ground

Not an install step. A step that tells you which install steps will work.

```sh
node --version      # want 22.x — ESLint 9 rejects odd-numbered releases in engines
gitleaks version    # missing is fine, the sensor says so instead of lying
```

Then answer three questions, because every later rung branches on them:

1. **What language?** Look at the manifest — `pom.xml`, `build.gradle`, `package.json`,
   `pyproject.toml`, `go.mod`, `Cargo.toml`.
2. **What already lints?** An existing config is a starting point, not an obstacle.
3. **What runs your agent?** Claude Code and Codex CLI both support hooks. If yours does not,
   rung 3 still has two tiers for you.

### Rung 1 — The two sensors that do not parse your code

**What you get.** Duplication findings and credential findings, both coached.

**Copy** — all verbatim, no edits:

```
.jscpd.json
scripts/sensor-report.mjs
scripts/sensor-guides.mjs
scripts/guides/
scripts/jscpd-sensor.mjs
scripts/gitleaks-sensor.mjs
```

`sensor-guides.mjs` imports the whole guide catalogue, so you get coaching text for sensors you have
not installed yet. It is inert and it is waiting for rungs 2 and 4.

**Wire.** Two scripts in `package.json` — add one if your project has no `package.json` yet:

```json
{
  "scripts": {
    "dup:sensor": "node scripts/jscpd-sensor.mjs",
    "secret:sensor": "node scripts/gitleaks-sensor.mjs"
  }
}
```

Point `.jscpd.json` at your source roots. In a Maven project that is `src/main/java` and
`src/test/java`, not `src`.

**Prove it fired.** A sensor you have not watched fail is a sensor you are guessing about.

```sh
npm run dup:sensor     # after pasting the same 60-token block into two files
npm run secret:sensor  # after dropping AKIAIOSFODNN7EXAMPLE into a scratch file
```

Both must report `FAIL`. That string is AWS's own documented dummy key, so nothing real is at risk.
Delete both probes afterwards.

### Rung 2 — The structural sensor, in your language

**What you get.** Length, depth, parameters, complexity — each finding carrying its guide instead of
just its number.

This is where the port actually happens, and the thing to understand first is which half is
portable. **The thresholds and the guides are the contract. The linter is one implementation of
it.** The guide text is keyed by a canonical finding id, never by a linter's rule id, so all you
write is a new mapping.

| Canonical id          | This repo (ESLint)       | Java (Checkstyle)                 | Python (Ruff) |
| --------------------- | ------------------------ | --------------------------------- | ------------- |
| `long-function`       | `max-lines-per-function` | `MethodLength`                    | `PLR0915`     |
| `long-file`           | `max-lines`              | `FileLength`                      | —             |
| `high-complexity`     | `complexity`             | `CyclomaticComplexity`            | `C901`        |
| `deep-nesting`        | `max-depth`              | `NestedIfDepth`, `NestedForDepth` | —             |
| `too-many-statements` | `max-statements`         | `JavaNCSS`                        | `PLR0915`     |
| `too-many-parameters` | `max-params`             | `ParameterNumber`                 | `PLR0913`     |
| `duplicated-code`     | jscpd                    | jscpd                             | jscpd         |
| `leaked-secret`       | gitleaks                 | gitleaks                          | gitleaks      |

**On the numbers.** They live in `eslint.config.mjs`, and [SENSORS.md](SENSORS.md) explains how they
got there. Read them there rather than from a sentence like this one — a threshold quoted in prose
is a copy that goes stale without anything noticing.

Then do not paste them in. They are the end of a conversation with _this_ codebase, and the honest
way to start yours is to measure what you have, set the threshold just inside it, and tighten from
there. Java in particular carries more ceremony per file, so a file limit that is comfortable here
will fire constantly there.

The direction of travel is always tighter, because an agent never gets tired of refactoring.

**Two rules no ecosystem ships.** Commented-out code and the ban on mocking libraries have no
off-the-shelf equivalent anywhere. Each is about twenty-five lines. In Checkstyle they are a
`RegexpSinglelineJava` check and an `IllegalImport` check; in PMD, custom XPath rules. Write them —
this is the part most worth copying, because when your ecosystem has no rule for the thing you care
about, the rule is usually shorter than the argument about whether you need it.

**Prove it fired.** Write a function with five parameters. You want the finding _and_ the coaching
underneath it, not just the count.

### Rung 3 — Make something run it

Rungs 1 and 2 are DETECT and COACH. This is TRIGGER, and it is the one that decides whether the
other two ever happen. There are three tiers and they are not alternatives — they are a ladder of
their own.

| Tier                  | Strength                                    | Cost                         |
| --------------------- | ------------------------------------------- | ---------------------------- |
| 1. Agent-native hooks | Fires inside the loop, can block completion | Needs an agent that has them |
| 2. Git hooks          | Agent-independent, nothing to configure     | Fires later in the cycle     |
| 3. The contract file  | Universal, zero-config                      | Unreliable on its own        |

**Copy** for tier 1:

```
scripts/edit-sensors.mjs        <- edit, see below
scripts/sensor-tier.mjs
scripts/session-ledger.mjs
scripts/ledger-path.mjs
scripts/node-runner.mjs
scripts/worktree-baseline.mjs
scripts/worktree-watch.mjs
.claude/settings.json + .claude/hooks/     <- or .codex/hooks.json + .codex/hooks/
```

Both runtimes call the same core behind a thin adapter, because they hand you very different
things: Claude Code names the file its edit tools wrote, Codex does not.

**Codex asks for a one-time approval the first time a hook fires. Until you approve it, nothing runs
and nothing says so.** Silence before approval looks exactly like silence after a clean edit.

**Prove it fired.** Edit any file. You want the roll call:

```text
EDIT SENSORS: eslint FAIL · jscpd PASS · gitleaks PASS
```

Then run the doctor, which is the only thing that can tell you a hook is wired _and_ has actually
run:

```sh
npm run sensors:doctor
```

### Rung 4 — The tiers that cost seconds and dollars

Behavioral (mutation testing on changed files, at the end of a turn) and inferential design (a
review the agent performs against a closed charter, gated so it is bought once a session).

Do not install these until rung 3 is green on every edit. They are gated behind the cheap sensors in
the code, and the same order applies to installing them. Read [SENSORS.md](SENSORS.md) for how both
are wired here; in Java the mutation tool is PIT and the boundary rules are ArchUnit.

---

## The contract

Port this and the rest follows. Everything above is an implementation of the four rules below.

**1. One report line per sensor.** Exactly this shape, so a human and an agent can both scan a turn:

```text
SENSOR jscpd: PASS (0 findings)
SENSOR eslint: FAIL (2 findings)
```

**2. Findings carry their guide, and the guide appears once.** A finding is a location, a canonical
id, the detail, and then the coaching. If the same guide would print twice in one report, the second
occurrence is a back-reference instead. An agent clumps attention at the end of the text, so the
guide goes below the finding, not above it.

**3. Guides are keyed by canonical id, never by a rule id.** `max-lines-per-function` and
`MethodLength` are the same finding wearing two coats. This indirection is the whole reason the
guide catalogue ports without being rewritten.

**4. Trigger frequency matches sensor cost.** Milliseconds per edit, seconds per turn, dollars per
session. A sensor that costs a model turn cannot fire on every keystroke, and a sensor that costs a
millisecond has no excuse not to.

---

## What you must edit

Everything else is a verbatim copy. These are the four places that know they are in this repository.

| Where                      | What is hardcoded                                      | Do                                    |
| -------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `scripts/edit-sensors.mjs` | Resolves `eslint` and `prettier` out of `node_modules` | Point at your linter and formatter    |
| `scripts/edit-sensors.mjs` | `LINTABLE` — the extensions worth linting              | Your extensions                       |
| `scripts/edit-sensors.mjs` | `CLONE_SCANNED` — which paths the clone detector reads | Your source roots                     |
| `scripts/edit-sensors.mjs` | `OUT_OF_SCOPE` — build output and vendored directories | Add yours; leaving ours costs nothing |

`CLONE_SCANNED` is the one worth double-checking. Getting it wrong means duplication silently goes
unscanned, and a false `PASS` is worse than a `FAIL` — it is the failure this whole apparatus exists
to prevent.

---

## Where to look next

- [SENSORS.md](SENSORS.md) — how each sensor is built and why it is built that way
- [README.md](README.md) — the argument for any of this
- `scripts/guides/` — the coaching text, one file per tier. Edit it. A guide written in your voice,
  aimed at what your team actually gets wrong, beats a generic one every time
