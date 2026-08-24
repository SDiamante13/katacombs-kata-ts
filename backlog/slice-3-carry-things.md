# Slice 3 — Carry things

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to pick things up and carry them with me, so that what I find in one place
can matter in another.**

```gherkin
Scenario: Things lying around are announced on arrival
  Given the Guard Room has a rusted key lying in it
  When the player arrives in the Guard Room
  Then the title and description are printed
  And the rusted key is listed beneath them

Scenario: Taking something
  Given the rusted key is lying in the current location
  When the player types "TAKE KEY"
  Then they are told they have taken it
  And arriving in that location again does not list the key

Scenario: What you carry travels with you
  Given the player has taken the rusted key
  When they move to another location
  And they type "BAG"
  Then the rusted key is listed

Scenario: Taking what is not here
  Given there is no lantern in the current location
  When the player types "TAKE LANTERN"
  Then they are told that cannot be done here

Scenario: Dropping something
  Given the player is carrying the rusted key
  When they type "DROP KEY"
  Then they are told they have dropped it
  And the key is listed as lying in the current location
  And it is no longer in the bag

Scenario: Dropping what you do not carry
  Given the player is carrying nothing
  When they type "DROP KEY"
  Then they are told that cannot be done here

Scenario: An empty bag says so
  Given the player is carrying nothing
  When they type "BAG"
  Then they are told the bag is empty

Scenario: The bag holds ten
  Given the player is carrying ten items
  And an eleventh item lies in the current location
  When they type "TAKE" that item
  Then they are told the bag is full
  And the item is still lying in the location
  And the bag still holds exactly ten

Scenario: Inspecting what you carry
  Given the player is carrying the rusted key
  When they type "LOOK KEY"
  Then the key is described, wherever the player is standing
```

**Out of scope.** Using items for anything. A key you can carry but not turn is the whole of this
slice.

**Play it.** Take a key, walk two rooms, check the bag, drop it, walk away, come back, confirm it
is still lying there.

---

[← Slice 2](slice-2-open-the-way-through.md) · [All slices](README.md) · [Slice 4 →](slice-4-use-what-you-carry.md)
