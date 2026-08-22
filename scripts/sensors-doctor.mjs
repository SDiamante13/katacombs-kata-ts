import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { lastSeen } from './sensor-liveness.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

const CODEX_NOTE = [
  'Codex asks for a one-time approval the first time a hook fires. Until you',
  'approve it, nothing runs and nothing says so — no events, no ledger, no error.',
  'Silence before approval is indistinguishable from silence after a clean edit.',
];

const runtimes = [
  {
    key: 'claude',
    name: 'Claude Code',
    manifest: '.claude/settings.json',
    adapter: '.claude/hooks/post-edit-sensor.mjs',
    note: [],
  },
  {
    key: 'codex',
    name: 'Codex CLI',
    manifest: '.codex/hooks.json',
    adapter: '.codex/hooks/post-edit-sensor.mjs',
    note: CODEX_NOTE,
  },
];

function wiredTo(manifest, adapter) {
  const full = path.join(projectRoot, manifest);

  return existsSync(full) && readFileSync(full, 'utf8').includes(adapter);
}

function examine(runtime) {
  return {
    ...runtime,
    wired: wiredTo(runtime.manifest, runtime.adapter),
    installed: existsSync(path.join(projectRoot, runtime.adapter)),
    firedAt: lastSeen(runtime.key),
  };
}

function when(at) {
  return at === null
    ? 'never'
    : new Date(at).toISOString().replace('T', ' ').slice(0, 16);
}

function mark(ok) {
  return ok ? 'ok' : 'MISSING';
}

function describe(state) {
  const lines = [
    `  ${state.name}`,
    `    manifest    ${state.manifest}  ${mark(state.wired)}`,
    `    adapter     ${state.adapter}  ${mark(state.installed)}`,
    `    last fired  ${when(state.firedAt)}`,
  ];
  const explain = state.firedAt === null ? state.note : [];

  return [...lines, ...explain.map((line) => `                ${line}`)].join('\n');
}

function stagedFiles() {
  const staged = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
    },
  );

  return (staged.stdout ?? '').split('\n').filter(Boolean);
}

function oldestStagedAt(files) {
  const times = files
    .map((file) => path.join(projectRoot, file))
    .filter((full) => existsSync(full))
    .map((full) => statSync(full).mtimeMs);

  return times.length === 0 ? null : Math.min(...times);
}

export function agentTierRan(states, files, now = Date.now()) {
  const oldest = oldestStagedAt(files);

  if (oldest === null) return { ok: true, reason: 'nothing staged' };

  const latest = Math.max(...states.map((state) => state.firedAt ?? 0));

  if (latest === 0)
    return { ok: false, reason: 'no runtime has ever fired the per-edit hook' };
  if (latest < oldest)
    return {
      ok: false,
      reason: 'the newest staged file is newer than the last hook run',
    };

  return { ok: true, reason: `last fired ${Math.round((now - latest) / 1000)}s ago` };
}

const states = runtimes.map(examine);

if (process.argv.includes('--assert')) {
  const verdict = agentTierRan(states, stagedFiles());

  if (!verdict.ok) {
    process.stderr.write(
      [
        `SENSORS DOCTOR: ${verdict.reason}.`,
        '',
        '  SENSORS=agent tells the commit gate that the cheap sensors already ran',
        '  inside the agent loop. There is no evidence they did.',
        '',
        '  Run `npm run sensors:doctor` to see which runtime is wired, or unset',
        '  SENSORS so the commit gate runs them itself.',
        '',
      ].join('\n'),
    );
    process.exitCode = 1;
  }
} else {
  const broken = states.filter((state) => !state.wired || !state.installed);

  process.stdout.write(`SENSORS DOCTOR\n\n${states.map(describe).join('\n\n')}\n\n`);
  process.exitCode = broken.length === 0 ? 0 : 1;
}
