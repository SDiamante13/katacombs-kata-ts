import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SCRIPT_PATH = /scripts\/[\w-]+\.mjs/g;

function read(file) {
  return readFileSync(path.resolve(file), 'utf8');
}

const scripts = JSON.parse(read('package.json')).scripts;
const perEdit = read('scripts/edit-sensors.mjs');

const sensorScripts = Object.keys(scripts).filter((name) => name.endsWith(':sensor'));

function runsInThePerEditTier(name) {
  return [...scripts[name].matchAll(SCRIPT_PATH)].some(([file]) =>
    perEdit.includes(file),
  );
}

function namedIn(gate, name) {
  return scripts[gate].includes(`npm run ${name}`);
}

describe('no setting of SENSORS may lose a sensor', () => {
  it('has sensors to check, so a rename cannot make this vacuous', () => {
    expect(sensorScripts.length).toBeGreaterThan(3);
  });

  it.each(sensorScripts)('%s runs at the commit gate', (name) => {
    expect(namedIn('check', name)).toBe(true);
  });

  it.each(sensorScripts)('%s runs under SENSORS=agent, or per edit', (name) => {
    expect(namedIn('check:behavioral', name) || runsInThePerEditTier(name)).toBe(true);
  });
});
