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

## What it does not check

Two exclusions, both stated here rather than left to be discovered:

- **Changing only a test does not re-mutate the source it covers.** Weakening an assertion in a test
  file will not, by itself, wake this tier — the mutation scope follows changed _source_. Closing it
  needs the module graph, which costs more than it is worth at this size. The commit gate runs
  `npm run check`, and that runs the sensor over everything the commit touches.
- **A `.mjs` file under `src/` is mutated, and the type stage says nothing about its own contents**
  — `tsc` does not check it, though it does check any `.ts` file that imports it. The type stage is
  a whole-program check rather than a per-file one, so it also fails on errors elsewhere in the
  project. That part is deliberate: a program that does not compile is not a program whose tests
  mean anything.

- **`SENSORS=git` switches this tier off entirely** for the agent loop, leaving the commit hook as
  the only gate. The hook says so on stderr when it happens, and `npm run sensors:doctor` reports
  whether that commit hook is actually installed. Treating the environment variable itself as a
  finding belongs to the tamper sensor, which is a separate piece of work — an agent that can set
  `SENSORS` can also edit the config, and one guard for both is better than two half-guards.

- **`SKIP` exits 0, the same as a pass.** Deliberate, and the reason is the commit gate: `npm run
check` runs this sensor, and most commits change no source under `src/`. An exit code that
  distinguished "nothing to check" from "checked and clean" would fail every documentation commit
  in the repository. The distinction is carried in the output instead, where a reader and an agent
  both see it, and the Stop hook forwards it as a `systemMessage`.

And one thing that is checked but not verified end to end: the non-blocking `systemMessage` path is
confirmed to render in Claude Code and **unverified in Codex CLI**. That is why the same findings
also go to stderr.

## Where the Stop hook gets its scope

The per-edit hook records every path it sees into a session ledger. That ledger is **append-only for
the life of the session**, so by the twentieth turn it names every file the session has ever
touched — including files that have since been committed or reverted. Mutating all of them at the
end of every turn makes the end-of-turn cost grow with the session rather than with the change.

So the Stop hook intersects the ledger with what is still dirty in the worktree. The scope is then
bounded by the size of the change, not by how long the session has run, and nothing is lost: a file
that is no longer different from `HEAD` has nothing left to check. If the ledger is empty — the
per-edit hook never fired, or a shell command wrote a file behind its back — the scope falls back to
the dirty worktree, the same fallback the CLI uses.

The ledger stays session-scoped rather than being replaced by the worktree outright, because two
sessions can share one checkout, and one session's Stop hook has no business mutating the other's
work in progress.

## A killed sensor does not kill its mutation run

Stryker is spawned as an ordinary child process, so `SIGKILL` on the sensor leaves it orphaned: it
runs to completion, writes into its own per-pid directory, and is reaped by the next run's sweep.
This is not fixed, and it is worth being explicit about why. `SIGKILL` cannot be trapped, so the
only defence is a process group the killer chooses to signal — which is the caller's decision, not
ours. What the sensor can control it does: the work is per-pid, so an orphan cannot corrupt a later
run's answer, and the sweep means it cannot accumulate either.

## The evasion this tier cannot close

Mutation testing measures the tests against the code that is there. It has nothing to say about code
that is no longer there. So an agent that deletes the branch a surviving mutant landed on gets a
clean PASS, and **the sensor cannot tell that from a legitimate removal of dead code** — because at
the level it operates, there is no difference.

Three things narrow it, and none of them close it:

- The accounting line makes the collapse visible. A file that had thirty mutants last turn and has
  four this turn is saying something, to a reader.
- `no-void` and `no-unused-expressions` close the cheap version, where a parameter is kept alive by
  a statement that computes nothing.
- The other sensors still see the deletion: it is a diff, and the design sensor reviews diffs.

What would actually close it is a check outside this tier — comparing a file's mutant count against
its last recorded one, and treating a large unexplained drop as a finding. That is a different
sensor with a different trigger, and it is not built. **A known hole named in the documentation is a
different thing from a known hole nobody wrote down.**

## No incremental mode

Stryker can cache a previous run and only re-test what changed. It is switched off. A scoped run
takes about five seconds from cold, and an incremental report merges results for files outside the
current scope — so the sensor would report findings about code this change never touched, and
some of them would be stale. Speed we already have is not worth an answer we would have to qualify.

## What it actually costs

