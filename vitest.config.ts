import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.mjs'],
    environment: 'node',
    // Sensor tests plant broken files in one shared worktree.
    fileParallelism: false,
    // These tests spawn real linters and mutation runs; 5s is a unit-test budget.
    testTimeout: 30_000,
  },
});
