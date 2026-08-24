# Slice 1 — Look around

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to see what lies in a direction before I walk into it, so that exploring is
a choice rather than a series of surprises.**

`LOOK <item>` is deliberately absent: there is nothing inspectable in the world until slice 2 puts
a door in it. This slice is directions only.

```gherkin
Scenario: Looking where something lies
  Given the player is in a location whose north exit is described
  When they type "LOOK N"
  Then what lies north is described
  And the player has not moved

Scenario: Looking somewhere uninteresting
  Given the player is in a location with nothing recorded to the west
  When they type "LOOK W"
  Then they are told there is nothing interesting that way
  And this reply differs from the one for a direction they cannot walk

Scenario: Looking with no target
  When the player types "LOOK"
  Then the title and description of the current location are printed again

Scenario: Looking at something that is not a thing
  When the player types "LOOK BANANA"
  Then they are told the input was not understood

Scenario: Looking does not move you
  Given the player is in the Entrance Hall
  When they type "LOOK N" and then "LOOK"
  Then the Entrance Hall is still the location printed
```

**Out of scope.** Inspecting items or doors.

**Play it.** From one location, look in all four directions and confirm you get a described
direction, an uninteresting one, and no movement in either case.

---

[← Slice 0](slice-0-walk-the-map.md) · [All slices](README.md) · [Slice 2 →](slice-2-open-the-way-through.md)
