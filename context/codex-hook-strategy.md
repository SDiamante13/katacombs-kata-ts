# 2. The Codex hook watches the worktree instead of reading a file path

Date: 2026-08-21

## Status

Accepted. Supersedes nothing. The Claude Code adapter later adopted the same strategy — see
Consequences.

## Context

The per-edit hook needs to know which files just changed.

Claude Code says so directly: its `PostToolUse` payload carries `tool_input.file_path`. Codex does
not, and cannot. Its `PostToolUse` event matches **shell commands only**, because as far as Codex is
concerned the agent ran `apply_patch`, not `Edit`. There is no file path in the payload to read.

This constraint is invisible in the source. `scripts/worktree-watch.mjs` reads as an elaborate way
to answer a question `tool_input.file_path` answers in one line, and a reasonable person would
delete it.

## Decision

The Codex adapter discovers changed files rather than being told them. It keeps a snapshot of
`git status --porcelain --untracked-files=all` paired with modification times, and treats every path
whose stamp moved as changed. A `SessionStart` hook takes the first snapshot, so the session's
opening state is never mistaken for an edit.

## Consequences

The strategy is strictly more general than reading a path, and that turned out to matter. An agent
does not need an edit tool to write a file — `sed -i`, a heredoc and a `python3 -` one-liner all
write, and none of them produce a `file_path`. The Claude Code hook, matched only on the edit tools,
missed every one of them; it fired **zero times** during its own construction, which was done
entirely through shell commands. Adding `Bash` to the matcher gives that hook the chance to look,
and the worktree watch is what gives it something to look at.

**Both halves are required.** Matching `Bash` without the worktree watch produces a hook that fires
on every command and sees nothing — instrumented-looking and blind, which is worse than not matching
`Bash` at all.

The cost is a `git status` per tool call, in the low single-digit milliseconds, and the limitation
is that changes to git-ignored files are invisible on the shell path.
