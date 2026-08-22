# Comments

Date: 2026-08-22

## Status

Accepted. Enforced by `sensors/one-line-comment` and `sensors/no-stale-reference`.

## Context

Comments rot. Nothing compiles them, no test asserts them, and no reviewer diffs them against the
code they describe. A comment is the only artifact in a repository that can be wrong for a year
without anything noticing — and because readers trust prose more than code, a wrong one does more
damage than no comment at all.

Two failures do most of that damage, and both are mechanical enough to detect.

**Length.** A comment that needs a paragraph is a document. Kept here it cannot be linked to, cannot
be found by anyone not already reading this file, and goes stale the first time somebody edits the
code below it without scrolling up.

**Drift.** A comment naming a function that has been renamed is not merely unhelpful. It teaches the
reader that comments in this repository cannot be trusted, which costs you every other comment too.

## Decision

**Prefer the code.** Nine times in ten a comment is a name nobody wrote. Extract Function until the
call site reads as the sentence; Rename until the parameter says what it is; Introduce Parameter
Object until the clump has a noun. Delete the comment and see whether anything is missing.

**What survives that is a why.** A constraint imposed from outside, an alternative rejected, a cost
accepted on purpose. Never a what and never a how — those the code already says, and says more
reliably.

**One line.** If the why fits in a line, keep it there. If it does not, write it in `context/` and
leave a one-line comment pointing at the page. The reasoning gets somewhere it can be linked to and
maintained; the code keeps a pointer that survives.

**Name code in backticks.** `` `likeThis` ``. It costs nothing and it is what lets the sensor check
that the thing still exists.

## Consequences

`sensors/one-line-comment` reports any comment block over one line. Directives — `eslint-*`,
`@ts-*`, `prettier-*` — are exempt, and so is a shebang. Splitting a paragraph into consecutive
one-liners does not work: the rule counts the run, not the line.

`sensors/no-stale-reference` reports a backticked reference that does not resolve. It checks two
things and deliberately nothing else:

| In a comment                                              | Checked against              |
| --------------------------------------------------------- | ---------------------------- |
| `` `camelCase` ``, `` `snake_case` ``, `` `anything()` `` | the identifiers in this file |
| `` `a/path.md` ``                                         | the filesystem               |

A lowercase word in backticks is prose, not a reference, and is ignored — ``the door is `never`
open`` is fine. So is `` `npm run check` ``, which has spaces.

**What neither rule can do is tell a why from a what.** That is judgment, it stays with the design
sensor's charter, and it is the reason the guides for these two rules spend most of their words on
the question the sensors cannot ask.
