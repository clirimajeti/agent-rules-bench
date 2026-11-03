// Checks that each run's final code works, independently of the rule checkers: applies the run's diff.patch to a
// clean checkout of the pinned upstream commit (the same for every arm, without any arm's setup) and runs the
// study's verify steps (for example build and tests). Writes verify.json and one log per step next to result.json.
// Resumable: runs that already have a verify.json are skipped unless rerun is set.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadResults } from './summarize.mjs';
import { repoSource } from './prepare.mjs';

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

function must(r, what) {
  if (r.status !== 0) throw new Error(`${what} failed: ${(r.stderr || '').trim().split('\n')[0]}`);
  return r.stdout;
}

export function checkoutPath(study) {
  return `${study.workdir}.verify`;
}

function ensureCheckout(study) {
  const dir = checkoutPath(study);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    must(git(path.dirname(dir), 'clone', '-q', '--no-hardlinks', repoSource(study), dir), `cloning ${study.repo.source}`);
    must(git(dir, 'remote', 'remove', 'origin'), 'removing the remote');
  }
  return dir;
}

// Back to the pinned commit; ignored files are removed too (stale build output would hide a broken run),
// except the ones the study keeps, such as installed dependencies.
function resetCheckout(study, dir) {
  must(git(dir, 'checkout', '-q', '-f', '--detach', study.repo.commit), `checking out ${study.repo.commit}`);
  must(git(dir, 'clean', '-qfdx', ...study.verify.keep.flatMap((k) => ['-e', k])), 'cleaning the checkout');
}

// A step that fails is run again up to step.retries times; passing on a retry marks it flaky,
// so a flaky test suite is reported instead of being counted against the agent.
function runStep(study, step, dir, logFile) {
  const start = Date.now();
  let log = '', r;
  for (let attempt = 1; attempt <= step.retries + 1; attempt++) {
    r = spawnSync(step.command[0], step.command.slice(1), {
      cwd: path.join(dir, step.cwd), encoding: 'utf8', timeout: step.timeoutSec * 1000, maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BENCH_STUDY_DIR: study.studyDir, BENCH_CHECKOUT: dir },
    });
    log += `${attempt > 1 ? `\n===== attempt ${attempt} =====\n` : ''}${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}\n` : ''}`;
    if (r.status === 0) {
      fs.writeFileSync(logFile, log);
      return { ok: true, attempts: attempt, flaky: attempt > 1, seconds: Math.round((Date.now() - start) / 1000) };
    }
  }
  fs.writeFileSync(logFile, log);
  return { ok: false, status: r.status, timedOut: r.error?.code === 'ETIMEDOUT', attempts: step.retries + 1, seconds: Math.round((Date.now() - start) / 1000) };
}

export function verifyRun(study, result, dir) {
  const runDir = path.join(study.resultsDir, result.id);
  resetCheckout(study, dir);
  const patch = path.join(runDir, 'diff.patch');
  const apply = git(dir, 'apply', '--allow-empty', '--whitespace=nowarn', ...study.verify.exclude.map((e) => `--exclude=${e}`), patch);
  const out = { patchApplied: apply.status === 0, patchError: apply.status === 0 ? undefined : apply.stderr.trim(), steps: {} };
  let failed = !out.patchApplied;
  for (const step of study.verify.steps) {
    if (step.setup) {
      // Setup steps prepare the environment (dependencies, a database); their failure is not the agent's.
      const s = runStep(study, step, dir, path.join(runDir, `verify-${step.name}.log`));
      if (!s.ok) throw new Error(`verify setup step "${step.name}" failed for ${result.id}; see ${runDir}/verify-${step.name}.log`);
      continue;
    }
    out.steps[step.name] = failed ? { ok: false, skipped: true } : runStep(study, step, dir, path.join(runDir, `verify-${step.name}.log`));
    failed ||= !out.steps[step.name].ok;
  }
  out.ok = !failed;
  fs.writeFileSync(path.join(runDir, 'verify.json'), JSON.stringify(out, null, 2) + '\n');
  return out;
}

export function verifyStudy(study, { arms, rerun = false, log = console.log } = {}) {
  if (!study.verify) throw new Error('the study has no "verify" section');
  const todo = loadResults(study.resultsDir)
    .filter((r) => r.ok && (!arms || arms.includes(r.arm)))
    .filter((r) => rerun || !fs.existsSync(path.join(study.resultsDir, r.id, 'verify.json')));
  log(`${todo.length} runs to verify`);
  if (!todo.length) return [];
  const dir = ensureCheckout(study);
  const outs = [];
  for (const r of todo) {
    const v = verifyRun(study, r, dir);
    const steps = Object.entries(v.steps).map(([n, s]) => `${n} ${s.skipped ? 'skipped' : s.ok ? (s.flaky ? 'ok (flaky)' : 'ok') : 'FAILED'}`).join(', ');
    log(`${r.id}: ${v.patchApplied ? '' : 'patch did not apply, '}${steps}`);
    outs.push(v);
  }
  resetCheckout(study, dir);
  return outs;
}
