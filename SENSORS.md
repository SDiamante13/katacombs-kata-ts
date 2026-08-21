# Sensors

How each sensor is wired, and which files to copy into your own project.

> **Status: stub.** The sensors land one at a time as this repo is built. Rows marked _pending_
> are not written yet. Nothing here describes a file that does not exist.

## What to copy

| File                                  | Sensor              | Does                                                    | Status  |
| ------------------------------------- | ------------------- | ------------------------------------------------------- | ------- |
| `eslint.config.mjs`                   | structural + design | thresholds, type safety, boundary and purity rules      | pending |
| `scripts/eslint-sensor-formatter.mjs` | structural + design | turns a rule id into a coaching guide                   | pending |
| `.prettierrc.json`                    | none                | formatting, auto-fixed and never reported               | live    |
| `.jscpd.json`                         | structural          | duplication across files                                | pending |
| `stryker.config.mjs`                  | behavioral          | mutation testing, scoped to changed files               | pending |
| `.claude/hooks/`                      | trigger             | PostToolUse, Stop and PreToolUse wiring for Claude Code | pending |
| `.codex/hooks.json`                   | trigger             | the same wiring for Codex CLI                           | pending |
| `.claude/skills/design-sensor/`       | design              | the inferential reviewer and its charter                | pending |
| `AGENTS.md`                           | contract            | what the agent is told, including sensor integrity      | pending |

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
