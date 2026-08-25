import { readFileSync } from 'node:fs';
import path from 'node:path';

import { TEST_BUDGET } from './behavior-sensor.mjs';
import { MUTATION_BUDGET } from './mutation-run.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

// The Stop tier spends these one after another, so the hook must outlast their sum.
export const STOP_BUDGET = TEST_BUDGET + MUTATION_BUDGET;

const MANIFESTS = ['.claude/settings.json', '.codex/hooks.json'];

function stopTimeoutIn(manifest) {
  const parsed = JSON.parse(readFileSync(path.join(projectRoot, manifest), 'utf8'));
  const [group] = parsed.hooks.Stop;
  const [hook] = group.hooks;

  return hook.timeout;
}

export function stopTimeouts() {
  return MANIFESTS.map((manifest) => ({
    manifest,
    seconds: stopTimeoutIn(manifest),
  }));
}

export function tooTightToReport(timeouts = stopTimeouts()) {
  return timeouts.filter(({ seconds }) => seconds * 1000 <= STOP_BUDGET);
}
