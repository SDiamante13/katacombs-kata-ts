import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { guides, kernels } from '../../scripts/sensor-guides.mjs';

const TOKEN = ['ghp', '012345678901234567890123456789abcdxy'].join('_');
const scratch = mkdtempSync(path.join(tmpdir(), 'gitleaks-sensor-'));

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function sensorOn(target) {
  const result = spawnSync(process.execPath, ['scripts/gitleaks-sensor.mjs', target], {
    cwd: path.resolve(),
    encoding: 'utf8',
  });

  return { output: result.stdout, status: result.status };
}

function fixture(name, contents) {
  const directory = mkdtempSync(path.join(scratch, name));
  writeFileSync(path.join(directory, 'config.ts'), contents);

  return directory;
}

describe('the secret sensor', () => {
  it('reports a planted credential and exits non-zero', () => {
    const { output, status } = sensorOn(
      fixture('leak', `export const t = "${TOKEN}";\n`),
    );

    expect(output).toContain('SENSOR gitleaks: FAIL');
    expect(status).toBe(1);
  });

  it('never prints the secret it found', () => {
    const { output } = sensorOn(fixture('redact', `export const t = "${TOKEN}";\n`));

    expect(output).not.toContain(TOKEN);
  });

  it('is not silenced by a gitleaks:allow comment', () => {
    const { output } = sensorOn(
      fixture('allow', `export const t = "${TOKEN}"; // gitleaks:allow\n`),
    );

    expect(output).toContain('SENSOR gitleaks: FAIL');
  });

  it('passes on a tree with no secrets', () => {
    const { output, status } = sensorOn(
      fixture('clean', 'export const room = "Vault";\n'),
    );

    expect(output).toContain('SENSOR gitleaks: PASS');
    expect(status).toBe(0);
  });

  it('coaches the finding', () => {
    expect(guides['leaked-secret']).toContain('Rotate it first');
    expect(kernels['leaked-secret']).toBeTruthy();
  });
});
