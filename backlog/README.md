# Backlog — Katacombs, slice by slice

[README.md](../README.md) has the rules of the game. This file has the order they get built in, and
the acceptance criteria a slice has to satisfy before the next one starts.

Every slice is vertical: a typed command goes in, text comes out, through the terminal. After each
one you can sit down and play. No slice leaves a command half-wired, and no slice leaves a code
path that throws where the player can reach it.

One slice per file, listed below. The rules under the table are shared by all of them.

| #   | Slice                                                          | After it, a player can                                  |
| --- | -------------------------------------------------------------- | ------------------------------------------------------- |
| 0   | [Walk the map](slice-0-walk-the-map.md)                        | move in six directions, see where they are, and leave   |
| 1   | [Look around](slice-1-look-around.md)                          | inspect surroundings without walking into them          |
| 2   | [Open the way through](slice-2-open-the-way-through.md)        | reach places that were shut                             |
| 3   | [Carry things](slice-3-carry-things.md)                        | pick things up, put them down, and check what they hold |
| 4   | [Use what you carry](slice-4-use-what-you-carry.md)            | make something in the world change                      |
| 5   | [Collect the gold](slice-5-collect-the-gold.md)                | accumulate treasure by finding it                       |
| 6   | [Leave with the score](slice-6-leave-with-the-score.md)        | end the game and learn how they did                     |
| 7   | [The same in a browser](slice-7-the-same-game-in-a-browser.md) | play without a terminal                                 |

## What every slice assumes

Location and item names in the slice files are illustrative. Pick your own content when you
build the slice. The invariants are not illustrative — they hold from slice 0 to the end, and each
one is worth a test of its own.

- **Links are two-way and consistent.** If south from A reaches B, north from B reaches A. Stairs
  behave the same: up from A reaches B means down from B reaches A.
- **No two locations share a title.** The title is how a player tells one place from another.
- **A location's description is stable.** Walking back in prints the same description. What may
  differ is what is lying there and what has been opened.
- **A direction with no link is refused, not broken.** The player is told, and stays where they are.

## The four replies

The game has four ways to say no, and they must stay distinguishable. A player who cannot tell
them apart cannot tell a typo from a locked door.

| Situation                                                         | Reply says                    | Arrives in |
| ----------------------------------------------------------------- | ----------------------------- | ---------- |
| The input is not a command at all                                 | it was not understood         | slice 0    |
| The command is real, the target is not interesting                | there is nothing to see there | slice 1    |
| The command is real, this place or this thing does not support it | it cannot be done here        | slice 0    |
| Something is in the way and can be dealt with                     | what is in the way, by name   | slice 2    |

The fourth exists because it is the only one that tells the player what to do next. "The iron gate
is closed" and "You cannot go that way" are different facts, and collapsing them makes the world
unreadable.

## Definition of done

Every slice, without exception:

- The command works from the terminal, not only from a test.
- `?` lists it, and lists nothing the game does not understand.
- Every reply in _The four replies_ that the slice can produce is reachable and distinct.
- `npm run check` is green.
- The inferential design sensor has run for the session, and its findings are acted on or recorded.
