// The per-edit tier's config. It is the whole of eslint.config.mjs plus one
// override, and it exists only because that override has to be scoped to the
// files whose config object defines the @typescript-eslint plugin -- a bare
// --rule flag applies everywhere and fails on files the plugin does not cover.
//
// Nothing else may live here. Every other rule reaches the loop unchanged.
import baseConfig from './eslint.config.mjs';
import { unusedVarsInLoop } from './scripts/eslint-rules/unused-vars.mjs';

// Two blocks because two rule ids: TypeScript files get no-unused-vars from
// the typescript-eslint plugin, .mjs files get it from base ESLint. Widening
// the first block's glob to cover .mjs fails with "could not find plugin",
// which is the same mistake as passing --rule -- the rule has to be applied in
// a block whose files the plugin actually covers.
//
// `unusedVarsInLoop` serves both: args: 'none' means the same to either rule.
//
// Scoped to where test-driven code lives rather than to **/*.mjs, so a config
// file at the root does not inherit the relaxation.
export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: { '@typescript-eslint/no-unused-vars': unusedVarsInLoop },
  },
  {
    files: ['src/**/*.mjs', 'test/**/*.mjs', 'scripts/**/*.mjs'],
    rules: { 'no-unused-vars': unusedVarsInLoop },
  },
];
