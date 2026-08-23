# Why the design charter is closed, and why each exclusion is an exclusion

The twelve questions themselves are not here. They live in the skill the reviewer actually reads —
[`.claude/skills/design-sensor/SKILL.md`](../.claude/skills/design-sensor/SKILL.md), and its
byte-identical twin under `.codex/`. Repeating them here would be question 12: a document restating
what another artifact already shows, going stale the first time somebody edits one copy.

This page holds the part the skill cannot carry — the argument for why the list looks like that.

## Why a charter at all

Every other sensor in this repository is a program, and a program cannot report a finding it was
not written to find. The inferential tier is a language model reading a diff, so it can produce an
unbounded number of plausible observations about any change, forever, at a cost per run.

Left open, it becomes the slop it exists to prevent. An agent handed twenty vague suggestions learns
to ignore all twenty, and the tier has then made the codebase worse: it consumed budget and taught
the loop that this class of feedback is noise.

So the list is closed, it is short, and it is **enforced** — a finding must cite one of the twelve by
number or `npm run design:review` refuses to record the review at all.

## Why these twelve

Questions 3 and 4 — semantic duplication, and a change that ripples too wide — are the reason this
tier exists at all. A duplication sensor matches tokens, so two functions solving the same problem in
different words are invisible to it. A missing abstraction shows up as a diff that is _wide_ rather
than a file that is _long_, and no per-file threshold can see a shape that only exists across files.
Neither is computable here, and both are ordinary design failures.

Questions 7 and 8 are Michael Feathers' argument in _The Deep Synergy Between Testability and Good
Design_: hard-to-test code is badly designed code, so test pain is a design finding rather than a
testing finding. The computable half of that argument is already six lint rules over `test/**` — see
[`wet-tests.md`](wet-tests.md). What is left here is the half a rule cannot reach: whether the test
describes behavior or narrates the implementation.

Question 9 is the half of the comment rules that stayed judgment; [`comments.md`](comments.md) has
the split. The Documentation group exists because the mechanical documentation sensor sees only
scripts and links: prose that has quietly stopped being true passes it every time. That group earned
its place on the tier's first real run, when it caught `README.md` claiming `npm run check` runs
every sensor — a sentence that had been true until this tier was added, and that no program here
could have flagged, because `check` does exist.

## Why the exclusions are exclusions

Correctness belongs to the tests, style to the linter. Security and performance have no sensor here
at all, and pretending this one covers them would be worse than the gap: a judgment offered outside
its competence reads exactly like a judgment inside it.

The rule that matters most is the one about the cheap tier. **A finding a lint rule could have made
is noise even when it is right**, because acting on it teaches the loop that the millisecond sensors
are optional — and those are the sensors that make this one affordable, since the gate only opens
when they are all green.

## Where the discriminator came from

The four tests the skill applies before reporting anything — is it incidental, is it conformity, is
it change pressure, would a lint rule decide it — are lifted from
`~/.claude/skills/tw-complexity-mitigator`, which frames complexity as _understanding cost_ and
separates essential from incidental before prescribing any move. The middle two are Fred Brooks'
_No Silver Bullet_ categories.

Without that filter the charter is twelve prompts to find something, with no test for whether the
something is worth a reader's attention. With it, most candidates die before they are written down,
which is the behaviour a five-finding cap is trying to buy and cannot buy on its own.

## Why "do not repair while reviewing" is a request and not a wall

Everywhere else in this repository, a rule that matters is enforced by a program. This one is not,
and the reason is a deadlock.

Claude Code can remove tools from a skill's reach with `disallowed-tools`, so the reviewer could be
denied `Edit` and `Write` outright. But the restriction lifts only when the user sends the next
message, and the design review happens _inside_ the turn the Stop hook blocked. An agent that
reviewed, found three things and then could not touch them until the human typed again would be
worse off than one that is merely asked to record first. Codex does not document the field at all,
so enforcing it would also cost the property that both runtimes read the same file.

A stricter version is available and was considered: digest every source file when the hook writes
the request, and refuse to record a review whose files changed underneath it. That is a genuine
wall — a review must describe the code that was there when it was asked for — and it does not stop
the agent editing, only recording a review of its own repairs. It is deferred rather than rejected;
it needs a way to refresh the baseline after a legitimate fix, or the same deadlock reappears one
level down.
