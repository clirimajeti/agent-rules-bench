#!/usr/bin/env node
// Rebuilds the code as it was at the end of the task session (before the review fix) for every run with a
// finding after the task: the run only kept the final diff (after the fix). The agent's own edits are replayed
// on bench-base in a scratch worktree of the arm's copy:
//   Claude Code: Write / Edit / MultiEdit calls of the task and fix session logs;
//   Codex: the shell commands of task.events.jsonl and fix.events.jsonl, run again in the worktree.
// A run counts only when replaying task + fix gives exactly the saved diff.patch; then the state after the task
// is written to <run>/after-task.patch. studies/plan-6-labels/after-task-replay.json lists every run's outcome.
//
//   node bench/plan6-after-task.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { KEY_PATHS, LABELS, loadAll } from './plan6.mjs';
import { readJsonl, transcriptIndex } from './plan6-prepare.mjs';

import { finalFiles } from './plan6-prepare.mjs';

const MARK = '[REDACTED_SECRET]';
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A replayed line with a part the Codex log hid matches a real line when the visible parts agree.
export const sameLine = (real, replayed) => real === replayed || (replayed.includes(MARK) && new RegExp(`^${replayed.split(MARK).map(esc).join('.*')}$`).test(real));

// Compares two diffs against the same base file by file, allowing hidden parts: a part the log hid can stand
// for any text up to 400 characters, also over several lines (the visible text around it must match exactly). A file missing from a
// diff is the base file. Returns { equal, hidden } (hidden = number of hidden parts that had to be matched).
export function compareDiffs(realPatch, replayPatch, readBase) {
  const a = finalFiles(realPatch, readBase), b = finalFiles(replayPatch, readBase);
  const text = (m, f) => (m.has(f) ? [...m.get(f).values()].map((l) => l.text).join('\n') : readBase(f).replace(/\n$/, ''));
  let hidden = 0;
  for (const f of new Set([...a.keys(), ...b.keys()])) {
    const x = text(a, f), y = text(b, f);
    if (x === y) continue;
    if (!y.includes(MARK) || !new RegExp(`^${y.split(MARK).map(esc).join('[\\s\\S]{0,400}?')}$`).test(x)) return { equal: false, hidden };
    hidden += y.split(MARK).length - 1;
  }
  return { equal: true, hidden };
}

// Puts back a hidden part from the final code when exactly one final line of the same file matches it.
export function restoreHidden(afterPatch, finalPatch, readBase) {
  if (!afterPatch.includes(MARK)) return { patch: afterPatch, left: 0 };
  const fin = finalFiles(finalPatch, readBase);
  let left = 0;
  let file = null;
  const out = afterPatch.split('\n').map((l) => {
    const m = l.match(/^\+\+\+ (?:b\/)?(.*)$/); if (m) { file = m[1]; return l; }
    if (!l.includes(MARK) || !/^[+ ]/.test(l)) return l;
    const cands = [...(fin.get(file)?.values() ?? [])].map((x) => x.text).filter((t) => sameLine(t, l.slice(1)));
    if (new Set(cands).size === 1) return l[0] + cands[0];
    left++; return l;
  });
  return { patch: out.join('\n'), left };
}

const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
const diff = (wt) => { git(wt, 'add', '-N', '.'); const d = git(wt, 'diff', 'bench-base').stdout; git(wt, 'reset', '-q'); return d; };

// Claude Code edit tools, with the tool's own rules: an Edit whose old_string is missing or not unique fails.
export function applyClaudeEdit(root, copy, call) {
  const rel = path.relative(copy, String(call.input.file_path ?? ''));
  if (!rel || rel.startsWith('..')) return;
  const f = path.join(root, rel);
  const read = () => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
  const edit = (text, { old_string: o, new_string: n, replace_all: all }) => {
    if (text === null) return o === '' ? n : null;
    if (o === '' ) return null;
    const count = text.split(o).length - 1;
    if (count === 0 || (count > 1 && !all)) return null;
    return all ? text.split(o).join(n) : text.replace(o, () => n);
  };
  let out;
  if (call.name === 'Write') out = String(call.input.content);
  else if (call.name === 'Edit') out = edit(read(), call.input);
  else if (call.name === 'MultiEdit') { out = read(); for (const e of call.input.edits ?? []) { out = out === null ? null : edit(out, e); } }
  else return;
  if (out === null) return;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, out);
}

