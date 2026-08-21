#!/usr/bin/env node
// SessionStart for Codex. Records what the worktree already looked like, so the
// first edit of a session is measured against it rather than reported wholesale.
import { readHookPayload } from '../../scripts/hook-io.mjs';
import { baseline } from '../../scripts/worktree-watch.mjs';

const payload = await readHookPayload();

baseline(payload.session_id);
