import { cpus } from 'node:os';

export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.mutation.config.ts' },
  mutate: ['src/**/*.ts', 'src/**/*.mjs'],
  coverageAnalysis: 'perTest',
  concurrency: Math.max(2, cpus().length - 2),
  reporters: ['json', 'html'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  // The sandbox is a file copy, and copyFile cannot copy a symlinked directory.
  ignorePatterns: [
    '.stryker-tmp',
    'reports',
    'capture',
    'docs',
    'context',
    '.agents',
    '.claude',
    '.codex',
  ],
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  logLevel: 'off',
  fileLogLevel: 'off',
  // The sensor decides pass or fail from the surviving mutants, not from a score.
  thresholds: { high: 100, low: 100, break: null },
};
