# Slice 4 — Use what you carry

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to use something I am carrying, so that carrying it was worth the trouble.**

```gherkin
Scenario: Something locked refuses to open
  Given the player is in a location with a locked cell door
  When they type "OPEN DOOR"
  Then they are told it is locked
  And the reply differs from the one for a thing that does not open at all

Scenario: Using the right thing in the right place
  Given the player is carrying the rusted key
  And they are in the location with the locked cell door
  When they type "USE KEY"
  Then they are told the door is unlocked
  And "OPEN DOOR" now opens it

Scenario: Using something you are not carrying
  Given the player is not carrying the rusted key
  When they type "USE KEY"
  Then they are told that cannot be done here

Scenario: Using something where it does nothing
  Given the player is carrying the rusted key
  And they are in a location with nothing to unlock
  When they type "USE KEY"
  Then they are told that cannot be done here
  And nothing in the world has changed

Scenario: Using something twice
  Given the player has already unlocked the cell door
  When they type "USE KEY" again
  Then they are told it is already unlocked
  And the door is still unlocked

Scenario: What is unlocked stays unlocked
  Given the player unlocked the cell door and walked away
  When they return
  Then the door is still unlocked
```

**Out of scope.** Gold. Nothing behind the door is worth points yet.

**Play it.** Find the locked door without the key and be refused. Fetch the key, come back, use it,
open the door, walk through.

---

[← Slice 3](slice-3-carry-things.md) · [All slices](README.md) · [Slice 5 →](slice-5-collect-the-gold.md)
