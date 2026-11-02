// Runs every arm x model x task x repeat as a fresh headless Claude Code session, evaluates the change,
// optionally runs a review-fix session and a build, and writes one result.json per run. Resumable: finished runs are skipped.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { changedLines, onChangedLines, runLinters } from './lib/codemyrules-lib.mjs';
import { copyPath } from './prepare.mjs';
import { assertNoClaudeMemoryAbove } from './config.mjs';

const LOOP_DIR = '.claude/codemyrules';

export function planRuns(study, onlyArms) {
  const arms = study.arms.filter((a) => !onlyArms || onlyArms.includes(a.id));
  const runs = [];
  for (const arm of arms) for (const model of study.models) for (const task of study.tasks) for (let rep = 1; rep <= study.repeats; rep++) {
    const id = `${arm.id}-${model}-${task.id}-${rep}`;
    runs.push({ id, arm, model, task, rep, dir: path.join(study.resultsDir, id) });
  }
  return runs;
}

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

function reset(copy) {
  git(copy, 'reset', '-q', '--hard', 'bench-base');
  git(copy, 'clean', '-qfd');
  const loop = path.join(copy, LOOP_DIR);
  if (fs.existsSync(loop)) for (const f of fs.readdirSync(loop)) if (f === 'failures.log' || /^turn-.*\.txt$/.test(f)) fs.rmSync(path.join(loop, f));
}

function session(study, copy, model, prompt, outBase, claudeCmd) {
  const args = ['-p', prompt, '--output-format', 'json', '--model', model, '--max-turns', String(study.maxTurns),
    '--permission-mode', 'acceptEdits', '--setting-sources', 'project,local', '--allowedTools', study.allowedTools.join(' ')];
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn(claudeCmd[0], [...claudeCmd.slice(1), ...args], { cwd: copy, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '', finished = false;
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const done = (code) => {
      if (finished) return; // 'error' and 'close' can both fire
      finished = true;
      fs.writeFileSync(`${outBase}.json`, out);
      fs.writeFileSync(`${outBase}.stderr`, err);
      let json = null;
      try { json = JSON.parse(out); } catch { /* recorded as failed below */ }
      resolve({ json, code, seconds: Math.round((Date.now() - start) / 1000) });
    };
    child.on('error', (e) => { err += String(e.message); done(-1); });
    child.on('close', done);
  });
}

export function evaluate(study, copy) {
  const changed = changedLines(copy) ?? new Map();
  const files = [...changed.keys()].filter((f) => fs.existsSync(path.join(copy, f)));
  const { findings, notes } = runLinters(copy, study.eval, files, { full: 120000, fast: 120000 });
  const breaks = onChangedLines(findings, changed);
  const byRule = {};
  for (const b of breaks) byRule[b.ruleId] = (byRule[b.ruleId] ?? 0) + 1;
  return { changedFiles: files.length, breaks: breaks.length, byRule, notes, findings: breaks };
}

const usageOf = (j) => {
  const u = j?.usage ?? {};
  return { input: u.input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, output: u.output_tokens ?? 0 };
};

