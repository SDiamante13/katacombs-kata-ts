#!/usr/bin/env node
// Stop, for both runtimes: the cheap sensors, the tests, the mutants, then the design gate.
import { requestedScope } from './behavior-sensor.mjs';
import { readHookPayload } from './hook-io.mjs';
import { agentTierFires } from './sensor-tier.mjs';
import { stopAnswer } from './stop-answer.mjs';
import { verdictFor } from './stop-verdict.mjs';

const DISABLED = [
  'sensors: the agent tier is disabled by SENSORS=git, so the behavioral tier did not run',
  'and no design review was asked for. The commit gate repeats the behavioral tier;',
  'nothing repeats the design tier, so this session has none.\n',
].join(' ');

if (!agentTierFires()) {
  process.stderr.write(DISABLED);
  process.exit(0);
}

const payload = await readHookPayload();
const changed = requestedScope([], payload.session_id);
const verdict = verdictFor(changed);

const answer = stopAnswer(payload, changed, verdict);

// systemMessage is not guaranteed to render; stderr is the runtime-agnostic copy.
if (!answer.decision) process.stderr.write(`${verdict.report}\n`);

process.stdout.write(JSON.stringify(answer));
