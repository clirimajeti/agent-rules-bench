// The Codex CLI as a bench agent: an isolated CODEX_HOME per model holding only its provider and the bench
// hooks (no personal config, skills or memories), the command for one headless `codex exec`, and the JSON event
// stream reduced to the fields the harness reads from a Claude Code result.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'codex-hook.mjs');

const toml = (s) => JSON.stringify(s); // a JSON string is a valid TOML basic string

// CODEX_HOME for one model: config.toml with a custom provider for its server (Ollama by default) and hooks.json
// with the bench hook for every event the loop needs. Codex adds its own state files next to them.
export function codexHome(root, spec) {
  const dir = path.join(root, spec.id);
  fs.mkdirSync(dir, { recursive: true });
  const [provider, ...rest] = spec.model.split('/');
  const model = rest.join('/');
  if (!model) throw new Error(`model "${spec.model}" must be "provider/model", for example "ollama/qwen3.6:35b-a3b-coding"`);
  const baseUrl = spec.baseUrl ?? (provider === 'ollama' ? 'http://127.0.0.1:11434/v1' : null);
  if (!baseUrl) throw new Error(`model "${spec.model}" needs a baseUrl (only ollama has a default)`);
  fs.writeFileSync(path.join(dir, 'config.toml'), [
    `model = ${toml(model)}`, 'model_provider = "bench"', `model_context_window = ${spec.contextWindow ?? 262144}`,
    // the agent's shell gets a minimal environment, not the bench's
    '[shell_environment_policy]', 'inherit = "core"',
    '[model_providers.bench]', `name = ${toml(provider)}`, `base_url = ${toml(baseUrl)}`, 'wire_api = "responses"', '',
  ].join('\n'));
  const hook = (e) => [{ hooks: [{ type: 'command', command: `node ${JSON.stringify(HOOK)} ${e}`, timeout: 120 }] }];
  fs.writeFileSync(path.join(dir, 'hooks.json'), JSON.stringify({ hooks: { PreToolUse: hook('PreToolUse'), PostToolUse: hook('PostToolUse'), Stop: hook('Stop') } }, null, 2) + '\n');
  return dir;
}

export function codexCommand(study, spec, prompt, { home, stateFile, cmd = ['codex'] }) {
  const args = ['exec', '--json', '--ephemeral', '--dangerously-bypass-hook-trust', '--sandbox', 'workspace-write', prompt];
  const env = { ...process.env, CODEX_HOME: home, BENCH_MAX_TURNS: String(spec.maxTurns ?? study.maxTurns), BENCH_CODEX_STATE: stateFile };
  return { cmd: cmd[0], args: [...cmd.slice(1), ...args], env };
}

const TOOL_ITEMS = ['command_execution', 'file_change', 'mcp_tool_call'];

// The event stream as a Claude Code -p result. Turns are the model's tool calls plus its final answer; "error"
// items are warnings (for example missing model metadata), only error events and failed turns fail a run.
export function parseCodexEvents(text, state = {}) {
  const events = text.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const completed = events.filter((e) => e.type === 'turn.completed');
  const sum = (k) => completed.reduce((n, e) => n + (e.usage?.[k] ?? 0), 0);
  const failed = events.find((e) => e.type === 'turn.failed' || e.type === 'error');
  const tools = events.filter((e) => e.type === 'item.completed' && TOOL_ITEMS.includes(e.item?.type)).length;
  const input = sum('input_tokens'), cached = sum('cached_input_tokens');
  return {
    agent: 'codex',
    is_error: !completed.length || Boolean(failed) || Boolean(state.capped),
    subtype: state.capped ? 'error_max_turns' : failed ? failed.type : 'success',
    num_turns: tools + 1,
    total_cost_usd: 0,
    usage: { input_tokens: input - cached, cache_creation_input_tokens: sum('cache_write_input_tokens'), cache_read_input_tokens: cached, output_tokens: sum('output_tokens') },
    errorMessage: failed?.error?.message ?? failed?.message ?? null,
  };
}
