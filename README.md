# Katacombs — Maintainability Sensors Demo

A text adventure game, built from scratch by a coding agent with **three maintainability sensors**
wired into its loop. The game is the vehicle. The sensors are the point.

Companion repo for the *AI Coding Agent Code Quality* workshop.
Slides: **https://sdiamante13.github.io/katacombs-kata-ts/**

---

## The problem

A coding agent writes more code than any team can review line by line. Left alone it accumulates
design debt quickly, and the debt compounds: tangled code costs more tokens to work in, produces
more errors, and takes longer for a human to understand well enough to approve.

A linter alone doesn't fix this. Given only `max-lines-per-function exceeded`, an agent will happily
cut a function in half and name the second half `buildLinesAndTotal` — the number goes green and the
code gets worse. Worse still, the signal that something was wrong is now gone.

A **sensor** is the fix. Three parts, and it fails if you skip any of them:

```
DETECT  →  COACH  →  TRIGGER
```

- **Detect** — a tool finds the problem, or a reviewer with judgment does.
- **Coach** — the finding arrives *with* the guidance for fixing it, in the same message. Not a
  number to satisfy; an explanation of what the number means.
- **Trigger** — a hook fires it automatically. Not a line in a config file asking the agent to
  remember. Instructions are a request; hooks are a wall.

## The three sensors

| Sensor | Detects | Cost | Fires |
|---|---|---|---|
| **Structural** | long functions, deep nesting, too many parameters, duplication, unsafe types | milliseconds | after every file edit |
| **Behavioral** | broken behavior, then **weak assertions** via mutation testing | seconds | when the agent finishes a turn |
| **Design** | misplaced responsibilities, semantic duplication, names that lie, tests that read as transcripts | dollars and ~30s | once per session, gated |

Trigger frequency matches sensor cost. Cheap sensors run constantly; expensive ones are gated behind
the cheap ones being green.

A large part of what people call "design" turns out to be **computable** — dependency direction,
layer boundaries, purity — so it runs in the cheap tier as ordinary lint rules with coaching
messages attached. Only what genuinely needs judgment reaches the expensive tier.

See **[SENSORS.md](SENSORS.md)** for how each one is wired, and which files to copy into your own
project.

## Not just TypeScript

The demo is TypeScript, but every tier has an equivalent everywhere. Point your agent at this repo
and ask it to rebuild the loop in your language.

| Tier | JS/TS | Java | Python | Go / Rust / PHP |
|---|---|---|---|---|
| Structural | ESLint | PMD, Checkstyle | Ruff, pylint | golangci-lint, clippy, PHPMD |
| Duplication | jscpd | jscpd | jscpd | jscpd |
| Behavioral | Stryker | PIT | mutmut | go-mutesting, cargo-mutants, Infection |
| Design (computable) | dependency-cruiser | ArchUnit | import-linter | deptrac |

## Getting started

```sh
npm install
npm test          # behavior tests
npm run check     # typecheck + tests + sensor lint — what the hooks run
npm start         # play the game in a terminal
```

## Architecture

Hexagonal, and the folder names are load-bearing — the design sensors enforce the boundaries.

```
src/domain     pure game logic; no clock, no randomness, no I/O
src/ports      interfaces the domain owns
src/adapters   terminal and web implementations of those ports
```

The domain cannot import an adapter, cannot reach a global, and cannot call `Math.random()` or
`Date.now()`. Those aren't conventions in a style guide — they're lint rules, and they explain
themselves when broken.

---

## The kata

Explore an underground world through typed commands, and get out with the treasure.

**The world.** Locations are linked to each other by compass direction, by stairs, or through things
you can open — doors, gates, passages. Every link is two-way and consistent: if south from A reaches
B, then north from B reaches A. No two locations share a title.

**Playing.** On arrival the game prints the location's title and description, then anything lying
around worth picking up.

| Command | Does |
|---|---|
| `GO N` / `E` / `S` / `W` | move by compass direction |
| `GO UP` / `GO DOWN` | take stairs |
| `LOOK <direction or item>` | describe surroundings, or inspect a thing |
| `OPEN <item>` | open a door, gate, chest — the world is not always mundane |
| `TAKE <item>` / `DROP <item>` | move things between the world and your bag |
| `BAG` | list what you carry, and your gold — holds ten items |
| `USE <item>` | use something you carry, where the world allows it |
| `?` | list commands |
| `QUIT` | leave |

**Treasure.** Gold is collected automatically the first time you enter a location holding it, or
open something containing it. Your score is the gold you leave with.

**When the game can't oblige.** Looking somewhere uninteresting, attempting something the location
doesn't support, and typing nonsense each get their own distinct reply — the game always tells you
which of the three happened.

Building it in slices — movement, then looking, then items, then treasure — gives the sensors
something to react to on every increment, which is the entire point of the exercise.

---

## Credits

The kata is **Katacombs of Shoreditch**, by Marco Consolaro, from
*[Agile Technical Practices Distilled](https://www.packtpub.com/product/agile-technical-practices-distilled/9781838980849)*
by Pedro M. Santos, Marco Consolaro and Alessandro Di Gioia (Packt). The brief above is a
paraphrase — read the book for the original, and for the chapter that surrounds it. It's worth it.

The sensor idea and the computational/inferential split come from Birgitta Böckeler's
[Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html).

Pairing a coaching guide with each finding, rather than a bare metric, is Ivett Ördög's
[habit-hooks](https://github.com/habit-hooks/habit-hooks). That it measurably works is
[Liina Suoniemi's evaluation](https://github.com/LiinaSuoniemi/prompt-vs-metric-eval).

The economics are Giles Edwards-Alexander's
[The economic benefit of refactoring](https://martinfowler.com/articles/exploring-gen-ai/refactoring-economic-benefit.html):
83% fewer input tokens for the same change, from reorganising the code alone.

## License

MIT — see [LICENSE](LICENSE).
