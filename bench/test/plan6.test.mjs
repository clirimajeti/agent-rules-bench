import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { failingTestFiles, holm, parseCsv, csvRow, tost, verifyOkD5, violating, findingKey } from '../plan6.mjs';
import { openedStandards, patchLines, shuffle } from '../plan6-prepare.mjs';

test('Holm adjusts step-down and keeps the order monotone', () => {
  const a = holm({ H12: 0.01, H13: 0.04 });
  assert.equal(a.H12, 0.02); // 2 x 0.01
  assert.equal(a.H13, 0.04); // 1 x 0.04, not below the previous
  assert.equal(holm({ A: 0.03, B: 0.02 }).A, 0.04); // max(2 x 0.02, 1 x 0.03)
});

test('TOST: equivalent only when the 90% interval lies inside the margin', () => {
  const inside = Array.from({ length: 100 }, (_, i) => 0.95 + i * 0.001); // 0.95 .. 1.049
  assert.ok(tost(inside).equivalent);
  assert.equal(tost(inside).p, 0);
  const wide = Array.from({ length: 100 }, (_, i) => 0.8 + i * 0.004); // 0.8 .. 1.196
  assert.ok(!tost(wide).equivalent);
  assert.ok(tost(wide).p > 0.2);
});

test('failing test files are read from both log formats', () => {
  const vitest = '\x1b[31m\x1b[1m\x1b[7m FAIL \x1b[27m\x1b[22m\x1b[39m src/app/__tests__/discussions.test.tsx\x1b[2m > \x1b[22mshould work\n Test Files 1 failed';
  assert.deepEqual(failingTestFiles(vitest), ['src/app/__tests__/discussions.test.tsx']);
  const fb = 'related test files: 67, failing: 2, outside the baseline: 2\n  modules/a/b.test.ts\n  modules/c/d.test.tsx\nWarning: something else\n';
  assert.deepEqual(failingTestFiles(fb), ['modules/a/b.test.ts', 'modules/c/d.test.tsx']);
  assert.deepEqual(failingTestFiles('related test files: 3, failing: 1, outside the baseline: 0\n  modules/x.test.ts\n'), []);
});

test('D5 passes a run only when every failing test file is excluded and the type check passed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan6-'));
  fs.mkdirSync(path.join(dir, 'r1'));
  fs.writeFileSync(path.join(dir, 'r1', 'verify-tests.log'), 'outside the baseline: 1\n  a.test.ts\n');
  const r = { id: 'r1', verify: { ok: false, steps: { typecheck: { ok: true }, tests: { ok: false } } } };
  assert.equal(verifyOkD5(r, dir, ['a.test.ts']), true);
  assert.equal(verifyOkD5(r, dir, ['b.test.ts']), false);
  assert.equal(verifyOkD5({ ...r, verify: { ...r.verify, steps: { typecheck: { ok: false }, tests: { ok: false } } } }, dir, ['a.test.ts']), false);
  assert.equal(verifyOkD5(r, dir, []), false); // nothing excluded: the registered outcome
});

test('a run without non-excluded findings is not violating', () => {
  const r = { study: 's', id: 'r', breaksAfterTask: 1, breaksAfterTaskAt: [{ ruleId: 'local/x', file: 'a.ts', line: 3 }] };
  assert.ok(violating(r));
  assert.ok(!violating(r, new Set([findingKey('s', 'r', r.breaksAfterTaskAt[0])])));
});

test('CSV round-trips quotes, commas and newlines', () => {
  const text = [csvRow(['code', 'note']), csvRow(['X1', 'a, "b"\nc'])].join('\n') + '\n';
  assert.deepEqual(parseCsv(text), [{ code: 'X1', note: 'a, "b"\nc' }]);
});

test('patch lines carry new-file line numbers', () => {
  const patch = 'diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n@@ -1,2 +10,3 @@\n keep\n-old\n+new1\n+new2\n';
  const l = patchLines(patch).get('x.ts');
  assert.deepEqual([...l.keys()], [10, 11, 12]);
  assert.deepEqual(l.get(11), { text: 'new1', added: true });
});

test('shuffle is seeded and opened-standards ignores edits', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4, 5], 7), shuffle([1, 2, 3, 4, 5], 7));
  assert.ok(openedStandards([{ name: 'Read', input: { file_path: '/repo/CODING_STANDARDS.md' } }]));
  assert.ok(!openedStandards([{ name: 'Edit', input: { file_path: '/repo/CODING_STANDARDS.md' } }]));
});

test('finalFiles rebuilds the whole final file from the base and the hunks', async () => {
  const { finalFiles } = await import('../plan6-prepare.mjs');
  const base = 'a\nb\nc\nd\ne\nf\ng\n';
  const patch = 'diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n@@ -2,3 +2,3 @@\n b\n-c\n+C\n d\ndiff --git a/n.ts b/n.ts\n--- /dev/null\n+++ b/n.ts\n@@ -0,0 +1,2 @@\n+one\n+two\n';
  const f = finalFiles(patch, () => base);
  assert.deepEqual([...f.get('x.ts').values()].map((l) => l.text), ['a', 'b', 'C', 'd', 'e', 'f', 'g']);
  assert.equal(f.get('x.ts').get(3).added, true);
  assert.deepEqual([...f.get('n.ts').values()].map((l) => l.text), ['one', 'two']);
});

test('replay lines with a part the Codex log hid match only when the visible parts agree', async () => {
  const { sameLine, claudeCalls } = await import('../plan6-after-task.mjs');
  assert.ok(sameLine('  password: hash(data.newPassword),', '  password: [REDACTED_SECRET]'));
  assert.ok(sameLine('(apiKey: TApiKeyRow) => {', '(apiKey: [REDACTED_SECRET] => {'));
  assert.ok(!sameLine('  name: x,', '  password: [REDACTED_SECRET]'));
  const use = (id) => ({ message: { content: [{ type: 'tool_use', id, name: 'Edit', input: {} }] } });
  const res = (id, is_error) => ({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error }] } });
  assert.deepEqual(claudeCalls([use('a'), use('a'), res('a', false), use('b'), res('b', true)]).map((c) => c.id), ['a']);
});

test('compareDiffs lets a hidden part stand for text over several lines, and nothing else', async () => {
  const { compareDiffs } = await import('../plan6-after-task.mjs');
  const p = (body) => `diff --git a/x.ts b/x.ts\n--- /dev/null\n+++ b/x.ts\n@@ -0,0 +1,${body.length} @@\n${body.map((l) => '+' + l).join('\n')}\n`;
  const real = p(['a', 'const s = gen(', '  32);', 'b']);
  assert.deepEqual(compareDiffs(real, p(['a', 'const s = [REDACTED_SECRET]', 'b']), () => ''), { equal: true, hidden: 1 });
  assert.equal(compareDiffs(real, p(['a', 'const s = [REDACTED_SECRET]', 'c']), () => '').equal, false);
  assert.equal(compareDiffs(real, p(['a', 'b']), () => '').equal, false);
});
