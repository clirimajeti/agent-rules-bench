// Loads and validates a study config (study.json). Every problem is reported at once, before anything runs or is cloned.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const FORMATS = ['eslint', 'ast-grep', 'ruff'];
export const AGENTS = ['claude', 'pi', 'codex'];
export const DEFAULT_TOOLS = ['Read', 'Edit', 'Write', 'MultiEdit', 'Glob', 'Grep', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(ls:*)'];
const ID = /^[A-Za-z0-9_]+$/; // run folders are "<arm>-<model>-<task>-<rep>", so ids must not contain "-"
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const isStrList = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.length > 0);

export function validateStudy(s, studyDir) {
  const errs = [];
  if (!s || typeof s !== 'object' || Array.isArray(s)) return ['the study must be a JSON object'];
  const known = ['name', 'description', 'repo', 'workdir', 'tasks', 'arms', 'baselineArm', 'models', 'repeats', 'maxTurns', 'allowedTools', 'eval', 'fix', 'build', 'verify', 'designRules', 'sequence'];
  for (const k of Object.keys(s)) if (!known.includes(k)) errs.push(`unknown key "${k}"`);
  if (typeof s.name !== 'string' || !NAME.test(s.name)) errs.push('name must be lowercase letters, digits and "-"');
  if (!s.repo || typeof s.repo.source !== 'string' || !s.repo.source) errs.push('repo.source must be a git URL or a local path');
  if (!s.repo || typeof s.repo.commit !== 'string' || !s.repo.commit) errs.push('repo.commit must pin a commit (sha or tag), so every run starts from the same code');
  const ids = (list, what) => {
    if (!Array.isArray(list) || !list.length) return errs.push(`${what} must be a non-empty list`);
    const seen = new Set();
    list.forEach((x, i) => {
      if (!x || !ID.test(x.id ?? '')) errs.push(`${what}[${i}].id must be letters, digits or "_" (no "-")`);
      else if (seen.has(x.id)) errs.push(`${what}[${i}].id "${x.id}" is used twice`);
      else seen.add(x.id);
    });
  };
  ids(s.tasks, 'tasks');
  (Array.isArray(s.tasks) ? s.tasks : []).forEach((t, i) => { if (typeof t?.prompt !== 'string' || !t.prompt.trim()) errs.push(`tasks[${i}].prompt must be a non-empty string`); });
  ids(s.arms, 'arms');
  (Array.isArray(s.arms) ? s.arms : []).forEach((a, i) => {
    if (a?.setup !== undefined) {
      if (typeof a.setup !== 'string') errs.push(`arms[${i}].setup must be a path to a script`);
      else if (!fs.existsSync(path.resolve(studyDir, a.setup))) errs.push(`arms[${i}].setup "${a.setup}" does not exist next to the study`);
    }
    if (a?.fix !== undefined && typeof a.fix !== 'boolean') errs.push(`arms[${i}].fix must be true or false`);
  });
  if (s.baselineArm !== undefined && !(s.arms ?? []).some((a) => a?.id === s.baselineArm)) errs.push(`baselineArm "${s.baselineArm}" is not one of the arms`);
  // A model is a Claude Code alias ("sonnet") or an agent spec: { "id": "qwen36", "agent": "pi", "model": "ollama/qwen3.6:35b-a3b-coding" }.
  if (s.models !== undefined) {
    if (!Array.isArray(s.models) || !s.models.length) errs.push('models must be a non-empty list');
    else {
      const seen = new Set();
      s.models.forEach((m, i) => {
        const id = typeof m === 'string' ? m : m?.id;
        if (typeof m === 'string') { if (m.includes('-')) errs.push('models must be aliases without "-" (sonnet, haiku, opus)'); }
        else if (!m || typeof m !== 'object') errs.push(`models[${i}] must be an alias or an object`);
        else {
          if (!ID.test(m.id ?? '')) errs.push(`models[${i}].id must be letters, digits or "_" (it is part of every run id)`);
          if (!AGENTS.includes(m.agent)) errs.push(`models[${i}].agent is "${m.agent}", expected one of ${AGENTS.join(', ')}`);
          if (typeof m.model !== 'string' || !m.model) errs.push(`models[${i}].model must name the agent's model, for example "ollama/qwen3.6:35b-a3b-coding"`);
          if (m.baseUrl !== undefined && typeof m.baseUrl !== 'string') errs.push(`models[${i}].baseUrl must be a URL`);
          if (m.maxTurns !== undefined && !(Number.isInteger(m.maxTurns) && m.maxTurns > 0)) errs.push(`models[${i}].maxTurns must be a positive integer`);
        }
        if (id && seen.has(id)) errs.push(`models[${i}] id "${id}" is used twice`);
        seen.add(id);
      });
    }
  }
  if (s.repeats !== undefined && !(Number.isInteger(s.repeats) && s.repeats > 0)) errs.push('repeats must be a positive integer');
  if (s.maxTurns !== undefined && !(Number.isInteger(s.maxTurns) && s.maxTurns > 0)) errs.push('maxTurns must be a positive integer');
  if (s.allowedTools !== undefined && !isStrList(s.allowedTools)) errs.push('allowedTools must be a non-empty list');
  if (!Array.isArray(s.eval) || !s.eval.length) errs.push('eval must list at least one checker, or there is nothing to measure');
  else s.eval.forEach((e, i) => {
    const at = `eval[${i}]`;
    if (typeof e?.name !== 'string' || !e.name) errs.push(`${at}.name must be a non-empty string`);
    if (!FORMATS.includes(e?.format)) errs.push(`${at}.format is "${e?.format}", expected one of ${FORMATS.join(', ')}`);
    if (!isStrList(e?.command)) errs.push(`${at}.command must be a list of strings`);
    else if (!e.command.includes('{files}')) errs.push(`${at}.command must contain the element "{files}"`);
    if (!isStrList(e?.extensions) || !e.extensions.every((x) => x.startsWith('.'))) errs.push(`${at}.extensions must be a list like [".java"]`);
  });
  if (s.fix !== undefined && (typeof s.fix?.prompt !== 'string' || !s.fix.prompt.trim())) errs.push('fix.prompt must be a non-empty string');
  if ((s.arms ?? []).some((a) => a?.fix) && !s.fix) errs.push('an arm has "fix": true, but the study has no fix.prompt');
  if (s.build !== undefined) {
    if (!isStrList(s.build?.command)) errs.push('build.command must be a list of strings');
    if (s.build?.timeoutSec !== undefined && !(Number.isInteger(s.build.timeoutSec) && s.build.timeoutSec > 0)) errs.push('build.timeoutSec must be a positive integer');
  }
  if (s.sequence !== undefined && typeof s.sequence !== 'boolean') errs.push('sequence must be true or false');
  if (s.designRules !== undefined && !isStrList(s.designRules)) errs.push('designRules must be a non-empty list of rule ids');
  if (s.verify !== undefined) {
    const v = s.verify;
    if (!v || !Array.isArray(v.steps) || !v.steps.length) errs.push('verify.steps must be a non-empty list');
    else {
      const names = new Set();
      v.steps.forEach((st, i) => {
        const at = `verify.steps[${i}]`;
        if (!ID.test(st?.name ?? '')) errs.push(`${at}.name must be letters, digits or "_"`);
        else if (names.has(st.name)) errs.push(`${at}.name "${st.name}" is used twice`);
        else names.add(st.name);
        if (!isStrList(st?.command)) errs.push(`${at}.command must be a list of strings`);
        if (st?.cwd !== undefined && (typeof st.cwd !== 'string' || path.isAbsolute(st.cwd) || st.cwd.split(/[\\/]/).includes('..'))) errs.push(`${at}.cwd must be a path inside the checkout`);
        if (st?.timeoutSec !== undefined && !(Number.isInteger(st.timeoutSec) && st.timeoutSec > 0)) errs.push(`${at}.timeoutSec must be a positive integer`);
        if (st?.retries !== undefined && !(Number.isInteger(st.retries) && st.retries >= 0)) errs.push(`${at}.retries must be a non-negative integer`);
        if (st?.setup !== undefined && typeof st.setup !== 'boolean') errs.push(`${at}.setup must be true or false`);
      });
      if (v.steps.every((st) => st?.setup)) errs.push('verify.steps has only setup steps, so nothing is checked');
    }
    for (const k of ['exclude', 'keep', 'testFiles']) if (v?.[k] !== undefined && !(Array.isArray(v[k]) && v[k].every((x) => typeof x === 'string' && x))) errs.push(`verify.${k} must be a list of strings`);
  }
  return errs;
}

