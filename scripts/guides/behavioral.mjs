export const behavioral = {
  'sensor-suppression': [
    "This comment does not fix anything. It removes a sensor's ability to say so, silently, for everyone who reads the file afterwards.",
    'Whatever it silences is still true: a surviving mutant still means the assertion is missing, a duplicate is still a second copy, a credential is still in the file. Fix the cause the sensor named.',
    'Not this: switching a sensor off from inside the file it would have reported. If a rule genuinely does not apply here, that is a change to the config, where it can be seen and reviewed — and it needs explicit approval.',
  ],
  'broken-types': [
    'The compiler rejects this code. The tests can still be green while it does — vitest strips types rather than checking them, so a type error sails through a passing suite and surfaces at the build.',
    'Fix it where the type is wrong, not where the error is reported. An error at a call site is usually a signature one file away that no longer says what the function does.',
    'Not this: an `any`, a cast, or a `@ts-expect-error` to get past the gate. Each one moves the failure to somewhere with less information about it.',
  ],
  'mutation-unavailable': [
    'The mutation run did not finish, so nothing here has been checked for weak assertions. This is not a finding about your code.',
    'Read the output below for the cause — a crashed test runner, a sandbox that could not be built, a config that no longer parses. Fix that, then run `npm run behavior:sensor` again.',
    'Not this: treating a sensor that could not run as a sensor with nothing to say.',
  ],
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
