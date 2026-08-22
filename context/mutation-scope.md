# What mutation testing is pointed at, and what it is not

Mutation testing is the only sensor here that costs seconds rather than milliseconds, and the only
one whose cost scales with how much code it is asked to look at. Every choice below is about
keeping that cost proportional to the change, so the sensor can fire at the end of every turn
instead of being something you remember to run.

## Only `src/`

`stryker.config.mjs` mutates `src/**` and nothing else. The tooling in `scripts/` is deliberately
outside it.

That is not an exemption on principle — the tooling has tests, and they are demanding ones. It is
that mutation testing measures assertions, and the sensor tests assert against **processes**: they
spawn a script, read its stdout, and check the verdict. Stryker's per-test coverage analysis cannot
attribute a line executed inside a child process to the test that spawned it, so every mutant in
`scripts/` reports as `NoCoverage` no matter how good the test is. A tier that reports a hundred
findings none of which are true teaches an agent to stop reading it.

If the tooling ever grows a pure core worth mutating, widen the glob to that file — not to the
folder.

## Changed files, not the tree

The Stop hook mutates what the session's ledger says changed, and the CLI falls back to
`git diff HEAD`. A whole-tree run is a different tool with a different trigger; this one has to
finish inside the pause at the end of a turn.

The gap this leaves is honest and worth knowing: **changing only a test does not re-mutate the
source it covers.** Weakening an assertion in a test file will not, by itself, wake this sensor.
Closing that needs the module graph, which costs more than it is worth at this size — the commit
gate runs `npm run check`, and that runs the sensor over everything the commit touches.

## No incremental mode

Stryker can cache a previous run and only re-test what changed. It is switched off. A scoped run
takes about five seconds from cold, and an incremental report merges results for files outside the
current scope — so the sensor would report findings about code this change never touched, and
some of them would be stale. Speed we already have is not worth an answer we would have to qualify.

## A report path per run

Each run writes its report under `reports/mutation/<pid>/` and only then publishes the HTML to the
stable path. Two sensors racing on one fixed filename is not a theoretical problem in this
repository: it is exactly how the duplication and secret sensors once read each other's answers and
reported PASS on a directory containing a live-looking token. The rule that came out of it holds
here — **a sensor's report belongs to the run that produced it.**
