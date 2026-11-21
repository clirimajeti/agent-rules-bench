// Checkers for this study, built from plugin/conventions.mjs: each convention is the rule local/<id>, on the
// files it covers. Paths are matched relative to the working directory (the copy root). Tests, stories, mocks
// and Playwright specs are left alone.
import tsParser from '@typescript-eslint/parser';
import json from '@eslint/json';
import local from './plugin/index.js';
import { conventions, LOCALES, TESTS } from './plugin/conventions.mjs';

export default [
  { files: ['apps/web/**/*.{ts,tsx}'], languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { local } },
  { files: LOCALES, language: 'json/json', plugins: { json, local } },
  ...conventions.map((c) => ({
    files: c.files,
    ignores: [...(c.ignores ?? []), ...TESTS],
    rules: { [`local/${c.id}`]: 'error' },
  })),
];
