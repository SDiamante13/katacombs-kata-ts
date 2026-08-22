---
name: design-sensor
description: Review this session's changed files against the twelve-question design charter and record the result. Use when the Stop hook reports "SENSOR design: DUE", or when asked for a design review of the current change.
---

# The inferential design sensor

Every other sensor here is a program. This one is you, and you are the only sensor that can invent
its findings — so the charter is closed and the recording is checked.

## Procedure

1. `npm run design:scope` — the brief names the session's changed source and prose.
2. Read `context/design-charter.md` in full. The twelve questions, and what is out of scope.
3. Read every source file the brief lists, plus the modules they touch when placement or
   abstraction is in question, plus the prose it lists for questions 10 to 12.
4. Answer all twelve questions. Most answers are "no", and that is the normal result.
5. Write the findings to `reports/design-findings.json` — at most five, ranked, each citing a
   question by number:

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

6. `npm run design:review -- reports/design-findings.json`

## What the recorder refuses

Every source file in the brief must appear in `files`; a review that skipped a file is not a review
of the change. A finding must cite a real question, name a path that exists, and say all three of
what, why and instead. More than five findings is refused — rank them.

## The empty review is a real answer

`{"files": [...], "findings": []}` ends the gate honestly. Do not invent a finding to look
thorough: a design sensor that always finds something is the slop this charter exists to prevent.
Correctness, style, security, performance and anything a lint rule already decides are out of
scope, and a finding about them is noise even when it is right.
