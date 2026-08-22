import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { runSensorsAtOnce, scratchSpace } from './sensor-harness.mjs';

const TOKEN = ['ghp', '012345678901234567890123456789abcdxy'].join('_');
const scratch = scratchSpace('sensor-concurrency-');
const ROUNDS = [1, 2, 3, 4, 5, 6];

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
  it.each(ROUNDS)('never lets one run answer for another, round %i', async () => {
    const leaky = fixture('leak', `export const t = "${TOKEN}";\n`);
    const clean = fixture('clean', 'export const room = "Vault";\n');
    const [leakyRun, cleanRun] = await runSensorsAtOnce([
      ['scripts/gitleaks-sensor.mjs', leaky],
      ['scripts/gitleaks-sensor.mjs', clean],
    ]);

    expect(leakyRun.output).toContain('SENSOR gitleaks: FAIL');
    expect(cleanRun.output).toContain('SENSOR gitleaks: PASS');
  });

  it.each(ROUNDS)('keeps the duplication sensor honest, round %i', async () => {
    const cloned = clones('cloned');
    const single = fixture('single', `${BLOCK}\n`);
    const [clonedRun, singleRun] = await runSensorsAtOnce([
      ['scripts/jscpd-sensor.mjs', cloned],
      ['scripts/jscpd-sensor.mjs', single],
    ]);

    expect(clonedRun.output).toContain('SENSOR jscpd: FAIL');
    expect(singleRun.output).toContain('SENSOR jscpd: PASS');
  });
});