async function runOne(study, run, claudeCmd, log) {
  const copy = copyPath(study, run.arm.id);
  fs.mkdirSync(run.dir, { recursive: true });
  reset(copy);
  const task = await session(study, copy, run.model, run.task.prompt, path.join(run.dir, 'task'), claudeCmd);
  const afterTask = evaluate(study, copy);
  let fix = null;
  if (run.arm.fix && study.fix && afterTask.breaks > 0) fix = await session(study, copy, run.model, study.fix.prompt, path.join(run.dir, 'fix'), claudeCmd);
  const final = fix ? evaluate(study, copy) : afterTask;
  git(copy, 'add', '-N', '.');
  fs.writeFileSync(path.join(run.dir, 'diff.patch'), git(copy, 'diff', 'bench-base').stdout);
  const log_ = path.join(copy, LOOP_DIR, 'failures.log');
  const hookCatches = fs.existsSync(log_) ? fs.readFileSync(log_, 'utf8').split('\n').filter(Boolean).length : 0;
  if (hookCatches) fs.copyFileSync(log_, path.join(run.dir, 'failures.log'));
  let build = null;
  if (study.build) {
    const start = Date.now();
    const r = spawnSync(study.build.command[0], study.build.command.slice(1), { cwd: copy, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: study.build.timeoutSec * 1000, maxBuffer: 1 << 28 });
    fs.writeFileSync(path.join(run.dir, 'build.log'), `${r.stdout ?? ''}${r.stderr ?? ''}`);
    build = { ok: r.status === 0, status: r.status, timedOut: r.error?.code === 'ETIMEDOUT', seconds: Math.round((Date.now() - start) / 1000) };
  }
  const result = {
    id: run.id, arm: run.arm.id, model: run.model, task: run.task.id, rep: run.rep,
    ok: task.json?.is_error === false,
    turns: (task.json?.num_turns ?? 0) + (fix?.json?.num_turns ?? 0),
    taskCost: task.json?.total_cost_usd ?? 0,
    fixCost: fix?.json?.total_cost_usd ?? 0,
    usage: usageOf(task.json),
    fixUsage: fix ? usageOf(fix.json) : null,
    seconds: task.seconds + (fix?.seconds ?? 0),
    fixed: Boolean(fix),
    breaksAfterTask: afterTask.breaks,
    breaksFinal: final.breaks,
    byRule: final.byRule,
    breaksAfterTaskAt: afterTask.findings.map((f) => ({ ruleId: f.ruleId, file: f.file, line: f.line })),
    evalNotes: [...new Set([...afterTask.notes, ...final.notes])],
    changedFiles: final.changedFiles,
    hookCatches,
    build,
  };
  fs.writeFileSync(path.join(run.dir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  log(`${run.id}: ${result.ok ? 'ok' : 'FAILED'}, $${(result.taskCost + result.fixCost).toFixed(3)}, breaks ${result.breaksAfterTask}->${result.breaksFinal}${result.fixed ? ' (fixed)' : ''}${build ? `, build ${build.ok ? 'ok' : 'failed'}` : ''}`);
  return result;
}

// claudeCmd is the command that stands in for `claude`; BENCH_CLAUDE (a single executable path) overrides it.
export async function runStudy(study, { arms: onlyArms, dryRun = false, claudeCmd = [process.env.BENCH_CLAUDE || 'claude'], log = console.log } = {}) {
  const runs = planRuns(study, onlyArms);
  // A failed session (usage limit, crash) is not done: it is run again and its result replaced.
  const done = (r) => { try { return JSON.parse(fs.readFileSync(path.join(r.dir, 'result.json'), 'utf8')).ok === true; } catch { return false; } };
  const todo = runs.filter((r) => !done(r));
  log(`${runs.length} runs planned, ${runs.length - todo.length} already done, ${todo.length} to run`);
  if (dryRun) {
    for (const r of todo) log(`  would run ${r.id}`);
    return [];
  }
  if (todo.length) assertNoClaudeMemoryAbove(study.workdir);
  for (const arm of new Set(todo.map((r) => r.arm.id))) {
    const copy = copyPath(study, arm);
    if (git(copy, 'rev-parse', '-q', '--verify', 'bench-base').status !== 0) throw new Error(`${copy} is not prepared; run "prepare" first`);
  }
  const byArm = new Map();
  for (const r of todo) byArm.set(r.arm.id, [...(byArm.get(r.arm.id) ?? []), r]);
  const results = await Promise.all([...byArm.values()].map(async (list) => {
    const out = [];
    for (const r of list) out.push(await runOne(study, r, claudeCmd, log));
    reset(copyPath(study, list[0].arm.id));
    return out;
  }));
  return results.flat();
}
