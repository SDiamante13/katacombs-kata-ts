# Slice 6 — Leave with the score

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to be told what I left with, so that the run had a result.**

```gherkin
Scenario: Quitting reports the score
  Given the player is carrying 70 gold
  When they type "QUIT"
  Then they are told they left with 70 gold
  And the game ends

Scenario: Leaving with nothing
  Given the player is carrying no gold
  When they type "QUIT"
  Then they are told they left with nothing
  And the game ends

Scenario: The score is the gold, not the items
  Given the player is carrying three items and 70 gold
  When they type "QUIT"
  Then the reported score is 70
```

**Out of scope.** A high-score table, a win condition, saving a game.

**Play it.** Play a full run: walk out, collect gold, unlock a door, take the treasure behind it,
quit, and read the score.

---

[← Slice 5](slice-5-collect-the-gold.md) · [All slices](README.md) · [Slice 7 →](slice-7-the-same-game-in-a-browser.md)
