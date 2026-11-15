// Runs every arm x model x task x repeat as a fresh headless Claude Code session, evaluates the change,
// optionally runs a review-fix session and a build, and writes one result.json per run. Resumable: finished runs are skipped.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { changedLines, onChangedLines, runLinters } from './lib/codemyrules-lib.mjs';
import { copyPath } from './prepare.mjs';
import { assertNoClaudeMemoryAbove } from './config.mjs';
import { parsePiEvents, piAgentDir, piCommand } from './agents/pi.mjs';
import { codexCommand, codexHome, parseCodexEvents } from './agents/codex.mjs';

const LOOP_DIR = '.claude/codemyrules';

export function planRuns(study, onlyArms, onlyModels) {
  const arms = study.arms.filter((a) => !onlyArms || onlyArms.includes(a.id));
  const models = study.models.filter((m) => !onlyModels || onlyModels.includes(m.id));
  const runs = [];
  const order = [];
  for (const arm of arms) for (const model of models) {
    if (study.sequence) { for (let rep = 1; rep <= study.repeats; rep++) for (const task of study.tasks) order.push([arm, model, task, rep]); }
    else for (const task of study.tasks) for (let rep = 1; rep <= (task.repeats ?? study.repeats); rep++) order.push([arm, model, task, rep]);
  }
  for (const [arm, model, task, rep] of order) {
    const id = `${arm.id}-${model.id}-${task.id}-${rep}`;
    runs.push({ id, arm, model: model.id, spec: model, task, rep, copy: copyPath(study, arm.id, model.agent), dir: path.join(study.resultsDir, id) });
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

// One headless session of the run's agent. The agent's own output is kept (Claude Code: task.json; pi: its event
// stream in task.events.jsonl, reduced to the same result fields in task.json).
function agentProcess(study, spec, prompt, outBase, cmds) {
  if (spec.agent === 'codex') {
    const stateFile = `${outBase}.state.json`;
    fs.rmSync(stateFile, { force: true });
    const home = codexHome(path.join(path.dirname(study.workdir), '.codex-home'), spec);
    const c = codexCommand(study, spec, prompt, { home, stateFile, cmd: cmds.codex });
    const parse = (out) => {
      fs.writeFileSync(`${outBase}.events.jsonl`, out);
      let state = {};
      try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* no tool calls */ }
      return parseCodexEvents(out, state);
    };
    return { ...c, parse, timeoutSec: spec.timeoutSec ?? 3600 };
  }
  if (spec.agent === 'pi') {
    const stateFile = `${outBase}.state.json`;
    fs.rmSync(stateFile, { force: true });
    const agentDir = piAgentDir(path.join(path.dirname(study.workdir), '.pi-agent'), spec);
    const c = piCommand(study, spec, prompt, { agentDir, stateFile, cmd: cmds.pi });
    const parse = (out) => {
      fs.writeFileSync(`${outBase}.events.jsonl`, out);
      let state = {};
      try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* not capped */ }
      return parsePiEvents(out, state);
    };
    return { ...c, parse, timeoutSec: spec.timeoutSec ?? 3600 };
  }
  const args = ['-p', prompt, '--output-format', 'json', '--model', spec.model, '--max-turns', String(spec.maxTurns ?? study.maxTurns),
    '--permission-mode', 'acceptEdits', '--setting-sources', 'project,local', '--allowedTools', study.allowedTools.join(' ')];
  return { cmd: cmds.claude[0], args: [...cmds.claude.slice(1), ...args], env: process.env, parse: (out) => JSON.parse(out), timeoutSec: spec.timeoutSec };
}

