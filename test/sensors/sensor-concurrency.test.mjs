import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { runSensorsAtOnce, scratchSpace } from './sensor-harness.mjs';

const TOKEN = ['ghp', '012345678901234567890123456789abcdxy'].join('_');
const scratch = scratchSpace('sensor-concurrency-');
const ROUNDS = 6;

afterAll(() => scratch.remove());

const BLOCK = [
  'export function describeRoom(room, visited, carrying, lit) {',
  '  const title = lit ? room.title : room.darkTitle;',
  '  const body = visited ? room.shortText : room.longText;',
  '  const exits = room.exits.map((exit) => exit.direction).join(", ");',
  '  const held = carrying.map((item) => item.name).join(", ");',
  '  const lines = [title, body, `Exits: ${exits}`, `Carrying: ${held}`];',
  '  return lines.filter(Boolean).join("\\n");',
  '}',
].join('\n');

function clones(name) {
  const directory = scratch.directory(name);
  writeFileSync(path.join(directory, 'first.ts'), `${BLOCK}\n`);
  writeFileSync(path.join(directory, 'second.ts'), `${BLOCK}\n`);

  return directory;
}

function fixture(name, contents) {
  const directory = scratch.directory(name);
  writeFileSync(path.join(directory, 'config.ts'), contents);

  return directory;
}

// Two sensors sharing one report path read each other's answers.
describe('two sensor runs overlapping', () => {
  it('never lets one run answer for another', async () => {
    const leaky = fixture('leak', `export const t = "${TOKEN}";\n`);
    const clean = fixture('clean', 'export const room = "Vault";\n');
    const rounds = Array.from({ length: ROUNDS }, () => [
      ['scripts/gitleaks-sensor.mjs', leaky],
      ['scripts/gitleaks-sensor.mjs', clean],
    ]);

    for (const pair of rounds) {
      const [leakyRun, cleanRun] = await runSensorsAtOnce(pair);

      expect(leakyRun.output).toContain('SENSOR gitleaks: FAIL');
      expect(cleanRun.output).toContain('SENSOR gitleaks: PASS');
    }
  });

  it('keeps the duplication sensor honest under the same pressure', async () => {
    const cloned = clones('cloned');
    const single = fixture('single', `${BLOCK}\n`);
    const rounds = Array.from({ length: ROUNDS }, () => [
      ['scripts/jscpd-sensor.mjs', cloned],
      ['scripts/jscpd-sensor.mjs', single],
    ]);

    for (const pair of rounds) {
      const [clonedRun, singleRun] = await runSensorsAtOnce(pair);

      expect(clonedRun.output).toContain('SENSOR jscpd: FAIL');
      expect(singleRun.output).toContain('SENSOR jscpd: PASS');
    }
  });
});
