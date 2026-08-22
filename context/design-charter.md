# What the inferential design sensor is allowed to ask

Every other sensor in this repository is a program. This one is a language model reading the diff,
so it is the only sensor that can invent its findings. Without a charter it becomes the slop it
exists to prevent: unbounded questions produce unbounded opinions, and an agent that receives
twenty vague suggestions learns to ignore all of them.

So the charter is fixed, it is short, and it is enforced. A finding must cite one of these twelve
questions by number or `npm run design:review` refuses to record it.

## The twelve questions

**Placement**

1. Does anything sit in the wrong layer or module?
2. Is any module doing two unrelated jobs?

**Abstraction**

3. Is there semantic duplication a token matcher cannot see?
4. Did one change ripple across more files than it should?

**Naming**

5. Does any name lie about what the thing does?
6. Primitive obsession — is there a value object waiting to be born?

**Test design**

7. Do the tests read as a specification of behavior, or as a transcript of the implementation?
8. Is there test pain — heavy setup, fakes that know internals — that is really a design problem?

**Comments**

9. Does any comment explain what the code does instead of why it is that way?

**Documentation**

10. Does anything record a decision whose reason cannot be recovered from the code or the tests?
11. Has any existing document stopped being true?
12. Does any document restate what the code already shows?

## Why these, and not others

Questions 3 and 4 are the whole reason this tier exists. A duplication sensor matches tokens, so
two functions that solve the same problem in different words are invisible to it; a missing
abstraction shows up as a diff that is wide rather than a file that is long. Neither is computable
here, and both are ordinary design failures.

Questions 7 and 8 are Michael Feathers' argument in _The Deep Synergy Between Testability and Good
Design_: hard-to-test code is badly designed code, so test pain is a design finding rather than a
testing finding. The computable half of that argument is already six lint rules over `test/**` — see
[`wet-tests.md`](wet-tests.md). What is left here is the half a rule cannot reach: whether the test
describes behavior or narrates the implementation.

Question 9 is the half of the comment rules that stayed judgment — [`comments.md`](comments.md) has
the split. The Documentation group exists because the mechanical documentation sensor sees only
scripts and links: prose that has quietly stopped being true passes it every time.

## Explicitly out of scope

Correctness, style, security, performance, and anything a computational sensor already covers. If a
lint rule can decide it, this tier must not spend a judgment on it — and if it does, the finding is
noise even when it happens to be right, because it teaches the agent that the cheap sensors are
optional.

The review reads only the session's changed files, in the context of the modules they touch.

## Five findings, ranked

The cap is five, and the review CLI refuses more. Twelve questions times unbounded findings is
exactly how a design sensor turns into the slop it was built to prevent. Five forces the ranking to
happen inside the review, where the reviewer has the context, rather than in the reader's head.

## Where the questions actually live

The list above is prose for a human. The same twelve live in `scripts/design-charter.mjs`, because
the validator needs the ids and the report needs the wording. Two copies of anything drift, so a
test reads this file and asserts that every question here appears in the code, word for word. That
is the same trick the sensor-output examples use: a claim about this repository belongs in a test,
not only in a sentence.
