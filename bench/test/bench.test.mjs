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
import { checkoutPath, verifyStudy } from '../verify.mjs';

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

test('the default workdir lies outside the repo, under BENCH_WORKDIRS when it is set', (t) => {
  const { file } = setup(t);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete raw.workdir;
  fs.writeFileSync(file, JSON.stringify(raw));
  const saved = process.env.BENCH_WORKDIRS;
  t.after(() => { if (saved === undefined) delete process.env.BENCH_WORKDIRS; else process.env.BENCH_WORKDIRS = saved; });
  delete process.env.BENCH_WORKDIRS;
  assert.equal(loadStudy(file).workdir, path.join(os.homedir(), '.cache', 'agent-rules-bench', 'workdirs', 'demo'));
  process.env.BENCH_WORKDIRS = '/somewhere/else';
  assert.equal(loadStudy(file).workdir, path.join('/somewhere/else', 'demo'));
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

test('prepare and run refuse a workdir below a folder with its own CLAUDE.md', async (t) => {
  const { file, root } = setup(t, {});
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.mkdirSync(path.join(root, 'project'));
  fs.writeFileSync(path.join(root, 'project', 'CLAUDE.md'), '# someone else\'s instructions\n');
  raw.workdir = path.join(root, 'project', 'copies');
  fs.writeFileSync(file, JSON.stringify(raw));
  assert.throws(() => prepareStudy(loadStudy(file), () => {}), /CLAUDE\.md.*every session would load it/);
  await assert.rejects(runStudy(loadStudy(file), { claudeCmd: ['node', FAKE_CLAUDE], log: () => {} }), /CLAUDE\.md.*every session would load it/);
});

test('prepare refuses a workdir inside the source repo', (t) => {
  const { file, src } = setup(t, {});
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  raw.workdir = path.join(src, 'work');
  fs.writeFileSync(file, JSON.stringify(raw));
  assert.throws(() => prepareStudy(loadStudy(file), () => {}), /lies inside the source repo/);
});

test('verify applies each diff to the plain upstream commit and runs the steps', async (t) => {
  // "tests" passes only when the agent's export is there and has no BAD; "setup" stands for installing dependencies.
  const check = "const s = require('fs').readFileSync('src.ts', 'utf8'); process.exit(s.includes('added') && !s.includes('BAD') && !require('fs').existsSync('stale') && !require('fs').existsSync('own.test') ? 0 : 1)";
  const verify = { keep: ['deps'], steps: [
    { name: 'setup', setup: true, command: ['node', '-e', "require('fs').mkdirSync('deps', { recursive: true }); require('fs').writeFileSync('stale', '')"] },
    { name: 'clean', command: ['node', '-e', "require('fs').rmSync('stale'); process.exit(require('fs').existsSync('deps') ? 0 : 1)"] },
    { name: 'tests', command: ['node', '-e', check] },
  ] };
  const { file } = setup(t, { verify });
  const study = loadStudy(file);
  prepareStudy(study, () => {});
  await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: () => {} });

  // one run also edited the arm's own docs, which upstream does not have: excluded from the patch
  const docs = path.join(study.resultsDir, 'prose-sonnet-T1-1', 'diff.patch');
  fs.appendFileSync(docs, 'diff --git a/AGENTS.md b/AGENTS.md\n--- a/AGENTS.md\n+++ b/AGENTS.md\n@@ -1 +1,2 @@\n Never write BAD.\n+Notes.\n');
  // one run left a break in its final code
  const broken = path.join(study.resultsDir, 'rules-sonnet-T1-2', 'diff.patch');
  fs.writeFileSync(broken, fs.readFileSync(broken, 'utf8').replace('GOOD', 'BAD'));

  const outs = verifyStudy(study, { log: () => {} });
  assert.equal(outs.length, 4);
  const v = (id) => JSON.parse(fs.readFileSync(path.join(study.resultsDir, id, 'verify.json'), 'utf8'));
  assert.deepEqual([v('prose-sonnet-T1-1').patchApplied, v('prose-sonnet-T1-1').ok], [true, true]);
  assert.equal(v('rules-sonnet-T1-2').steps.tests.ok, false);
  assert.ok(fs.existsSync(path.join(study.resultsDir, 'rules-sonnet-T1-2', 'verify-tests.log')));
  assert.match(summarizeStudy(study, () => {}), /\| rules \| sonnet \|.*\| clean 2\/2, tests 1\/2 \|/);

  const again = [];
  verifyStudy(study, { log: (m) => again.push(m) });
  assert.match(again[0], /0 runs to verify/);

  // a patch that does not apply fails every step without running it
  fs.writeFileSync(broken, 'diff --git a/src.ts b/src.ts\n--- a/src.ts\n+++ b/src.ts\n@@ -1 +1 @@\n-not there\n+x\n');
  verifyStudy(study, { arms: ['rules'], rerun: true, log: () => {} });
  assert.deepEqual([v('rules-sonnet-T1-2').patchApplied, v('rules-sonnet-T1-2').steps.tests.skipped], [false, true]);

  // a run whose own new test fails, while its production code passes the original suite
  const ownTest = path.join(study.resultsDir, 'rules-sonnet-T1-1', 'diff.patch');
  fs.appendFileSync(ownTest, 'diff --git a/own.test b/own.test\nnew file mode 100644\n--- /dev/null\n+++ b/own.test\n@@ -0,0 +1 @@\n+own test\n');
  const withTests = { ...study, verify: { ...study.verify, testFiles: ['*.test'] } };
  verifyStudy(withTests, { arms: ['rules'], rerun: true, log: () => {} });
  assert.deepEqual([v('rules-sonnet-T1-1').ok, v('rules-sonnet-T1-1').withoutOwnTests.ok], [false, true]);
  assert.equal(v('rules-sonnet-T1-2').withoutOwnTests, undefined); // the patch did not apply: nothing to compare
  const failedOnly = [];
  verifyStudy(withTests, { failed: true, log: (m) => failedOnly.push(m) });
  assert.match(failedOnly[0], /^2 runs to verify/);
  assert.match(summarizeStudy(study, () => {}), /\| rules \| sonnet \|.*code without own tests 1\/2/);

  // a step that passes only on a retry counts as passed and is marked flaky
  const flakyStudy = { ...study, verify: { ...study.verify, steps: [{ name: 'tests', command: ['node', '-e', "const f = 'deps/tries'; const n = require('fs').existsSync(f) ? 1 : 0; require('fs').writeFileSync(f, ''); process.exit(n ? 0 : 1)"], cwd: '.', timeoutSec: 60, retries: 1, setup: false }] } };
  fs.mkdirSync(path.join(checkoutPath(study), 'deps'), { recursive: true });
  verifyStudy(flakyStudy, { arms: ['prose'], rerun: true, log: () => {} });
  fs.rmSync(path.join(checkoutPath(study), 'deps'), { recursive: true });
  assert.deepEqual([v('prose-sonnet-T1-1').ok, v('prose-sonnet-T1-1').steps.tests.flaky], [true, true]);
  assert.match(summarizeStudy(study, () => {}), /\| prose \| sonnet \|.*tests 2\/2, flaky 1/);

  // a failing setup step is an environment problem, not the agent's: verify stops
  const bad = { ...study, verify: { ...study.verify, steps: [{ ...study.verify.steps[0], command: ['node', '-e', 'process.exit(3)'] }, study.verify.steps[2]] } };
  assert.throws(() => verifyStudy(bad, { rerun: true, log: () => {} }), /setup step "setup" failed/);
  assert.ok(fs.existsSync(checkoutPath(study)));
});

