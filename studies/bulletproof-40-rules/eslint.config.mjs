// Checkers for this study, built from plugin/conventions.mjs: each convention is the rule local/<id>, on the
// files it covers. Paths are matched relative to the working directory (the copy root).
import tsParser from '@typescript-eslint/parser';
import local from './plugin/index.js';
import { conventions, TESTS } from './plugin/conventions.mjs';

// Conventions about files and tests apply to test files too; the others leave tests, stories and mocks alone.
const COVERS_TESTS = new Set(['kebab-case-files', 'tests-in-tests-folder', 'mocks-network-delay', 'mocks-persist-db', 'mocks-try-catch']);

export default [
  { files: ['**/src/**/*.{ts,tsx}'], languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { local } },
  ...conventions.map((c) => ({
    files: c.files,
    ignores: [...(c.ignores ?? []), ...(COVERS_TESTS.has(c.id) ? [] : TESTS)],
    rules: { [`local/${c.id}`]: 'error' },
  })),
];
