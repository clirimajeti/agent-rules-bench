// The two arms on a copy of n8n's instruction files (from N8N_SRC) plus one file that breaks a rule:
// prose changes nothing; rules removes every rule block from every file, adds the pointers, changes no other
// line, and installs a feedback loop whose linter really reports the rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conventions } from './plugin/conventions.mjs';

const studyDir = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.env.N8N_SRC;
const DOCS = ['AGENTS.md', 'CLAUDE.md', 'packages/frontend/AGENTS.md', 'packages/frontend/CLAUDE.md', 'packages/nodes-base/AGENTS.md', 'packages/nodes-base/CLAUDE.md'];
const VIOLATION = 'packages/cli/src/violation.ts';
const sh = (cmd, args, cwd, env = {}) => execFileSync(cmd, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' });

function copy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-arm-'));
  for (const f of DOCS) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.copyFileSync(path.join(SRC, f), path.join(dir, f)); }
  fs.mkdirSync(path.join(dir, path.dirname(VIOLATION)), { recursive: true });
  fs.writeFileSync(path.join(dir, VIOLATION), 'export const a = (b: unknown) => b as string;\n');
  sh('git', ['init', '-q'], dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base'], dir);
  return dir;
}
const runArm = (arm, dir) => sh('bash', [path.join(studyDir, 'arms', `${arm}.sh`)], dir, { BENCH_STUDY_DIR: studyDir, BENCH_COPY: dir, BENCH_ARM: arm });

test('prose: n8n as shipped, nothing changes', { skip: !SRC && 'N8N_SRC not set' }, () => {
  const dir = copy();
  runArm('prose', dir);
  assert.equal(sh('git', ['status', '--porcelain'], dir), '');
});

test('prose: refuses a copy whose CLAUDE.md does not import AGENTS.md', { skip: !SRC && 'N8N_SRC not set' }, () => {
  const dir = copy();
  fs.writeFileSync(path.join(dir, 'packages/nodes-base/CLAUDE.md'), '# nothing\n');
  assert.throws(() => runArm('prose', dir));
});

test('rules: every block gone, pointers added, no other line changed, loop reports the rule', { skip: !SRC && 'N8N_SRC not set' }, () => {
  const dir = copy();
  runArm('rules', dir);
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  for (const c of conventions) for (const s of c.sources) assert.ok(!read(s.file).includes(s.block), `${c.id} still in ${s.file}`);
  for (const c of conventions.filter((x) => x.pointer)) assert.ok(read('AGENTS.md').includes(`- ${c.pointer}`), `pointer of ${c.id}`);

  // removed lines are exactly the blocks' lines; added lines are exactly the pointer section
  const diff = sh('git', ['diff', '-U0', '--', ...DOCS], dir).split('\n');
  const removed = diff.filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1));
  const added = diff.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  const blockLines = conventions.flatMap((c) => c.sources.flatMap((s) => s.block.split('\n')));
  assert.deepEqual([...removed].sort(), [...blockLines].sort());
  const pointers = conventions.filter((c) => c.pointer).map((c) => `- ${c.pointer}`);
  assert.deepEqual(added.filter((l) => l.trim()), ['## Enforced conventions', ...pointers]);

  // the installed loop's linter, exactly as loop.json runs it, finds the break in the violating file
  const loop = JSON.parse(fs.readFileSync(path.join(studyDir, 'arms', 'loop.json'), 'utf8')).linters[0];
  const [cmd, ...args] = loop.command.map((a) => (a === '{files}' ? VIOLATION : a));
  let out;
  try { out = sh(cmd, args, dir); } catch (e) { out = e.stdout; }
  const ids = JSON.parse(out).flatMap((r) => r.messages.map((m) => m.ruleId));
  assert.deepEqual(ids, ['local/no-as-cast']);
  // codemyrules installs its hooks in settings.local.json, which the harness loads (--setting-sources project,local)
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.local.json'), 'utf8'));
  assert.ok(Object.keys(settings.hooks ?? {}).length, 'codemyrules hooks installed');
});