test('validateStudy checks the verify section', () => {
  const base = { name: 'x', repo: { source: 'x', commit: 'y' }, tasks: [{ id: 'T', prompt: 'p' }], arms: [{ id: 'a' }], eval: [{ name: 'e', format: 'eslint', command: ['x', '{files}'], extensions: ['.ts'] }] };
  const errs = validateStudy({ ...base, verify: { keep: 'deps', steps: [{ name: 'a-b', command: [], cwd: '../up', setup: 1 }, { name: 'ok', command: ['x'], setup: true }] } }, os.tmpdir()).join('\n');
  for (const want of [/verify\.steps\[0\]\.name/, /verify\.steps\[0\]\.command/, /verify\.steps\[0\]\.cwd/, /verify\.steps\[0\]\.setup/, /verify\.keep/]) assert.match(errs, want);
  assert.match(validateStudy({ ...base, verify: { steps: [{ name: 's', command: ['x'], setup: true }] } }, os.tmpdir()).join('\n'), /only setup steps/);
});

test('sequence: a chain continues on its own code, counts each session\'s own lines, and reruns whole', async (t) => {
  const { file } = setup(t, {
    sequence: true, repeats: 2, build: undefined,
    tasks: [{ id: 'T1', prompt: 'Add an export.' }, { id: 'T2', prompt: 'Add another export.' }],
    arms: [{ id: 'prose', setup: 'arms/prose.sh' }],
  });
  const study = loadStudy(file);
  prepareStudy(study, () => {});
  const results = await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: () => {} });
  assert.deepEqual(results.map((r) => r.id), ['prose-sonnet-T1-1', 'prose-sonnet-T2-1', 'prose-sonnet-T1-2', 'prose-sonnet-T2-2']);
  // T2 continues on T1's code: its diff holds both sessions' lines, but only its own line counts as its break
  const t2 = results.find((r) => r.id === 'prose-sonnet-T2-1');
  assert.equal(t2.breaksAfterTask, 1);
  const added = fs.readFileSync(path.join(study.resultsDir, 'prose-sonnet-T2-1', 'diff.patch'), 'utf8').split('\n').filter((l) => l.startsWith('+export const added'));
  assert.equal(added.length, 2);
  // a failed run reruns its whole chain, and only that chain
  const failed = path.join(study.resultsDir, 'prose-sonnet-T2-2', 'result.json');
  fs.writeFileSync(failed, JSON.stringify({ ...JSON.parse(fs.readFileSync(failed, 'utf8')), ok: false }));
  const logs = [];
  await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], log: (m) => logs.push(m) });
  assert.match(logs[0], /4 runs planned, 2 already done, 2 to run/); // the chain's finished T1 runs again too
  assert.deepEqual(logs.slice(1).map((m) => m.split(':')[0]), ['prose-sonnet-T1-2', 'prose-sonnet-T2-2']);
});

