// pi extension that runs the codemyrules feedback loop a copy has in .claude/codemyrules, the same scripts
// Claude Code runs as hooks: guard before an edit (blocks it), lint-edited after it (adds the findings to the
// tool result), lint-turn when the agent is about to stop (one more turn with the findings). It also enforces
// the study's turn cap (BENCH_MAX_TURNS) and records a capped run in BENCH_PI_STATE. Without a loop in the
// copy only the cap applies, so every arm runs with the same extension.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LOOP = '.claude/codemyrules';
const SESSION = 'pi'; // one session per pi process; the scripts key their turn file on it

// pi's edit and write calls as the Claude Code hook input the scripts read.
export function hookInput(toolName, input = {}) {
  const file_path = input.path ?? input.file_path;
  if (!file_path) return null;
  if (toolName === 'write') return { tool_name: 'Write', tool_input: { file_path, content: input.content ?? '' } };
  if (toolName === 'edit') {
    const edits = input.edits ?? [{ oldText: input.oldText, newText: input.newText }];
    return { tool_name: 'MultiEdit', tool_input: { file_path, edits: edits.map((e) => ({ old_string: e.oldText ?? '', new_string: e.newText ?? '' })) } };
  }
  return null;
}

export default function (pi) {
  const cwd = process.cwd();
  const max = Number(process.env.BENCH_MAX_TURNS || 0);
  let turns = 0;
  pi.on('turn_end', async (_event, ctx) => {
    turns++;
    if (max && turns >= max) {
      if (process.env.BENCH_PI_STATE) fs.writeFileSync(process.env.BENCH_PI_STATE, JSON.stringify({ capped: true, turns }));
      ctx.abort();
    }
  });

  if (!fs.existsSync(path.join(cwd, LOOP, 'lint-edited.mjs'))) return;
  const run = (script, input) => spawnSync('node', [path.join(cwd, LOOP, script)], {
    cwd, encoding: 'utf8', input: JSON.stringify({ ...input, session_id: SESSION, cwd }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
  });

  pi.on('tool_call', async (event) => {
    const h = hookInput(event.toolName, event.input);
    if (!h) return;
    const r = run('guard.mjs', h);
    let decision;
    try { decision = JSON.parse(r.stdout).hookSpecificOutput; } catch { /* no decision: allowed */ }
    // Claude Code would ask the user; a headless run has no user, so the edit is refused with the reason.
    if (decision?.permissionDecision) return { block: true, reason: decision.permissionDecisionReason };
  });

  pi.on('tool_result', async (event) => {
    if (event.isError) return;
    const h = hookInput(event.toolName, event.input);
    if (!h) return;
    const r = run('lint-edited.mjs', { tool_name: h.tool_name, tool_input: { file_path: h.tool_input.file_path } });
    if (r.status === 2 && r.stderr.trim()) return { content: [...(event.content ?? []), { type: 'text', text: r.stderr.trim() }] };
  });

  let stopActive = false; // as Claude Code's stop_hook_active: the second stop in a row is let through
  pi.on('agent_before_settle', async (event) => {
    const r = run('lint-turn.mjs', { stop_hook_active: stopActive });
    if (r.status === 2 && r.stderr.trim() && !stopActive) {
      stopActive = true;
      return { entries: [...event.entries, { type: 'custom_message', customType: 'codemyrules', content: r.stderr.trim(), display: false }], continue: true };
    }
    stopActive = false;
  });
}
