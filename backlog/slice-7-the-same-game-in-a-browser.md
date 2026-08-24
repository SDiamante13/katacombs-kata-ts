# Slice 7 — The same game in a browser

World invariants, the four refusal replies and the definition of done are shared by every
slice and live in [the backlog index](README.md).

**As a player, I want to play in a browser, so that I do not need a terminal.**

Not a seventh slice of the game — a second adapter over ports that already exist. The domain does
not change, and the test that proves it is that the domain's tests do not change either.

```gherkin
Scenario: The same commands
  Given the game is open in a browser
  When the player types any command from "?"
  Then it behaves exactly as it does in the terminal

Scenario: The same transcript
  Given identical command sequences typed into both adapters
  Then both produce the same text, in the same order

Scenario: Quitting in a browser
  When the player types "QUIT"
  Then the score is reported
  And no further commands are accepted
```

**Play it.** Run the same twenty-command script through the terminal and the browser and diff the
two transcripts.

---

[← Slice 6](slice-6-leave-with-the-score.md) · [All slices](README.md)
