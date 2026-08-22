# Context

Everything here answers a question the code cannot.

The code already shows what it does; the tests already show what it must do. So a page here earns
its place only by carrying something neither of them can hold — a constraint imposed from outside,
an alternative tried and rejected, a cost accepted on purpose, an invariant that reads as arbitrary
until you know why, or the intent behind a feature that its implementation cannot state.

**The test, before you write anything:**

> Could a competent reader recover this from the artifact itself?

If yes, do not write it down. A page that restates the code is worse than no page, because it goes
stale silently and no sensor in this repository can tell that it has.

A corollary that catches the common case: **if a test asserts it, the test is the documentation.**
Do not write the same claim twice in a form that cannot fail.

## What is here

| File                                                                       | Answers                                                                                             |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`sensor-triggers.md`](sensor-triggers.md)                                 | Why each sensor fires when it does, and why cheap is not a reason to run something after every edit |
| [`codex-hook-strategy.md`](codex-hook-strategy.md)                         | Why the Codex hook discovers changed files instead of being told them                               |
| [`test-isolation.md`](test-isolation.md)                                   | Why test files do not run in parallel, and what it would take to change that                        |
| [`red-green-and-the-per-edit-tier.md`](red-green-and-the-per-edit-tier.md) | Why the per-edit tier says nothing about unused parameters                                          |
| [`comments.md`](comments.md)                                               | What a comment is allowed to be here, and which half of that a sensor can check                     |

Pages are named for what they explain, not numbered. This is not a decision log — a decision record
is one kind of page here, and feature intent, domain background and hard-won constraints are
others.

## What this is not

Not planning material, not a changelog, and not a tour of the source tree. `docs/` is the published
slide deck and is a different thing entirely.
