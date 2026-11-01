import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadStudy, validateStudy } from '../config.mjs';
import { prepareStudy } from '../prepare.mjs';
import { runStudy } from '../run.mjs';
import { aggregate, loadResults, summarizeStudy } from '../summarize.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FAKE_CLAUDE = path.join(here, 'fixtures', 'fake-claude.mjs');
const FAKE_LINT = path.join(here, 'fixtures', 'fake-lint.mjs');
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });

function setup(t, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arb-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const src = path.join(root, 'source');
  fs.mkdirSync(src);
  git(src, 'init', '-q');
  fs.writeFileSync(path.join(src, 'src.ts'), 'export const start = 1;\n');
  git(src, 'add', '-A');
  git(src, 'commit', '-q', '-m', 'init');
  const commit = git(src, 'rev-parse', 'HEAD').stdout.trim();
  const studyDir = path.join(root, 'bench', 'studies', 'demo');
  fs.mkdirSync(path.join(studyDir, 'arms'), { recursive: true });
  fs.writeFileSync(path.join(studyDir, 'arms', 'prose.sh'), 'printf "Never write BAD.\\n" > AGENTS.md\n');
  fs.writeFileSync(path.join(studyDir, 'arms', 'rules.sh'), 'touch .rules\n');
  const study = {
    name: 'demo', repo: { source: src, commit }, workdir: path.join(root, 'work'),
    tasks: [{ id: 'T1', prompt: 'Add an export.' }],
    arms: [{ id: 'prose', setup: 'arms/prose.sh', fix: true }, { id: 'rules', setup: 'arms/rules.sh' }],
    models: ['sonnet'], repeats: 2,
    eval: [{ name: 'fake', format: 'eslint', command: ['node', FAKE_LINT, '{files}'], extensions: ['.ts'] }],
    fix: { prompt: 'Code review feedback: remove BAD.' },
    build: { command: ['node', '-e', "process.exit(require('fs').readFileSync('src.ts','utf8').includes('BAD') ? 1 : 0)"] },
    ...overrides,
  };
  const file = path.join(studyDir, 'study.json');
  fs.writeFileSync(file, JSON.stringify(study, null, 2));
  return { root, src, commit, file };
}

test('validateStudy names every broken field', () => {
  const dir = os.tmpdir();
  const errs = validateStudy({ name: 'Bad Name', repo: { source: 'x' }, tasks: [{ id: 'a-b', prompt: '' }], arms: [{ id: 'p', fix: true, setup: 'missing.sh' }],
    eval: [{ name: 'e', format: 'nope', command: ['x'], extensions: ['ts'] }], repeats: 0, models: ['claude-sonnet'], extra: 1 }, dir).join('\n');
  for (const want of [/unknown key "extra"/, /name must be/, /repo\.commit/, /tasks\[0\]\.id/, /tasks\[0\]\.prompt/, /arms\[0\]\.setup "missing\.sh"/, /no fix\.prompt/, /eval\[0\]\.format/, /eval\[0\]\.command must contain/, /eval\[0\]\.extensions/, /repeats/, /models must be aliases/]) {
    assert.match(errs, want);
  }
});

test('loadStudy fills defaults and resolves paths', (t) => {
  const { file } = setup(t);
  const s = loadStudy(file);
  assert.equal(s.baselineArm, 'prose');
  assert.equal(s.maxTurns, 30);
  assert.ok(path.isAbsolute(s.arms[0].setup));
  assert.equal(s.build.timeoutSec, 600);
});

test('prepare, run, rerun and summarize: end to end with a fake claude', async (t) => {
  const { src, commit, file, root } = setup(t);
  const study = loadStudy(file);
  const logs = [];
  prepareStudy(study, (m) => logs.push(m));
  for (const arm of ['prose', 'rules']) {
    const copy = path.join(root, 'work', arm);
    assert.equal(git(copy, 'remote').stdout.trim(), '');
    assert.equal(git(copy, 'rev-parse', '-q', '--verify', 'bench-base').status, 0);
  }
  assert.ok(fs.existsSync(path.join(root, 'work', 'prose', 'AGENTS.md')));
  prepareStudy(study, (m) => logs.push(m));
  assert.ok(logs.some((m) => /already prepared/.test(m)));

  const results = await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: () => {} });
  assert.equal(results.length, 4);
  const prose = results.filter((r) => r.arm === 'prose');
  const rules = results.filter((r) => r.arm === 'rules');
  for (const r of prose) assert.deepEqual([r.breaksAfterTask, r.fixed, r.breaksFinal, r.fixCost, r.build.ok], [1, true, 0, 0.05, true]);
  for (const r of rules) assert.deepEqual([r.breaksAfterTask, r.fixed, r.breaksFinal, r.fixCost, r.build.ok], [0, false, 0, 0, true]);
  assert.equal(prose[0].byRule['no-bad'], undefined); // fixed at the end
  assert.ok(fs.readFileSync(path.join(study.resultsDir, 'prose-sonnet-T1-1', 'diff.patch'), 'utf8').includes('GOOD'));

  const again = [];
  await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: (m) => again.push(m) });
  assert.match(again[0], /4 runs planned, 4 already done, 0 to run/);

  // a run that failed (for example on a usage limit) is not done: the next run redoes it
  const failed = path.join(study.resultsDir, 'rules-sonnet-T1-2', 'result.json');
  fs.writeFileSync(failed, JSON.stringify({ ...JSON.parse(fs.readFileSync(failed, 'utf8')), ok: false }));
  const retry = [];
  await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: (m) => retry.push(m) });
  assert.match(retry[0], /4 runs planned, 3 already done, 1 to run/);
  assert.equal(JSON.parse(fs.readFileSync(failed, 'utf8')).ok, true);

  const rows = aggregate(loadResults(study.resultsDir));
  const p = rows.find((r) => r.arm === 'prose');
  assert.equal(p.totalCost.toFixed(2), '0.15');
  assert.equal(p.fixSessions, 2);
  const md = summarizeStudy(study, () => {});
  assert.match(md, /\| rules \| sonnet \| 2 \| 2 \| \$0\.100/);
  assert.match(md, /sonnet: rules vs prose: total cost -\$0\.050 \(-33%\)/);
  assert.ok(fs.existsSync(path.join(study.resultsDir, 'runs.csv')));

  assert.equal(git(src, 'status', '--porcelain').stdout, '');
  assert.equal(git(src, 'rev-parse', 'HEAD').stdout.trim(), commit);
});

test('run refuses an arm that was not prepared, and --dry-run plans without running', async (t) => {
  const { file } = setup(t);
  const study = loadStudy(file);
  const logs = [];
  await runStudy(study, { dryRun: true, log: (m) => logs.push(m) });
  assert.match(logs[0], /4 runs planned, 0 already done, 4 to run/);
  await assert.rejects(runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: () => {} }), /not prepared; run "prepare" first/);
});

test('prepare refuses a workdir inside the source repo', (t) => {
  const { file, src } = setup(t, {});
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  raw.workdir = path.join(src, 'work');
  fs.writeFileSync(file, JSON.stringify(raw));
  assert.throws(() => prepareStudy(loadStudy(file), () => {}), /lies inside the source repo/);
});
