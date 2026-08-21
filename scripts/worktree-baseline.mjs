#!/usr/bin/env node
// SessionStart, for both runtimes — it needs no translation, because a session
// id is the one thing they agree on. Records what the worktree already looked
// like, so the first edit is measured against it rather than reported wholesale.
import { readHookPayload } from './hook-io.mjs';
import { baseline } from './worktree-watch.mjs';

const payload = await readHookPayload();

baseline(payload.session_id);
