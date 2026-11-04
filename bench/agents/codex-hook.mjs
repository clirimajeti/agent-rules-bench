#!/usr/bin/env node
// Codex hook (PreToolUse, PostToolUse, Stop) that runs the codemyrules feedback loop a copy has in
// .claude/codemyrules, with the same lint-edited and lint-turn scripts as the Claude Code hooks.
// Codex with a local model edits files through the shell, so a hook cannot tell from the tool call which files
// changed: after every tool call it lints each file whose content changed since the last call. The guard is not
// ported (a shell edit cannot be inspected before it runs). PreToolUse enforces the study's turn cap
// (BENCH_MAX_TURNS tool calls). State lives in BENCH_CODEX_STATE, outside the copy.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LOOP = '.claude/codemyrules';
const event = process.argv[2];
let raw = '';
for await (const c of process.stdin) raw += c;
const input = raw.trim() ? JSON.parse(raw) : {};
const cwd = input.cwd ?? process.cwd();
const stateFile = process.env.BENCH_CODEX_STATE;
const state = (() => { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return { toolCalls: 0, hashes: {} }; } })();
const save = () => { if (stateFile) fs.writeFileSync(stateFile, JSON.stringify(state)); };
const hasLoop = fs.existsSync(path.join(cwd, LOOP, 'lint-edited.mjs'));
const run = (script, extra) => spawnSync('node', [path.join(cwd, LOOP, script)], {
  cwd, encoding: 'utf8', input: JSON.stringify({ session_id: input.session_id, cwd, ...extra }), env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
});

if (event === 'PreToolUse') {
  state.toolCalls++;
  const max = Number(process.env.BENCH_MAX_TURNS || 0);
  if (max && state.toolCalls > max) {
    state.capped = true;
    save();
    console.error(`Turn limit of ${max} reached: stop now and give a short summary of what you changed.`);
    process.exit(2);
  }
  save();
  process.exit(0);
}

if (event === 'PostToolUse') {
  if (!hasLoop) process.exit(0);
  const { changedLines } = await import(pathToFileURL(path.join(cwd, LOOP, 'lib.mjs')).href);
  const changed = [...(changedLines(cwd)?.keys() ?? [])].filter((f) => fs.existsSync(path.join(cwd, f)) && fs.statSync(path.join(cwd, f)).isFile());
  const messages = [];
  for (const f of changed) {
    const h = crypto.createHash('sha1').update(fs.readFileSync(path.join(cwd, f))).digest('hex');
    if (state.hashes[f] === h) continue;
    state.hashes[f] = h;
    const r = run('lint-edited.mjs', { tool_name: 'Edit', tool_input: { file_path: path.join(cwd, f) } });
    if (r.status === 2 && r.stderr.trim()) messages.push(r.stderr.trim());
  }
  save();
  if (messages.length) { console.error(messages.join('\n\n')); process.exit(2); }
  process.exit(0);
}

if (event === 'Stop') {
  // Codex needs JSON on stdout for Stop; blocking continues the turn with the reason as the next prompt.
  if (!hasLoop) { console.log('{}'); process.exit(0); }
  const r = run('lint-turn.mjs', { stop_hook_active: Boolean(input.stop_hook_active) });
  if (r.status === 2 && r.stderr.trim()) console.log(JSON.stringify({ decision: 'block', reason: r.stderr.trim() }));
  else console.log('{}');
  process.exit(0);
}
