import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { guides, kernels } from '../../scripts/sensor-guides.mjs';
import { runSensor, scratchSpace } from './sensor-harness.mjs';

const scratch = scratchSpace('docs-sensor-');

afterAll(() => scratch.remove());

function sensorOn(markdown) {
  const doc = path.join(scratch.directory('doc'), 'README.md');
  writeFileSync(doc, markdown);

  return runSensor('scripts/docs-sensor.mjs', doc);
}

describe('the documentation sensor', () => {
  it('catches a documented script that does not exist', () => {
    const { output, status } = sensorOn('```sh\nnpm start\n```\n');

    expect(output).toContain('missing-script');
    expect(output).toContain('no "start" script');
    expect(status).toBe(1);
  });

  it('catches a renamed script', () => {
    const { output } = sensorOn('```sh\nnpm run lint:secrets\n```\n');

    expect(output).toContain('missing-script');
  });

  it('does not mistake prose about a command for an instruction', () => {
    const { output } = sensorOn(
      'The sensor checks every `npm start` the docs mention.\n',
    );

    expect(output).toContain('SENSOR docs: PASS');
  });

  it('accepts scripts that really exist', () => {
    const { output, status } = sensorOn('```sh\nnpm run check\nnpm test\n```\n');

    expect(output).toContain('SENSOR docs: PASS');
    expect(status).toBe(0);
  });

  it('does not mistake npm builtins for scripts', () => {
    const { output } = sensorOn('```sh\nnpm install\nnpm ci\n```\n');

    expect(output).toContain('SENSOR docs: PASS');
  });

  it('catches a link to a file that is not there', () => {
    const { output } = sensorOn('See [the guide](GUIDE.md).\n');

    expect(output).toContain('broken-link');
  });

  it('leaves external links and anchors alone', () => {
    const { output } = sensorOn('[site](https://example.com) and [top](#heading)\n');

    expect(output).toContain('SENSOR docs: PASS');
  });

  it('survives a tracked document that has been deleted', () => {
    const gone = path.join(scratch.directory('gone'), 'MISSING.md');
    const { output, status } = runSensor('scripts/docs-sensor.mjs', gone);

    expect(output).toContain('SENSOR docs:');
    expect(status).not.toBe(null);
  });

  it('coaches the finding', () => {
    expect(guides['stale-doc']).toContain('Decide which side is wrong');
    expect(kernels['stale-doc']).toBeTruthy();
  });
});
