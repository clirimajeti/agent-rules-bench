// Checkers for this study, built from plugin/conventions.mjs: each convention is the rule local/<id>, on the
// files it covers. Paths are matched relative to the working directory (the copy root). Test code is left alone.
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import local from './plugin/index.js';
import { conventions, TESTS } from './plugin/conventions.mjs';

export default [
  { files: ['**/*.ts'], languageOptions: { parser: tsParser }, plugins: { local } },
  { files: ['**/*.vue'], languageOptions: { parser: vueParser, parserOptions: { parser: tsParser, sourceType: 'module' } }, plugins: { local } },
  ...conventions.map((c) => ({
    files: c.files,
    ignores: [...(c.ignores ?? []), ...TESTS],
    rules: { [`local/${c.id}`]: 'error' },
  })),
];
