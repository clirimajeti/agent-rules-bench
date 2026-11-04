// Every convention's examples through the study's real ESLint config, so the rule and the files it covers are
// tested together: each valid example gives no finding of that rule, each invalid one exactly that rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { conventions, ruleText } from './conventions.mjs';

const studyDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const eslint = new ESLint({ cwd: studyDir, overrideConfigFile: path.join(studyDir, 'eslint.config.mjs') });
const lint = async (filename, code) => {
  const [r] = await eslint.lintText(code, { filePath: path.join(studyDir, filename) });
  assert.equal(r.messages.filter((m) => m.fatal).length, 0, `parse error in ${filename}: ${r.messages.map((m) => m.message).join('; ')}`);
  return r.messages.map((m) => m.ruleId);
};

test('every convention has a unique id, prose, examples and review text', () => {
  assert.equal(new Set(conventions.map((c) => c.id)).size, conventions.length);
  for (const c of conventions) {
    assert.ok(c.prose && c.valid.length && c.invalid.length, c.id);
    assert.equal(ruleText[`local/${c.id}`], c.prose);
  }
});

for (const c of conventions) {
  test(c.id, async () => {
    for (const v of c.valid) assert.ok(!(await lint(v.filename, v.code)).includes(`local/${c.id}`), `valid example flagged: ${v.code}`);
    for (const v of c.invalid) assert.ok((await lint(v.filename, v.code)).includes(`local/${c.id}`), `invalid example not flagged: ${v.code}`);
  });
}

test('test files and stories are left alone except by the file conventions', async () => {
  const ids = await lint('apps/react-vite/src/features/users/components/__tests__/users-list.test.tsx', "console.log(1);\nconst a: any = 1;");
  assert.deepEqual(ids, []);
});