// Returns the study with defaults filled in and paths made absolute, or throws with every problem listed.
export function loadStudy(file) {
  const studyFile = path.resolve(file);
  const studyDir = path.dirname(studyFile);
  let s;
  try {
    s = JSON.parse(fs.readFileSync(studyFile, 'utf8'));
  } catch (e) {
    throw new Error(`could not read study ${studyFile}: ${String(e.message).split('\n')[0]}`);
  }
  const errs = validateStudy(s, studyDir);
  if (errs.length) throw new Error(`invalid study ${studyFile}:\n${errs.map((e) => `  - ${e}`).join('\n')}`);
  const sub = (list) => list.map((x) => x.replaceAll('{study}', studyDir));
  return {
    ...s,
    studyFile,
    studyDir,
    workdir: path.resolve(studyDir, s.workdir ?? path.join(defaultWorkdirs(), s.name)),
    resultsDir: path.join(studyDir, 'results'),
    baselineArm: s.baselineArm ?? s.arms[0].id,
    models: (s.models ?? ['sonnet']).map((m) => (typeof m === 'string' ? { id: m, agent: 'claude', model: m } : m)),
    repeats: s.repeats ?? 4,
    maxTurns: s.maxTurns ?? 30,
    allowedTools: s.allowedTools ?? DEFAULT_TOOLS,
    designRules: s.designRules ?? [],
    sequence: s.sequence ?? false,
    arms: s.arms.map((a) => ({ ...a, setup: a.setup ? path.resolve(studyDir, a.setup) : undefined, fix: a.fix ?? false })),
    eval: s.eval.map((e) => ({ ...e, command: sub(e.command), tier: 'full' })),
    build: s.build ? { ...s.build, command: sub(s.build.command), timeoutSec: s.build.timeoutSec ?? 600 } : undefined,
    // Agent-infra files (docs, hooks) are left out of the patch: verify judges the code on the plain upstream commit.
    verify: s.verify ? {
      exclude: s.verify.exclude ?? ['*.md', '.claude/*'],
      keep: s.verify.keep ?? [],
      testFiles: s.verify.testFiles ?? [],
      steps: s.verify.steps.map((st) => ({ ...st, command: sub(st.command), cwd: st.cwd ?? '.', timeoutSec: st.timeoutSec ?? 900, retries: st.retries ?? 0, setup: st.setup ?? false })),
    } : undefined,
  };
}

// Copies live outside any project tree by default: Claude Code loads every CLAUDE.md in the folders above
// a session's working directory, so copies below a project would carry that project's instructions.
export function defaultWorkdirs() {
  return process.env.BENCH_WORKDIRS || path.join(os.homedir(), '.cache', 'agent-rules-bench', 'workdirs');
}

// The first CLAUDE.md or CLAUDE.local.md in the workdir or any folder above it, or null.
// AGENTS.md too: other agents (pi, opencode) load it from the folders above the working directory.
export function claudeMemoryAbove(dir) {
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    for (const f of ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md']) if (fs.existsSync(path.join(d, f))) return path.join(d, f);
    if (path.dirname(d) === d) return null;
  }
}

export function assertNoClaudeMemoryAbove(workdir) {
  const found = claudeMemoryAbove(workdir);
  if (found) throw new Error(`${found} lies above the workdir ${workdir}, so every session would load it as project memory; use a workdir outside that folder ("workdir" in study.json, or BENCH_WORKDIRS)`);
}
