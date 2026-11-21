// count-findings runs the study's checkers over a checkout and counts findings per rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { countFindings } from './count-findings.mjs';

test('counts findings and files per rule, and leaves test code out', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-count-'));
  const put = (p, code) => { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), code); };
  put('packages/cli/src/a.ts', 'export const a = b as string;\nexport const c = d as number;\n');
  put('packages/cli/src/b.ts', 'export const e = f as string;\n');
  put('packages/cli/src/a.test.ts', 'export const g = h as string;\n');
  put('packages/nodes-base/nodes/X/X.node.ts', 'export const i: any = 1;\n');
  const counts = await countFindings(dir);
  assert.deepEqual(counts['no-as-cast'], { findings: 3, files: 2 });
  assert.deepEqual(counts['no-any-in-nodes'], { findings: 1, files: 1 });
  assert.deepEqual(counts['node-errors'], { findings: 0, files: 0 });
});