test('pi agent: its own copy and setup, isolated flags, and its events read as a result', async (t) => {
  const { root, file } = setup(t, {
    models: ['sonnet', { id: 'local', agent: 'pi', model: 'ollama/qwen3.6:35b-a3b-coding' }], repeats: 1, build: undefined,
    arms: [{ id: 'prose', setup: 'arms/prose.sh', fix: true }],
  });
  fs.appendFileSync(path.join(path.dirname(file), 'arms', 'prose.sh'), 'printf "%s" "$BENCH_AGENT" > agent.txt\n');
  const study = loadStudy(file);
  prepareStudy(study, () => {});
  assert.equal(fs.readFileSync(path.join(root, 'work', 'prose', 'agent.txt'), 'utf8'), 'claude');
  assert.equal(fs.readFileSync(path.join(root, 'work', 'prose.pi', 'agent.txt'), 'utf8'), 'pi');

  const log = path.join(root, 'pi.log');
  process.env.FAKE_PI_LOG = log;
  t.after(() => { delete process.env.FAKE_PI_LOG; });
  const results = await runStudy(study, { claudeCmd: ['node', FAKE_CLAUDE], piCmd: ['node', path.join(here, 'fixtures', 'fake-pi.mjs')], log: () => {} });
  const pi = results.find((r) => r.model === 'local');
  assert.deepEqual([pi.ok, pi.agent, pi.turns, pi.breaksAfterTask, pi.fixed, pi.breaksFinal], [true, 'pi', 4, 1, true, 0]); // 2 turns task + 2 fix
  assert.deepEqual(pi.usage, { input: 200, cacheWrite: 0, cacheRead: 2000, output: 30 });
  assert.ok(fs.existsSync(path.join(study.resultsDir, 'prose-local-T1-1', 'task.events.jsonl')));
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls[0].cwd, fs.realpathSync(path.join(root, 'work', 'prose.pi')));
  for (const flag of ['--no-session', '--no-skills', '--no-extensions', '--no-mcp', '--no-approve', '-e']) assert.ok(calls[0].argv.includes(flag), flag);
  assert.equal(calls[0].argv[calls[0].argv.indexOf('--tools') + 1], 'read,edit,write,find,grep,ls'); // no shell
  assert.equal(calls[0].maxTurns, '30');
  assert.match(fs.readFileSync(path.join(calls[0].agentDir, 'models.json'), 'utf8'), /"qwen3\.6:35b-a3b-coding"/);
  assert.ok(results.find((r) => r.model === 'sonnet').ok); // the Claude runs are unaffected
});

test('pi: a capped run is an error, and edits map to the hook input the loop scripts read', async () => {
  const { parsePiEvents } = await import('../agents/pi.mjs');
  const { hookInput } = await import('../agents/pi-loop.mjs');
  const settled = ['{"type":"message_end","message":{"role":"assistant","stopReason":"stop","usage":{"input":1,"output":2}}}', '{"type":"turn_end"}', '{"type":"agent_settled"}'].join('\n');
  assert.equal(parsePiEvents(settled).is_error, false);
  assert.deepEqual([parsePiEvents(settled, { capped: true }).is_error, parsePiEvents(settled, { capped: true }).subtype], [true, 'error_max_turns']);
  assert.equal(parsePiEvents(settled.split('\n').slice(0, 2).join('\n')).is_error, true); // never settled
  assert.deepEqual(hookInput('edit', { path: 'a.ts', edits: [{ oldText: 'x', newText: 'y' }] }), { tool_name: 'MultiEdit', tool_input: { file_path: 'a.ts', edits: [{ old_string: 'x', new_string: 'y' }] } });
  assert.deepEqual(hookInput('write', { path: 'a.ts', content: 'c' }), { tool_name: 'Write', tool_input: { file_path: 'a.ts', content: 'c' } });
  assert.equal(hookInput('read', { path: 'a.ts' }), null);
});
