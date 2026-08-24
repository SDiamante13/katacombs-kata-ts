# Slice 2 — Open the way through

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to open a door that blocks my way, so that the map has places I have to earn
rather than only places I have not walked to yet.**

This slice introduces the first thing in the world you can name, so `LOOK <thing>` arrives with it.

```gherkin
Scenario: A closed door is part of the place
  Given the player is in a location whose east side is an iron gate
  When they arrive
  Then the description mentions the iron gate

Scenario: Walking into something closed
  Given the iron gate is closed
  When the player types "GO E"
  Then they are told the iron gate is closed
  And the reply names the gate, so opening it is an obvious next move
  And they have not moved

Scenario: Opening it
  When the player types "OPEN GATE"
  Then they are told the gate is now open

Scenario: Walking through once it is open
  Given the player has opened the iron gate
  When they type "GO E"
  Then they arrive at the location beyond it

Scenario: It stays open
  Given the player has walked through the open gate
  When they walk back west and then east again
  Then they pass through without opening anything a second time

Scenario: Opening what is already open
  Given the iron gate is open
  When the player types "OPEN GATE"
  Then they are told it is already open

Scenario: Opening something that does not open
  Given the player is in a location with no openable thing
  When they type "OPEN WALL"
  Then they are told that cannot be done here

Scenario: Inspecting a thing
  Given the player is in the location with the iron gate
  When they type "LOOK GATE"
  Then the gate is described
  And the description reflects whether it is open or closed
```

**Out of scope.** Locked things — a lock needs a key, and a key needs a bag. That is slice 4.

**Play it.** Walk into the gate, be refused, open it, walk through, come back, walk through again
without reopening. Then `LOOK` at it and confirm the description changed with its state.

---

[← Slice 1](slice-1-look-around.md) · [All slices](README.md) · [Slice 3 →](slice-3-carry-things.md)
