# Slice 0 — Walk the map

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to move between locations and read where I am, so that the world is
something I can explore rather than a prompt that stares back.**

The walking skeleton. Movement is complete here — all six directions — because a direction is
data, and a game that understands `GO N` but not `GO E` is a half-built parser rather than a thin
slice.

```gherkin
Scenario: Arriving prints the place
  Given the player has started the game
  Then the title of the starting location is printed
  And its description is printed beneath the title

Scenario: Moving by compass direction
  Given the player is in the Entrance Hall, which has an exit north to the Guard Room
  When they type "GO N"
  Then the title and description of the Guard Room are printed

Scenario: Every compass direction works the same way
  Given the player is in a location with an exit <direction>
  When they type "GO <direction>"
  Then they arrive at the location that exit leads to
  Examples: N, E, S, W

Scenario: Stairs work the same way
  Given the player is in a location with stairs down
  When they type "GO DOWN"
  Then they arrive at the location below
  And typing "GO UP" from there returns them to where they started

Scenario: Going back returns you to where you were
  Given the player has moved north from the Entrance Hall
  When they type "GO S"
  Then the Entrance Hall is printed again, with the same description as before

Scenario: A direction with no exit
  Given the player is in a location with no exit east
  When they type "GO E"
  Then they are told they cannot go that way
  And the location is unchanged

Scenario: Commands are case-insensitive
  Given the player is in a location with an exit north
  When they type "go n"
  Then they arrive north, exactly as "GO N" would take them

Scenario: A direction that is not a direction
  When the player types "GO SIDEWAYS"
  Then they are told the input was not understood
  And they have not moved

Scenario: Nonsense
  When the player types "xyzzy"
  Then they are told the input was not understood
  And the game is still accepting commands

Scenario: Asking what the game understands
  When the player types "?"
  Then every command the game currently accepts is listed
  And nothing else is listed

Scenario: Leaving
  When the player types "QUIT"
  Then the game ends
  And the terminal returns to the shell
```

**Out of scope.** Items, gold, doors that must be opened, `LOOK`. Nothing is lying on the floor
yet and nothing can be carried.

**Play it.** Start the game, walk a loop of at least four moves that returns you to the start,
try a direction that does not exist, type `?`, type `QUIT`.

---

[All slices](README.md) · [Slice 1 →](slice-1-look-around.md)
