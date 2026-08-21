import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.mjs'],
    environment: 'node',
    // The sensor tests drive real sensor processes against one working tree, and
    // some of them plant deliberately broken files in it. Run in parallel they
    // read each other's fixtures.
    fileParallelism: false,
  },
});
