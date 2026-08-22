export const behavioral = {
  'broken-behavior': [
    'The tests are red. Nothing above this line means anything until they are green — a mutation score over a failing suite is noise, so this tier stops here.',
    'Read the assertion that failed before you touch the code. Either the behaviour regressed, in which case fix the code, or the behaviour changed on purpose, in which case the test is the specification you are updating and it deserves the same care as the change.',
    'Not this: skipping the test, deleting the assertion, or widening it until red turns green. Each one keeps the suite quiet and throws away the only thing that noticed.',
  ],
  'mutant-survived': [
    'A mutant survived: this expression was changed into something with different behaviour, the whole suite ran, and nothing failed. That is a finding about your tests, not your code — some test executes this line and does not care what it produces.',
    'Find the test that covers it and ask what it actually asserts. The usual causes are asserting that a call did not throw, asserting on a shape rather than a value, asserting a substring loose enough to survive the change, or an expectation written after the fact from the output the code happened to produce.',
    'Then assert the behaviour the mutant broke. One example either side of a boundary kills comparison mutants; asserting the whole returned value kills the literal ones. If writing that assertion is awkward, the design is telling you the function returns more than one thing.',
    'Not this: deleting the line the mutant landed on, narrowing the mutator set, or adding a test that repeats an assertion you already have. The mutant is a question about what the code is for — answer it.',
  ],
  'mutant-uncovered': [
    'No test executes this line at all. Mutation testing could not even try, so this is a coverage gap standing in front of an assertion gap.',
    'Write the test that reaches it, and reach it through the public entry point rather than by exporting the private thing so a test can poke it. If the line is genuinely unreachable from outside, that is the finding — delete it, and git will remember.',
    'Not this: a smoke test that calls the function and asserts nothing. That converts a NoCoverage mutant into a Survived one and leaves you exactly as informed as you were.',
  ],
};