// Each tool call once (a log can hold the same message twice), and only calls whose result is not an error.
export function claudeCalls(entries) {
  const blocks = entries.flatMap((e) => (Array.isArray(e.message?.content) ? e.message.content : []));
  const failed = new Set(blocks.filter((b) => b.type === 'tool_result' && b.is_error).map((b) => b.tool_use_id));
  const seen = new Set();
  return blocks.filter((b) => b.type === 'tool_use' && !failed.has(b.id) && !seen.has(b.id) && seen.add(b.id));
}
const SKIP = /\b(pnpm|npm|npx|yarn|turbo|vitest|tsc|eslint|prettier|curl|wget)\b|git\s+(push|pull|fetch|clone)/;

function replaySession(wt, copy, runDir, which, idx) {
  const events = path.join(runDir, `${which}.events.jsonl`);
  if (fs.existsSync(events)) {
    for (const e of readJsonl(events)) {
      if (e.type !== 'item.started' || e.item?.type !== 'command_execution') continue;
      const cmd = e.item.command.split(copy).join(wt);
      if (SKIP.test(cmd)) continue;
      spawnSync('/bin/sh', ['-c', cmd], { cwd: wt, stdio: 'ignore', timeout: 60000, env: { ...process.env, HOME: os.tmpdir() } });
    }
    return true;
  }
  const meta = path.join(runDir, `${which}.json`);
  if (!fs.existsSync(meta)) return which === 'fix' ? true : 'no session';
  let id; try { id = JSON.parse(fs.readFileSync(meta, 'utf8')).session_id; } catch { return 'session id unreadable'; }
  const log = id && idx.get(id);
  if (!log) return 'session log missing';
  for (const c of claudeCalls(readJsonl(log))) applyClaudeEdit(wt, copy, c);
  return true;
}

export function replayAll() {
  const key = JSON.parse(fs.readFileSync(KEY_PATHS.find((p) => fs.existsSync(p)), 'utf8'));
  const wanted = new Set(Object.values(key.findings).filter((f) => f.kind === 'after-task').map((f) => `${f.study}/${f.run}`));
  const idx = transcriptIndex();
  const report = {};
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'plan6-replay-'));
  for (const { study, runs } of loadAll()) {
    const trees = new Map();
    for (const r of runs.filter((x) => wanted.has(`${study.name}/${x.id}`) && (!process.env.REPLAY_ONLY || x.id.includes(process.env.REPLAY_ONLY)))) {
      const copy = path.join(study.workdir, r.agent === 'claude' ? r.arm : `${r.arm}.${r.agent}`);
      if (!trees.has(copy)) { const wt = path.join(scratch, path.basename(study.workdir) + '-' + path.basename(copy)); git(copy, 'worktree', 'add', '-q', '--detach', wt, 'bench-base'); trees.set(copy, wt); }
      const wt = trees.get(copy);
      git(wt, 'checkout', '-q', '-f', 'bench-base'); git(wt, 'clean', '-qfd');
      const dir = path.join(study.resultsDir, r.id);
      const t = replaySession(wt, copy, dir, 'task', idx);
      if (t !== true) { report[`${study.name}/${r.id}`] = t; continue; }
      const after = diff(wt);
      const f = replaySession(wt, copy, dir, 'fix', idx);
      if (f !== true) { report[`${study.name}/${r.id}`] = `fix: ${f}`; continue; }
      const final = diff(wt), real = fs.readFileSync(path.join(dir, 'diff.patch'), 'utf8');
      const base = (f) => { const x = git(wt, 'show', `bench-base:${f}`); return x.status === 0 ? x.stdout : ''; };
      const cmp = final === real ? { equal: true, hidden: 0 } : compareDiffs(real, final, base);
      if (!cmp.equal && process.env.REPLAY_DEBUG) fs.writeFileSync(path.join(process.env.REPLAY_DEBUG, `${study.name}-${r.id}.patch`), final);
      if (cmp.equal) {
        const { patch, left } = restoreHidden(after, real, base);
        fs.writeFileSync(path.join(dir, 'after-task.patch'), patch);
        report[`${study.name}/${r.id}`] = cmp.hidden ? `verified (${cmp.hidden} parts the log hid, matched by the text around them${left ? `; ${left} after-task lines still hidden` : ''})` : 'verified';
      } else {
        report[`${study.name}/${r.id}`] = 'replay differs from diff.patch';
        fs.rmSync(path.join(dir, 'after-task.patch'), { force: true });
      }
    }
    for (const [copy, wt] of trees) git(copy, 'worktree', 'remove', '--force', wt);
  }
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.writeFileSync(path.join(LABELS, 'after-task-replay.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1]?.endsWith('plan6-after-task.mjs')) {
  const r = replayAll();
  const c = {}; for (const v of Object.values(r)) c[v] = (c[v] ?? 0) + 1;
  console.log(c);
}
