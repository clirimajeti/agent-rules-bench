// Checkers for this study. Paths are matched relative to the working directory (the copy root).
import tsParser from '@typescript-eslint/parser';
import local from './plugin/index.js';

const NOTIFY = 'Success notifications belong in the mutation hook in the feature\'s api/ folder (call useNotifications there, in onSuccess); feature components must not call useNotifications.';
const SRC = ['**/src/**/*.ts', '**/src/**/*.tsx'];
const TESTS = ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/testing/**'];

export default [
  { files: SRC, languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } }, plugins: { local } },
  {
    files: ['**/src/features/*/components/**/*.ts', '**/src/features/*/components/**/*.tsx'],
    ignores: TESTS,
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['**/components/ui/notifications', '**/components/ui/notifications/*'], importNames: ['useNotifications'], message: NOTIFY }],
      }],
    },
  },
  { files: SRC, ignores: TESTS, rules: { 'local/query-key-from-options': 'error' } },
];
