// The per-edit tier's config. It is the whole of eslint.config.mjs plus one
// override, and it exists only because that override has to be scoped to the
// files whose config object defines the @typescript-eslint plugin -- a bare
// --rule flag applies everywhere and fails on files the plugin does not cover.
//
// Nothing else may live here. Every other rule reaches the loop unchanged.
import baseConfig from './eslint.config.mjs';
import { unusedVarsInLoop } from './scripts/eslint-rules/unused-vars.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': unusedVarsInLoop },
  },
];
