# Slice 5 — Collect the gold

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want the treasure I find to accumulate, so that exploring further is worth
something.**

Gold is not an item. It does not occupy a bag slot and it cannot be dropped — it is a number that
only goes up.

```gherkin
Scenario: Gold in a location is collected on arrival
  Given the Treasury holds 50 gold
  And the player has never been there
  When they enter the Treasury
  Then they are told they collected 50 gold
  And "BAG" reports 50 gold

Scenario: A location's gold is collected once
  Given the player has already collected the Treasury's gold
  When they leave and enter the Treasury again
  Then nothing is said about gold
  And "BAG" still reports 50 gold

Scenario: Gold inside something is collected on opening
  Given the oak chest holds 20 gold and has never been opened
  When the player types "OPEN CHEST"
  Then they are told the chest is open and they collected 20 gold
  And "BAG" reports 20 more gold than before

Scenario: A container's gold is collected once
  Given the player has opened the oak chest
  When they type "OPEN CHEST" again
  Then they are told it is already open
  And no gold is added

Scenario: Gold appears in the bag alongside items
  Given the player is carrying two items and 70 gold
  When they type "BAG"
  Then both items are listed
  And the gold total is reported

Scenario: Gold does not fill the bag
  Given the player is carrying nine items and 70 gold
  When they take a tenth item
  Then it is taken
  And the bag is full only because of the ten items

Scenario: Gold cannot be dropped
  Given the player is carrying 70 gold
  When they type "DROP GOLD"
  Then they are told that cannot be done here
  And the gold total is unchanged
```

**Out of scope.** Scoring. The gold is counted but the game never tells you how you did.

**Play it.** Enter a gold location twice and confirm the second visit is silent. Open a chest with
gold in it. Check the bag.

---

[← Slice 4](slice-4-use-what-you-carry.md) · [All slices](README.md) · [Slice 6 →](slice-6-leave-with-the-score.md)
