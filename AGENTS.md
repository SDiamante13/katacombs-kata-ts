# Katacombs

A text adventure kata — explore an underground world by typed command, and leave with the treasure.
[README.md](README.md) has the rules of the game.

The design is hexagonal, and the folder names are load-bearing.

```text
src/domain     the game itself: locations, items, the bag, the score
src/ports      interfaces the domain owns
src/adapters   terminal and web — implementations of those interfaces
```

## Ports and adapters

A port is an interface the domain declares, named for the capability the game needs rather than the
tool that will supply it — `GameOutput`, not `ConsoleWriter`. The domain takes it as a parameter and
never learns which implementation arrived. An adapter implements one port with the real thing — the
terminal now, the browser later — and lives in `src/adapters`.

Anything from outside the game gets a port first and an adapter second.

## Sensors

Run `npm run check` before calling work done; a failing sensor is unfinished work, not a follow-up.

Fix the design problem a sensor names before considering an exception. Never disable a rule, lower a
severity, raise a threshold or add a suppression without explicit approval — [SENSORS.md](SENSORS.md)
has the one form an approved exception may take.
