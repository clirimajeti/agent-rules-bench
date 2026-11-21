// The n8n Enterprise License forbids publishing its files, so no published diff may touch a path with ".ee"
// in a file or folder name. eePaths finds those paths in a unified diff.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eePaths } from './check-ee.mjs';

const header = (p) => `diff --git a/${p} b/${p}\n--- a/${p}\n+++ b/${p}\n@@ -1 +1 @@\n-a\n+b\n`;

test('finds paths with .ee in a file or folder name', () => {
  const patch = header('packages/cli/src/sso.ee/a.ts') + header('packages/cli/src/x.ee.ts') + header('packages/cli/src/free.ts');
  assert.deepEqual(eePaths(patch), ['packages/cli/src/sso.ee/a.ts', 'packages/cli/src/x.ee.ts']);
});

test('a name that only contains "ee" is not an enterprise path', () => {
  assert.deepEqual(eePaths(header('src/needle/a.ts') + header('src/coffee.ts')), []);
});

test('a new file and a deleted file are found too', () => {
  const added = 'diff --git a/a/b.ee/n.ts b/a/b.ee/n.ts\nnew file mode 100644\n--- /dev/null\n+++ b/a/b.ee/n.ts\n';
  assert.deepEqual(eePaths(added), ['a/b.ee/n.ts']);
});
