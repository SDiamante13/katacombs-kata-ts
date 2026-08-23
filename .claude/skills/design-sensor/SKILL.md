---
name: design-sensor
description: Review the session's changed files against a closed twelve-question design charter — placement, abstraction, naming, test design, comments, documentation — and record the result so the Stop hook's gate is satisfied. Use when the Stop hook reports "SENSOR design: DUE", when asked for a design review of the current change, or when asked to check a change for misplaced responsibilities, semantic duplication, names that lie, or tests that read as transcripts.
---

# The inferential design sensor

Every other sensor in this repository is a program. This one is you, which makes it the only sensor
that can invent its findings. The charter below is therefore closed, and the recorder checks what
you hand it.

## Quick start

```sh
npm run design:scope                      # the brief: what changed, and what to read
npm run design:review -- -                # record the review as JSON on stdin
```

Nothing is written to disk by you. The recorder keeps the report and the receipt.

## Procedure

```
- [ ] 1. Run `npm run design:scope`
- [ ] 2. Read every source file in the brief, and the modules they touch
- [ ] 3. Answer all twelve questions
- [ ] 4. Judge each candidate finding (essential? conformity? cheap tier?)
- [ ] 5. Rank survivors by impact over effort, keep at most five
- [ ] 6. Record with `npm run design:review -- -`
```

Read the brief's prose files too — questions 10 to 12 have nothing to look at otherwise.

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

Answer all twelve. Most answers are "no", and that is the normal result.

## Judging a candidate before you report it

Four tests. A candidate that fails any one of them is not a finding.

**Is it incidental?** Essential complexity is the domain's: rules, invariants, boundaries, required
state transitions. Incidental complexity comes from an implementation choice, and removing it
preserves behavior while clarifying intent. **Only incidental complexity is a finding.** Simplifying
essential complexity changes what the code means.

**Is it conformity?** Code is often awkward because it must match an external API, a schema, a legal
rule, or legacy behavior it cannot change. That is a constraint, not a design failure. If the
awkwardness is imposed from outside, the useful move is to make the constraint visible — not to
report it.

**Is it change pressure?** Branching that exists to hold open an extension point the requirements
are actively moving through is doing its job. Collapsing it is a finding you will regret.

**Would a lint rule decide it?** Then it belongs to the cheap tier. Reporting it here is noise
**even when it is right**, because it teaches the agent that the cheap sensors are optional.

## Ranking

Report highest impact per unit of effort first.

| Effort | Looks like                                    |
| ------ | --------------------------------------------- |
| tiny   | a rename, a guard clause                      |
| small  | splitting one function                        |
| medium | introducing a type, an enum, a dispatch table |
| large  | a module boundary, a state machine            |

Impact is measured in understanding cost: fewer branches to hold in mind, fewer files to open,
fewer states to simulate, an invariant that becomes explicit.

The cap is five because twelve questions times unbounded findings is exactly how a design sensor
becomes the slop it exists to prevent. Five forces the ranking to happen here, where you have the
context, rather than in the reader's head.

## Do not repair while reviewing

Record the review first, then fix what it found. An agent that starts editing mid-review is no
longer reviewing: the code it reports on is not the code it read, and the finding it was halfway
through goes unrecorded.

## The shape the recorder takes

```json
{
  "files": ["src/domain/cave.ts", "test/cave.test.ts"],
  "findings": [
    {
      "question": 6,
      "where": "src/domain/cave.ts:14",
      "what": "Room ids are raw strings, parsed at four call sites.",
      "why": "Every caller repeats the same validation, and none of them agree.",
      "instead": "Introduce a RoomId value object that validates once, at construction."
    }
  ]
}
```

`what` is the observation, `why` is the cost of leaving it, `instead` is the smallest move that
removes the cost. All three are required and all three are checked for substance.

## What the recorder refuses

| Refusal                                       | Because                                                    |
| --------------------------------------------- | ---------------------------------------------------------- |
| a file from the brief missing from `files`    | a review that skipped a file is not a review of the change |
| a finding citing a question outside 1–12      | the charter is closed                                      |
| a finding naming a path that does not exist   | an invented location is an invented finding                |
| `what`, `why` or `instead` empty or too short | a finding you cannot act on is not worth reading           |
| more than five findings                       | rank them                                                  |

A refused review records nothing, so the gate asks again.

## The empty review is a real answer

`{"files": [...], "findings": []}` ends the gate honestly, and it is the common case on a small
change. Do not invent a finding to look thorough. Correctness, style, security and performance are
out of scope entirely — other tiers own them, or nothing does on purpose.

Why the list is closed, and why each exclusion is an exclusion:
[the design charter's argument](../../../context/design-charter.md).