Measured, not estimated — five samples for the cheap cases and three for the expensive ones, on an
idle ten-core machine, against the code as it ships:

| Change                               | Mutants | Median |
| ------------------------------------ | ------- | ------ |
| Nothing in scope                     | —       | 0.0s   |
| Refused at the 25-file bound         | —       | 0.1s   |
| Red suite, stops at stage 2          | —       | 0.8s   |
| One function, covered                | 14      | 2.8s   |
| Five functions, covered              | 70      | 4.2s   |
| Twenty functions, barely covered     | 280     | 5.9s   |
| Twenty functions, covered            | 280     | 11.8s  |
| Ten files of five functions, covered | 700     | 24.8s  |

Every row fits **about two seconds fixed plus about 0.03 seconds per covered mutant**, to within a
few percent. The fixed part is the project's own typecheck and test startup rather than anything the
sensor does, so a larger project pays more of it.

Two earlier versions of this page got the cost wrong in opposite directions, which is worth
recording. The first claimed `complexity: 5` bounded the cost; it bounds mutants per _function_, and
a battle-test agent measured that false. The second was measured on a machine that was not idle and
published figures roughly half again too high. The numbers above were taken with the machine quiet
and with enough samples to show the spread — and on a loaded machine, during this repository's own
battle testing, the 700-mutant case ran between 25 and 67 seconds. **Cost claims about a sensor are
themselves a thing to measure repeatedly, because being wrong in either direction gets the sensor
switched off** — too slow and it is a nuisance, too optimistic and the first person to time it stops
believing the rest of the page.

## The evasion this tier cannot close

Mutation testing measures the tests against the code that is there. It has nothing to say about code
that is no longer there. So an agent that deletes the branch a surviving mutant landed on gets a
clean PASS, and **the sensor cannot tell that from a legitimate removal of dead code** — because at
the level it operates, there is no difference.

Three things narrow it, and none of them close it:

- The accounting line makes the collapse visible. A file that had thirty mutants last turn and has
  four this turn is saying something, to a reader.
- `no-void` and `no-unused-expressions` close the cheap version, where a parameter is kept alive by
  a statement that computes nothing.
- The other sensors still see the deletion: it is a diff, and the design sensor reviews diffs.

What would actually close it is a check outside this tier — comparing a file's mutant count against
its last recorded one, and treating a large unexplained drop as a finding. That is a different
sensor with a different trigger, and it is not built. **A known hole named in the documentation is a
different thing from a known hole nobody wrote down.**

## No incremental mode

Stryker can cache a previous run and only re-test what changed. It is switched off. A scoped run
takes about five seconds from cold, and an incremental report merges results for files outside the
current scope — so the sensor would report findings about code this change never touched, and
some of them would be stale. Speed we already have is not worth an answer we would have to qualify.

## What it actually costs

Measured as the median of three runs on an idle ten-core machine, not estimated: 0.06s when nothing
it watches changed, 1.2s stopping at a red suite, 6.0s for one well-covered file, 7.5s for three,
6.7s for ten small ones, 7.9s for a file with 442 mutants of which 429 are uncovered — and **33s for
ten files of five fully-covered functions each, 700 mutants.**

That last row is the one that matters. About four seconds is fixed and the rest scales with the
mutants the tests _cover_, so the cheap-looking rows are cheap because their mutants are uncovered,
not because the tier is fast. A well-covered change is the expensive one.

`complexity: 5` bounds the mutants in a single function and says nothing about how many functions a
change touches, so the structural tier does not bound this tier's cost per turn. An earlier version
of this page claimed it did, and a battle-test agent measured it false. The bounds that do hold are
this tier's own: it refuses past 25 changed source files, and kills the mutation run at 90 seconds.
Those two numbers encode how long a pause you are willing to take, and they are the first thing to
reconsider if you copy this.

## A report path per run

Each run writes its report under `reports/mutation/<pid>/` and only then publishes the HTML to the
stable path. A run that is killed leaves its directory behind, so every run sweeps the directories
whose process is gone before it starts. Stryker's sandbox is told to ignore `.stryker-tmp` and
`reports` explicitly, or a second run would copy a first run's live sandbox into its own and die
when the first one cleaned up. Two sensors racing on one fixed filename is not a theoretical problem in this
repository: it is exactly how the duplication and secret sensors once read each other's answers and
reported PASS on a directory containing a live-looking token. The rule that came out of it holds
here — **a sensor's report belongs to the run that produced it.**
