# Why the test rules pull the opposite way from the source rules

The duplication sensor watches `src/`, `test/` and `scripts/` alike, and the structural thresholds
apply to a test file as they do to anything else. But the _test-design_ rules ask for something the
source rules would call a smell: say it again, in full, in the test.

The argument is Arlo Belshee's, in **"WET: When DRY Doesn't Apply"**
(<https://arlobelshee.com/wet-when-dry-doesnt-apply/> — the site is not always up; what follows is a
paraphrase from the argument as published, not a quotation). It goes roughly:

> Product code is DRY. Test code is **WET** — _write explicit tests_. You should be able to read a
> test method and understand it at exactly the right level of detail **without looking up the
> definition of anything it calls**. That rules out the abstractions you would reach for in
> production code. Two tests that check different boundaries with nearly identical code are not
> duplication worth removing: collapsing them creates one abstraction where the domain has two, and
> the next small insight turns into a large edit across every test that shares it.

## Then why does this repository ask for builders and helpers?

Because the rule is not "no helpers". It is **nothing the test asserts on may be invisible from the
test body.** A helper passes that test when its name says, at the call site, everything the reader
needs:

```ts
givenAppleStockDataIsAvailable();
render(<App />);
await whenUserSelectsApplePreview();
await thenUserSeesWatchlistRow({ symbol: 'AAPL', price: '$145.52' });
```

Nothing there sends you looking. The helper raised the abstraction; it did not hide the setup. Three
things make that work, and all three are house style:

- **Test Data Builders** — `aTraveller().carrying(lamp)` — so the values the assertion depends on are
  named at the point of use and the irrelevant ones are defaults you never read.
- **`given…` / `when…` / `then…` helpers defined in the same file, below the tests.** Same file
  matters: the reader can drop into the definition without leaving the page, and the helper cannot
  drift into being shared by tests with different reasons to change.
- **Hand-rolled Fakes** in `test/fakes/`, which is also why the mocking-library rule exists. A Fake
  you can ask a question — _what did the store end up holding?_ — supports assertions about outcomes.
  A spy only supports assertions about calls.

## What fails the rule

A `beforeEach` that fills a `let` the test then asserts on. That is the Mystery Guest, and it is the
exact thing Belshee's rule forbids: the test cannot be read from its own body, and the value can be
changed by any other test in the file. `sensors/no-mystery-guest` reports it.

So the two directions are not in tension once you say what each is for. **The duplication sensor
objects to the same _decision_ being made twice. The test rules object to a _reader_ having to leave
the test to find out what it means.** Repeating an assertion's setup is not making a decision twice.
