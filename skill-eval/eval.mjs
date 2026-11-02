#!/usr/bin/env node
// Runs the codemyrules skill once per target project and keeps everything it produced, for scoring
// against expected.json. Usage:
//   node skill-eval/eval.mjs prepare            fresh copies (buried-prose docs + the three skills), tagged bench-base
//   node skill-eval/eval.mjs run [--model m]    one headless codemyrules session per copy not yet done
//   node skill-eval/eval.mjs run --resume       continue failed sessions (usage limit) on their copies as they are
//   node skill-eval/eval.mjs status             what is prepared and what is done
// Results go to skill-eval/results/<target>/: session.json, changes.patch (all tracked and new files),
// claude/ (the git-excluded loop files and settings), codemyrules-report.md.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStudy } from '../bench/config.mjs';
import { prepareStudy } from '../bench/prepare.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(here);
const targets = JSON.parse(fs.readFileSync(path.join(here, 'targets.json'), 'utf8'));
const copyOf = (t) => path.join(repoRoot, 'workdirs', 'skill-eval', t.name, 'skill');
const resultsOf = (t) => path.join(here, 'results', t.name);
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
const TOOLS = ['Skill', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash', 'TodoWrite'];

const done = (t) => {
  try { return JSON.parse(fs.readFileSync(path.join(resultsOf(t), 'session.json'), 'utf8')).is_error === false; } catch { return false; }
};

function prepare() {
  for (const t of targets) {
    const study = loadStudy(path.resolve(here, t.study));
    prepareStudy({ ...study, workdir: path.dirname(copyOf(t)), arms: [{ id: 'skill', setup: path.join(here, 'setup.sh') }] });
  }
}

const RESUME_PROMPT = 'The session stopped before it finished, for example on a usage limit. Continue the codemyrules run where you stopped; the answers given at the start still apply. Check what is already on disk instead of redoing it, and finish with the report in codemyrules-report.md.';

// The last session of a target: its JSON and every earlier attempt kept beside it (session.1.json, ...).
const lastSession = (t) => { try { return JSON.parse(fs.readFileSync(path.join(resultsOf(t), 'session.json'), 'utf8')); } catch { return null; } };

function session(cwd, prompt, model, resumeId) {
  const args = ['-p', prompt, ...(resumeId ? ['--resume', resumeId] : []), '--output-format', 'json', '--model', model, '--max-turns', '200',
    '--permission-mode', 'acceptEdits', '--setting-sources', 'project,local', '--allowedTools', TOOLS.join(' ')];
  return new Promise((resolve) => {
    const child = spawn(process.env.BENCH_CLAUDE || 'claude', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '', finished = false;
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const end = (code) => { if (!finished) { finished = true; resolve({ out, err, code }); } };
    child.on('error', (e) => { err += e.message; end(-1); });
    child.on('close', end);
  });
}

function collect(t, copy, s, resumed) {
  const dir = resultsOf(t);
  if (resumed) { // keep the earlier attempts, so their cost counts too
    let n = 1;
    while (fs.existsSync(path.join(dir, `session.${n}.json`))) n++;
    for (const ext of ['json', 'stderr']) if (fs.existsSync(path.join(dir, `session.${ext}`))) fs.renameSync(path.join(dir, `session.${ext}`), path.join(dir, `session.${n}.${ext}`));
    for (const f of ['changes.patch', 'claude', 'codemyrules-report.md']) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  } else fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'session.json'), s.out);
  fs.writeFileSync(path.join(dir, 'session.stderr'), s.err);
  git(copy, 'add', '-N', '.');
  fs.writeFileSync(path.join(dir, 'changes.patch'), git(copy, 'diff', 'bench-base', '--', '.', ':(exclude).claude/skills').stdout);
  const claude = path.join(copy, '.claude');
  for (const f of ['settings.local.json', 'codemyrules']) {
    const src = path.join(claude, f);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, 'claude', f), { recursive: true, filter: (p) => !p.includes('node_modules') });
  }
  const report = path.join(copy, 'codemyrules-report.md');
  if (fs.existsSync(report)) fs.copyFileSync(report, path.join(dir, 'codemyrules-report.md'));
}

async function run(model, resume) {
  const prompt = fs.readFileSync(path.join(here, 'prompt.md'), 'utf8');
  for (const t of targets) {
    if (done(t)) { console.log(`${t.name}: done, skipped`); continue; }
    const copy = copyOf(t);
    if (git(copy, 'rev-parse', '-q', '--verify', 'bench-base').status !== 0) throw new Error(`${copy} is not prepared; run "prepare" first`);
    const resumeId = resume ? lastSession(t)?.session_id : undefined;
    if (resume && !resumeId) console.log(`${t.name}: no earlier session to resume, starting fresh`);
    if (!resumeId) {
      git(copy, 'reset', '-q', '--hard', 'bench-base');
      git(copy, 'clean', '-qfdx'); // also the ignored loop files and dependencies a previous attempt left
    }
    console.log(`${t.name}: ${resumeId ? `resuming session ${resumeId}` : 'running codemyrules'} (${model})...`);
    const start = Date.now();
    let s = await session(copy, resumeId ? RESUME_PROMPT : prompt, model, resumeId);
    let parsed = null;
    try { parsed = JSON.parse(s.out); } catch { /* handled below */ }
    if (resumeId && !parsed?.session_id) s = { ...s, out: JSON.stringify({ ...(parsed ?? { is_error: true, result: s.err.slice(0, 500) }), session_id: resumeId }) }; // keep the id for the next resume
    collect(t, copy, s, Boolean(resumeId));
    let j = null;
    try { j = JSON.parse(s.out); } catch { /* reported below */ }
    console.log(`${t.name}: ${j?.is_error === false ? 'ok' : 'FAILED'}, $${(j?.total_cost_usd ?? 0).toFixed(2)}, ${j?.num_turns ?? '?'} turns, ${Math.round((Date.now() - start) / 1000)} s${j?.is_error === false ? '' : ` (${(j?.result ?? s.err).slice(0, 120)})`}`);
  }
}

function status() {
  for (const t of targets) {
    const prepared = git(copyOf(t), 'rev-parse', '-q', '--verify', 'bench-base').status === 0;
    console.log(`${t.name}: ${prepared ? 'prepared' : 'not prepared'}, ${done(t) ? 'done' : 'not run'}`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const mi = rest.indexOf('--model');
try {
  if (cmd === 'prepare') prepare();
  else if (cmd === 'run') await run(mi >= 0 ? rest[mi + 1] : 'sonnet', rest.includes('--resume'));
  else if (cmd === 'status') status();
  else { console.error('usage: node skill-eval/eval.mjs prepare | run [--model sonnet] [--resume] | status'); process.exit(2); }
} catch (e) {
  console.error(`skill-eval: ${e.message}`);
  process.exit(1);
}
