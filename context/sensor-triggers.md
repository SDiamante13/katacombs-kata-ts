# 1. A sensor's trigger matches its cost _and_ what it measures against

Date: 2026-08-21

## Status

Accepted.

## Context

Sensors in this repository fire at three different moments: after every file edit, at the end of a
turn, and once per session behind a gate. The rule for choosing was originally about **cost** —
cheap sensors can afford to run often, expensive ones cannot.

Cost turned out to be only half of it. The documentation sensor is as cheap as ESLint, so by the
cost rule it belonged in the per-edit tier, and that is where it was first wired. It was wrong
there, in both directions at once:

- It **fired** while a document was deliberately ahead of the code — the normal state of affairs
  when you write the docs after the design settles.
- It **stayed silent** when a script was renamed in `package.json`, leaving every document that
  named it broken. Verified: renaming `docs:sensor` and firing the hook with `package.json` as the
  edited file returned exit 0 while the documentation was genuinely stale.

The difference is not cost. It is what the sensor measures against.

## Decision

A sensor's trigger is chosen on two axes, not one.

**Cost** — how long it takes, and whether that is affordable at this frequency.

**Settling** — whether the thing it measures against is in a consistent state at that moment. A
sensor whose invariant spans two artifacts cannot say anything true until both have settled, and a
sensor whose invariant can be broken by editing a file it is not watching will miss the break.

| Sensor   | Invalidated by editing                       | Trigger             |
| -------- | -------------------------------------------- | ------------------- |
| ESLint   | only the file itself                         | after every edit    |
| gitleaks | only the file itself                         | after every edit    |
| jscpd    | any other file — so it scans the whole tree  | after every edit    |
| docs     | `package.json`, or any file a link points at | completion boundary |

## Consequences

The documentation sensor runs at the commit boundary, where it scans every tracked document rather
than only the ones that changed. It therefore catches the rename case it used to miss, and stops
reporting documents that are ahead of the code on purpose.

The per-edit tier is now four things: Prettier silently, then ESLint, jscpd and gitleaks.

**Do not move a sensor into the per-edit tier because it is fast.** Ask what it compares against
and whether that thing has settled. This is the reason the mutation tester and the design reviewer
are not there either, but cost is a sufficient explanation for those two and is not the interesting
half of the rule.
