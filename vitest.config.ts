import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.mjs'],
    environment: 'node',
    // Sensor tests plant broken files in one shared worktree.
    fileParallelism: false,
  },
});
