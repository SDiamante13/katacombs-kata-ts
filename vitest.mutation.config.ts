import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.mjs'],
    exclude: ['test/sensors/**', 'node_modules/**'],
    environment: 'node',
    // The product's tests are unit tests; a hung one is a finding, not a wait.
    testTimeout: 10_000,
  },
});
