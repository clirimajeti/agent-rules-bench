// Every convention's examples through the study's real ESLint config, so the rule and the files it covers are
// tested together: each valid example gives no finding of that rule, each invalid one that rule.
// With FORMBRICKS_SRC set to a checkout of the pinned commit, it also checks that every source line is there word for word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { conventions, ruleText } from './conventions.mjs';

const studyDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const eslint = new ESLint({ cwd: studyDir, overrideConfigFile: path.join(studyDir, 'eslint.config.mjs') });
const lint = async (filename, code) => {
  const [r] = await eslint.lintText(code, { filePath: path.join(studyDir, filename) });
  assert.equal(r.messages.filter((m) => m.fatal).length, 0, `parse error in ${filename}: ${r.messages.map((m) => m.message).join('; ')}`);
  return r.messages;
};
const ids = async (filename, code) => (await lint(filename, code)).map((m) => m.ruleId);

test('every convention has a unique id, its source line, examples and review text', () => {
  assert.equal(new Set(conventions.map((c) => c.id)).size, conventions.length);
  for (const c of conventions) {
    assert.ok(c.prose && c.valid.length && c.invalid.length, c.id);
    assert.equal(c.source.line, `- ${c.prose}`);
    assert.equal(ruleText[`local/${c.id}`], c.prose);
  }
});

test('every source line is in the pinned Formbricks docs, once', { skip: !process.env.FORMBRICKS_SRC && 'FORMBRICKS_SRC not set' }, () => {
  for (const c of conventions) {
    const lines = fs.readFileSync(path.join(process.env.FORMBRICKS_SRC, c.source.file), 'utf8').split('\n');
    assert.equal(lines.filter((l) => l === c.source.line).length, 1, `${c.id} in ${c.source.file}`);
  }
});

test('tests and stories are left alone', async () => {
  assert.deepEqual(await ids('apps/web/modules/x/components/a.test.tsx', 'export const A = ({ d }: { d: Date }) => <p>{d.toLocaleDateString()}</p>;'), []);
});

for (const c of conventions) {
  test(c.id, async () => {
    for (const v of c.valid) assert.ok(!(await ids(v.filename, v.code)).includes(`local/${c.id}`), `valid example flagged: ${v.code}`);
    for (const v of c.invalid) {
      const hits = (await lint(v.filename, v.code)).filter((m) => m.ruleId === `local/${c.id}`);
      assert.ok(hits.length, `invalid example not flagged: ${v.code}`);
      // the checkers count only added lines, so the finding must be on the line that breaks the rule
      if (v.line) assert.ok(hits.some((m) => m.line === v.line), `not flagged on line ${v.line}: ${v.code}`);
    }
  });
}
