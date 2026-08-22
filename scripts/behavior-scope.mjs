import { existsSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

const MUTATED_ROOT = 'src';
const SOURCE = /\.(ts|mjs|js)$/;
const TEST = /\.test\.(ts|mjs|js)$/;

function normalise(files) {
  return [...new Set(files.map((file) => file.split(path.sep).join('/')))].filter(
    (file) => SOURCE.test(file),
  );
}

export function present(files) {
  return files.filter((file) => existsSync(path.join(projectRoot, file)));
}

export function isMutated(file) {
  return file.startsWith(`${MUTATED_ROOT}/`) && !TEST.test(file);
}

export function mutationScope(files) {
  return normalise(files).filter(isMutated);
}

export function testScope(files) {
  return normalise(files).filter((file) => TEST.test(file) || isMutated(file));
}
