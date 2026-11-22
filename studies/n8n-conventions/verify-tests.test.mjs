// verify-tests judges a Vitest JSON report: only a failing test file that also fails on the unchanged commit
// (the baseline list, paths from the repo root) is forgiven.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge } from './verify-tests.mjs';

const report = (files) => ({ testResults: files.map(([name, status]) => ({ name: `/repo/${name}`, status })) });

test('a failing file outside the baseline fails verify; a baseline failure does not', () => {
  const base = new Set(['packages/cli/src/a.test.ts']);
  assert.deepEqual(judge(report([['packages/cli/src/a.test.ts', 'failed'], ['packages/cli/src/b.test.ts', 'passed']]), base), { files: 2, failing: 1, fresh: [] });
  assert.deepEqual(judge(report([['packages/nodes-base/nodes/X/x.test.ts', 'failed']]), base).fresh, ['packages/nodes-base/nodes/X/x.test.ts']);
});

// verify.sh dirs: the module folder whose tests verify runs, for each changed file of a package
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const verifySh = fileURLToPath(new URL('./verify.sh', import.meta.url));
const dirs = (pkg, files) => execFileSync('bash', [verifySh, 'dirs', pkg], { input: files.join('\n') + '\n', encoding: 'utf8' }).trim().split('\n');

test('cli: a module file gives its module folder; any other file its own folder', () => {
  assert.deepEqual(dirs('cli', ['src/modules/chat-hub/chat-hub.service.ts', 'src/modules/chat-hub/dto/x.ts', 'src/services/user.service.ts']),
    ['src/modules/chat-hub', 'src/services']);
});

test('nodes-base: a node file gives the node folder', () => {
  assert.deepEqual(dirs('nodes-base', ['nodes/KoBoToolbox/GenericFunctions.ts', 'nodes/KoBoToolbox/SubmissionDescription.ts', 'nodes/Microsoft/Teams/v2/x.ts', 'utils/a.ts']),
    ['nodes/KoBoToolbox', 'nodes/Microsoft', 'utils']);
});