function session(study, copy, spec, prompt, outBase, cmds) {
  const p = agentProcess(study, spec, prompt, outBase, cmds);
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn(p.cmd, p.args, { cwd: copy, stdio: ['ignore', 'pipe', 'pipe'], env: p.env });
    let out = '', err = '', finished = false, timedOut = false;
    const timer = p.timeoutSec ? setTimeout(() => { timedOut = true; err += `\nagent-rules-bench: session killed after ${p.timeoutSec}s\n`; child.kill('SIGTERM'); }, p.timeoutSec * 1000) : null;
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const done = (code) => {
      if (finished) return; // 'error' and 'close' can both fire
      finished = true;
      if (timer) clearTimeout(timer);
      let json = null;
      try { json = p.parse(out); } catch { /* recorded as failed below */ }
      fs.writeFileSync(`${outBase}.json`, spec.agent === 'claude' ? out : JSON.stringify(json, null, 2) + '\n');
      fs.writeFileSync(`${outBase}.stderr`, err);
      resolve({ json, code, timedOut, seconds: Math.round((Date.now() - start) / 1000) });
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

// Breaks left after the task that the loop had reported during the session (its failures.log), matched by rule
// and file, since the agent's edits move lines: how often the agent saw a break and left it.
export function ignoredCatches(log, left) {
  const seen = new Set(log.split('\n').filter(Boolean).map((l) => { const e = JSON.parse(l); return `${e.ruleId}|${e.file}`; }));
  return left.filter((b) => seen.has(`${b.ruleId}|${b.file}`)).length;
}

const usageOf = (j) => {
  const u = j?.usage ?? {};
  return { input: u.input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, output: u.output_tokens ?? 0 };
};

// The agent's own cost, or, for an agent that reports none (codex), the tokens at the model's study price.
export function costOf(json, spec) {
  if (!json) return 0;
  if (json.total_cost_usd || !spec.price) return json.total_cost_usd ?? 0;
  const u = usageOf(json);
  return Object.keys(spec.price).reduce((n, k) => n + (u[k] * spec.price[k]) / 1e6, 0);
}

// The model ids the agent reports it used (Claude Code: modelUsage; pi: model), else the configured one.
const modelIdsOf = (json, spec) => (json?.modelUsage ? Object.keys(json.modelUsage) : json?.model ? [json.model] : [spec.model]);

// Seeded shuffle (mulberry32 + Fisher-Yates), so a study's run order is random and reproducible from its seed.
export function shuffle(list, seed) {
  let a = seed >>> 0;
  const rand = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// Versions that can change a result, recorded in every run: the harness commit, Node, and each agent's CLI.
function versionsOf(cmds, agents) {
  const harnessDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const commit = git(harnessDir, 'rev-parse', 'HEAD').stdout.trim() || null;
  const dirty = git(harnessDir, 'status', '--porcelain', '--', 'bench').stdout.trim() !== '';
  const agent = {};
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'arb-version-')); // never inside a copy or the harness
  for (const a of agents) {
    const r = spawnSync(cmds[a][0], [...cmds[a].slice(1), '--version'], { cwd, encoding: 'utf8', timeout: 30000 });
    agent[a] = (r.stdout || r.stderr || '').trim().split('\n')[0] || null;
  }
  fs.rmSync(cwd, { recursive: true, force: true });
  return { harness: commit && (dirty ? `${commit}-dirty` : commit), node: process.version, platform: `${process.platform}-${process.arch}`, agent };
}

// In a sequence study, a chain's later sessions continue on the code of the earlier ones: no reset before them,
// and each session's result is committed, so the checks and the loop count only the lines it added.
// The review names what the task broke: {broken} becomes one line per broken rule, in the words the study's
// ruleText module gives it (the same words as the rule's prose line), so the review is the same in every arm.
export async function fixPrompt(study, findings) {
  if (!study.fix.prompt.includes('{broken}')) return study.fix.prompt;
  const { ruleText = {} } = study.fix.ruleText ? await import(pathToFileURL(study.fix.ruleText).href) : {};
  const lines = [...new Set(findings.map((f) => `- ${ruleText[f.ruleId] ?? f.ruleId}`))];
  return study.fix.prompt.replace('{broken}', lines.join('\n'));
}

// A session that ran out of turns, or was killed at its time limit (a runaway reply), is a result, not a
// failure: rerunning it would resample until one finishes. Both count as capped.
const sessionCapped = (s) => s.json?.subtype === 'error_max_turns' || s.timedOut;
const sessionOk = (s) => s.json?.is_error === false || sessionCapped(s);

async function runOne(study, run, cmds, log, { first = true, versions = null } = {}) {
  const copy = run.copy;
  const startedAt = new Date().toISOString();
  fs.mkdirSync(run.dir, { recursive: true });
  if (first) reset(copy);
  const task = await session(study, copy, run.spec, run.task.prompt, path.join(run.dir, 'task'), cmds);
  const afterTask = evaluate(study, copy);
  let fix = null;
  if (run.arm.fix && study.fix && afterTask.breaks > 0) fix = await session(study, copy, run.spec, await fixPrompt(study, afterTask.findings), path.join(run.dir, 'fix'), cmds);
  const final = fix ? evaluate(study, copy) : afterTask;
  git(copy, 'add', '-N', '.');
  fs.writeFileSync(path.join(run.dir, 'diff.patch'), git(copy, 'diff', 'bench-base').stdout);
  const log_ = path.join(copy, LOOP_DIR, 'failures.log');
  const loopLog = fs.existsSync(log_) ? fs.readFileSync(log_, 'utf8') : '';
  const hookCatches = loopLog.split('\n').filter(Boolean).length;
  if (hookCatches) fs.copyFileSync(log_, path.join(run.dir, 'failures.log'));
  if (hookCatches) fs.rmSync(log_); // each run counts its own catches
  let build = null;
  if (study.build) {
    const start = Date.now();
    const r = spawnSync(study.build.command[0], study.build.command.slice(1), { cwd: copy, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: study.build.timeoutSec * 1000, maxBuffer: 1 << 28 });
    fs.writeFileSync(path.join(run.dir, 'build.log'), `${r.stdout ?? ''}${r.stderr ?? ''}`);
    build = { ok: r.status === 0, status: r.status, timedOut: r.error?.code === 'ETIMEDOUT', seconds: Math.round((Date.now() - start) / 1000) };
  }
  const result = {
    id: run.id, arm: run.arm.id, model: run.model, agent: run.spec.agent, task: run.task.id, rep: run.rep,
    // A session that ran out of turns is a result, not a failure: rerunning it would resample until one finishes.
    // A review fix that failed (for example on a usage limit) fails the run, so it is run again.
    ok: sessionOk(task) && (!fix || sessionOk(fix)),
    capped: sessionCapped(task),
    timedOut: task.timedOut || Boolean(fix?.timedOut),
    turns: (task.json?.num_turns ?? 0) + (fix?.json?.num_turns ?? 0),
    taskCost: costOf(task.json, run.spec),
    fixCost: costOf(fix?.json, run.spec),
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
    ignoredCatches: ignoredCatches(loopLog, afterTask.findings),
    build,
    startedAt,
    modelIds: modelIdsOf(task.json, run.spec),
    versions,
  };
  // A checker that failed after the session leaves the run unmeasured: it is not ok, and the study stops.
  if (result.evalNotes.length) result.ok = false;
  fs.writeFileSync(path.join(run.dir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  if (result.evalNotes.length) throw new Error(`${run.id}: checker failed: ${result.evalNotes[0]}`);
  if (study.sequence) {
    git(copy, 'add', '-A');
    git(copy, '-c', 'user.email=bench@local', '-c', 'user.name=bench', 'commit', '-q', '--allow-empty', '--no-verify', '-m', `bench: after ${run.id}`);
  }
  log(`${run.id}: ${result.ok ? 'ok' : 'FAILED'}, $${(result.taskCost + result.fixCost).toFixed(3)}, breaks ${result.breaksAfterTask}->${result.breaksFinal}${result.fixed ? ' (fixed)' : ''}${build ? `, build ${build.ok ? 'ok' : 'failed'}` : ''}`);
  return result;
}

// claudeCmd, piCmd and codexCmd stand in for the agents; BENCH_CLAUDE, BENCH_PI and BENCH_CODEX (one executable path each) override them.
export async function runStudy(study, { arms: onlyArms, models: onlyModels, dryRun = false, claudeCmd = [process.env.BENCH_CLAUDE || 'claude'], piCmd = [process.env.BENCH_PI || 'pi'], codexCmd = [process.env.BENCH_CODEX || 'codex'], log = console.log } = {}) {
  const cmds = { claude: claudeCmd, pi: piCmd, codex: codexCmd };
  const runs = planRuns(study, onlyArms, onlyModels);
  // A failed session (usage limit, crash) is not done: it is run again and its result replaced.
  const done = (r) => { try { return JSON.parse(fs.readFileSync(path.join(r.dir, 'result.json'), 'utf8')).ok === true; } catch { return false; } };
  // In a sequence study the unit is a chain (arm, model, repeat: every task in order); a chain with any run
  // not done is run again from the start, since its later sessions build on the earlier ones.
  const chainOf = (r) => `${r.arm.id}|${r.model}|${r.rep}`;
  const brokenChains = new Set(runs.filter((r) => !done(r)).map(chainOf));
  const todo = study.sequence ? runs.filter((r) => brokenChains.has(chainOf(r))) : runs.filter((r) => !done(r));
  log(`${runs.length} runs planned, ${runs.length - todo.length} already done, ${todo.length} to run`);
  // The unit of work is a run, or in a sequence study a chain. With a seed the units are shuffled, so the arms
  // interleave in time and no arm gets a time slot or a warm prompt cache of its own; without one they keep
  // the planned order (arm by arm). A unit starts when its copy is free; agents on local models (pi, codex)
  // share one machine's model server, so only one of their units runs at a time.
  const units = [];
  for (const r of todo) {
    const last = units.at(-1);
    if (study.sequence && last && chainOf(last[0]) === chainOf(r)) last.push(r);
    else units.push([r]);
  }
  const queue = study.seed === undefined ? units : shuffle(units, study.seed);
  if (dryRun) {
    for (const r of queue.flat()) log(`  would run ${r.id}`);
    return [];
  }
  if (todo.length) assertNoClaudeMemoryAbove(study.workdir);
  for (const copy of new Set(todo.map((r) => r.copy))) {
    if (git(copy, 'rev-parse', '-q', '--verify', 'bench-base').status !== 0) throw new Error(`${copy} is not prepared; run "prepare" first`);
    // Every checker, and the lint loop of a rules copy, must run before any session does: a checker that fails
    // would count every run as unbroken, and a loop that fails would make the rules arm a no-loop arm.
    const tracked = git(copy, 'ls-files').stdout.split('\n');
    const loopFile = path.join(copy, LOOP_DIR, 'loop.json');
    const loop = fs.existsSync(loopFile) ? JSON.parse(fs.readFileSync(loopFile, 'utf8')).linters ?? [] : [];
    for (const l of [...(study.eval ?? []), ...loop]) {
      const file = tracked.find((f) => l.extensions.includes(path.extname(f)));
      const { notes } = file ? runLinters(copy, [l], [file], { full: 120000, fast: 120000 }) : { notes: [] };
      if (notes.length) throw new Error(`checker failed in ${copy}: ${notes[0]}`);
    }
  }
  const versions = versionsOf(cmds, [...new Set(todo.map((r) => r.spec.agent))]);
  const busy = new Set();
  let localBusy = false;
  const isLocal = (u) => u[0].spec.agent !== 'claude';
  const results = [];
  await new Promise((resolve, reject) => {
    let running = 0;
    const next = () => {
      if (!queue.length && !running) return resolve();
      for (let i = 0; i < queue.length; i++) {
        const u = queue[i];
        if (busy.has(u[0].copy) || (isLocal(u) && localBusy)) continue;
        queue.splice(i--, 1);
        busy.add(u[0].copy);
        if (isLocal(u)) localBusy = true;
        running++;
        (async () => {
          for (const r of u) results.push(await runOne(study, r, cmds, log, { first: !study.sequence || r.task.id === study.tasks[0].id, versions }));
          reset(u[0].copy);
        })().then(() => {
          busy.delete(u[0].copy);
          if (isLocal(u)) localBusy = false;
          running--;
          next();
        }, reject);
      }
    };
    next();
  });
  return results;
}
