# 3. Test files do not run in parallel

Date: 2026-08-21

## Status

Accepted, reluctantly. Revisit if the suite grows past roughly a minute.

## Context

`vitest.config.ts` sets `fileParallelism: false`. On a suite this size that is a real cost — around
six seconds against four — and it is exactly the kind of setting a later reader will switch back on,
because parallel test files are the correct default for almost every project.

They are not correct for this one, and the reason is not visible from the config.

## Decision

Test files run one at a time.

The sensor tests are not unit tests over pure functions. They spawn the real sensor binaries against
the one real working tree, and several of them **plant deliberately broken files in it** — a
five-parameter function, a directory holding a credential, a clone of an existing file — so that a
sensor has something to find.

Two consequences collide under parallelism. Some sensors scan the whole tree rather than one file
(jscpd must, because duplication is a property of a pair). And the worktree watch answers "what
changed" by looking at `git status`, which sees the entire repository. So a test asserting a clean
result reads another test's planted breakage and fails. Observed rate before the change: roughly one
run in five, on different tests each time.

## Consequences

The suite is about six seconds slower and deterministic. Twenty consecutive runs green, against four
runs producing three distinct failures before.

**A flaky suite is worth less than a slow one here**, because this repository exists to be
demonstrated live. An intermittent red on stage cannot be explained away in the time available.

If you want the parallelism back, the fix is not the flag. It is to stop the tests sharing a working
tree — give each one its own repository fixture — at which point the flag can go.

## The same collision, against a live session

Date: 2026-08-24

Running the files one at a time settles the tests against each other. It does nothing about the
other observer of the same working tree: **the edit sensor firing for a live agent while the suite
runs.**

A nine-hour unattended session measured it. Five of seven blocks that session were not about the
agent's code — three were walls of coaching about `test/scratch/` fixtures, and two were ESLint
crashing with `ENOENT` because a fixture was deleted between enumerating files and reading them.
The agent had to recognise and dismiss every one mid-cycle.

The tempting fix is to exclude `test/scratch/` from the worktree watch. **It is the wrong fix, and
this suite catches it**: two tests plant into that very directory to prove the sensor still sees a
file written by a shell command, which names no path. Excluding the fixture root disables the
capability the fixtures exist to demonstrate. The leak and the capability are one mechanism.

The discriminator is not the path, it is who spawned the hook. A hook the suite spawned inherits
`VITEST` from the runner; a hook a live session spawned does not. So the watch shows fixtures to
the first and hides them from the second, and both keep working.

This is a patch over the shared working tree, not a repair of it. The repair is still the one named
above — give each test its own repository fixture — and it would retire this branch too.
