# Katacombs — Quality Sensors Demo

A text adventure game, built from scratch by a coding agent with **three quality sensors**
wired into its loop. The game is the vehicle. The sensors are the point.

Companion repo for the _AI Coding Agent Code Quality_ workshop.
Slides: not published yet — this repo is still under development. The deck will go up at
`https://sdiamante13.github.io/katacombs-kata-ts/` when it is ready.

---

## The problem

A coding agent writes more code than any team can review line by line. Left alone it piles up
design debt, and the debt compounds: tangled code costs more tokens to work in, produces more
errors, and takes longer for a human to understand well enough to approve.

A linter alone doesn't fix this. Given only `max-lines-per-function exceeded`, an agent cuts a
function in half and names the second half `buildLinesAndTotal`. The number goes green, the code
gets worse, and the signal that told you something was wrong is gone.

A **sensor** is the fix. It has three parts, and each one fails differently when you skip it:

| Ask                    | Skip it and                                          | Which is                    |
| ---------------------- | ---------------------------------------------------- | --------------------------- |
| **What notices?**      | nothing tells you the code is drifting               | the obvious failure         |
| **What does it say?**  | the agent games the number and destroys the evidence | Ivett Ördög's finding       |
| **What makes it run?** | the check exists and nobody runs it                  | Birgitta Böckeler's finding |

Three questions, three answers:

```
DETECT  →  COACH  →  TRIGGER
```

**DETECT — what notices?** A tool, or a reviewer with judgment. Cheap deterministic tools catch
the things you can name in advance; an LLM catches what you can't.

**COACH — what does it say?** The finding arrives _with_ the guidance for fixing it, in the same
message. A bare threshold tells the agent which number to push down. An explanation tells it what
the number stands in for. Skip this, and you end up behind where you started: the smell survives and
the linter has gone quiet.

**TRIGGER — what makes it run?** A hook fires it whether anyone remembered to ask. A line in
a config file competes with everything else in the context window and loses, and an agent cannot
build the habit of checking. Instructions are a request; hooks are a wall.

Detection is the easy part. Most setups stop there.

## The three sensors

| Sensor         | Detects                                                                                          | Cost           | Fires                          |
| -------------- | ------------------------------------------------------------------------------------------------ | -------------- | ------------------------------ |
| **Structural** | long functions, deep nesting, too many parameters, duplication, unsafe types                     | milliseconds   | after every file edit          |
| **Behavioral** | broken behavior, then **weak assertions** via mutation testing                                   | seconds        | when the agent finishes a turn |
| **Design**     | misplaced responsibilities, semantic duplication, names that lie, tests that read as transcripts | one model turn | once per session, gated        |

Trigger frequency matches sensor cost. Cheap sensors run constantly; expensive ones are gated behind
the cheap ones being green.

Much of design is **computable**: dependency direction, layer boundaries, purity. Those run in the
cheap tier as ordinary lint rules with coaching messages attached. Only what needs judgment reaches
the expensive tier.

See **[SENSORS.md](SENSORS.md)** for how each one is wired, and which files to copy into your own
project.

## Not just TypeScript

The demo is TypeScript. Each tier has an equivalent in other ecosystems, so point your agent at
this repo and ask it to rebuild the loop in your language.

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

## Getting started

```sh
npm install
npm run play      # play the game in your terminal; type ? for the commands, QUIT to leave
npm run check     # typecheck, secrets, tests, structure, duplication, docs, mutants — what the hooks run
npm test          # the tests on their own
npm run behavior:report   # the last mutation run, in a browser, labelled with what it covers
```

`npm run check` runs every sensor a program can run. One of them, `gitleaks`, is a binary rather
than a package — `brew install gitleaks`, or grab a release. If it is missing the check fails rather
than skipping: a scanner that cannot run must never report green.

The inferential design sensor is the one it cannot run. That tier is a judgment, so it fires once
per session from the Stop hook and is recorded by hand:

```sh
npm run design:scope      # what changed this session, and what to read
npm run design:review -- reports/design-findings.json
npm run design:report     # the last review, whole
```

## Architecture

Hexagonal. The design sensors match on these paths, so the folder names are part of the contract.

```
src/domain     pure game logic; no clock, no randomness, no I/O
src/ports      interfaces the domain owns
src/adapters   terminal and web implementations of those ports
```

The domain cannot import an adapter, reach a global, or call `Math.random()` or `Date.now()`.
Those are lint rules rather than style-guide advice, and each one prints its reasoning when it
fires.

---

## The kata

Explore an underground world through typed commands, and get out with the treasure.

**The world.** Locations are linked to each other by compass direction, by stairs, or through things
you can open: doors, gates, passages. Every link is two-way and consistent: if south from A reaches
B, then north from B reaches A. No two locations share a title.

**Playing.** On arrival the game prints the location's title and description, then anything lying
around worth picking up.

| Command                       | Does                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `GO N` / `E` / `S` / `W`      | move by compass direction                            |
| `GO UP` / `GO DOWN`           | take stairs                                          |
| `LOOK <direction or item>`    | describe surroundings, or inspect a thing            |
| `OPEN <item>`                 | open a door, gate or chest                           |
| `TAKE <item>` / `DROP <item>` | move things between the world and your bag           |
| `BAG`                         | list what you carry, and your gold — holds ten items |
| `USE <item>`                  | use something you carry, where the world allows it   |
| `?`                           | list commands                                        |
| `QUIT`                        | leave                                                |

That table is the finished game. `npm run play` answers the rows built so far and tells you it did
not understand the rest; `?` always lists exactly what the build in front of you accepts.
[`backlog/`](backlog/README.md) has the order the others arrive in.

**Treasure.** Gold is collected the first time you enter a location holding it, or open something
containing it. Your score is the gold you leave with.

**When the game can't oblige.** Typing nonsense, looking somewhere uninteresting, attempting
something the location doesn't support, and being stopped by a thing you could open each get a
distinct reply, so you can tell which of the four happened. The last one is the one that matters:
"the iron gate is closed" tells you what to do next, and "you can't go that way" doesn't.

It gets built in slices, each one playable — [`backlog/`](backlog/README.md) has the order and the
acceptance criteria. That gives the sensors something to react to on every increment.

---

## Credits

The kata is **Katacombs of Shoreditch**, by Marco Consolaro, from
_[Agile Technical Practices Distilled](https://www.packtpub.com/product/agile-technical-practices-distilled/9781838980849)_
by Pedro M. Santos, Marco Consolaro and Alessandro Di Gioia (Packt). The brief above is a
paraphrase. Read the book for the original, and for the surrounding chapter.

The sensor idea and the computational/inferential split come from Birgitta Böckeler's
[Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html).

Pairing a coaching guide with each finding, rather than a bare metric, is Ivett Ördög's
[habit-hooks](https://github.com/habit-hooks/habit-hooks). That it measurably works is
[Liina Suoniemi's evaluation](https://github.com/LiinaSuoniemi/prompt-vs-metric-eval).

The economics are Giles Edwards-Alexander's
[The economic benefit of refactoring](https://martinfowler.com/articles/exploring-gen-ai/refactoring-economic-benefit.html):
83% fewer input tokens for the same change, from reorganizing the code alone.

## License

MIT. See [LICENSE](LICENSE).
