// The pi agent (pi-coding-agent) as a bench agent: the command for one headless session, an isolated config
// folder holding only the model's provider (no personal settings, extensions, skills or context files), and
// pi's JSON event stream reduced to the fields the harness reads from a Claude Code result.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOOP_EXTENSION = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pi-loop.mjs');

// Claude Code tool names in a study's allowedTools, as pi's built-in tools. pi has no way to allow only
// some shell commands, so Bash(...) entries other than ls are left out: pi sessions get no shell.
const TOOL_MAP = { Read: 'read', Edit: 'edit', MultiEdit: 'edit', Write: 'write', Grep: 'grep', Glob: 'find', 'Bash(ls:*)': 'ls' };
export const piTools = (allowedTools) => [...new Set(allowedTools.map((t) => TOOL_MAP[t]).filter(Boolean))];

// A config folder per model with only its provider, so a run never sees the user's ~/.pi/agent.
export function piAgentDir(root, spec) {
  const [provider, ...rest] = spec.model.split('/');
  const id = rest.join('/');
  if (!id) throw new Error(`model "${spec.model}" must be "provider/model", for example "ollama/qwen3.6:35b-a3b-coding"`);
  const baseUrl = spec.baseUrl ?? (provider === 'ollama' ? 'http://127.0.0.1:11434/v1' : null);
  if (!baseUrl) throw new Error(`model "${spec.model}" needs a baseUrl (only ollama has a default)`);
  const dir = path.join(root, spec.id);
  fs.mkdirSync(dir, { recursive: true });
  const models = { providers: { [provider]: { api: 'openai-completions', apiKey: provider, baseUrl, models: [{ id, contextWindow: spec.contextWindow ?? 262144, input: ['text'], reasoning: true }] } } };
  fs.writeFileSync(path.join(dir, 'models.json'), JSON.stringify(models, null, 2) + '\n');
  return dir;
}

export function piCommand(study, spec, prompt, { agentDir, stateFile, cmd = ['pi'] }) {
  const args = ['-p', '--mode', 'json', '--no-session', '--no-skills', '--no-extensions', '-e', LOOP_EXTENSION,
    '--no-mcp', '--no-prompt-templates', '--no-themes', '--no-approve', '--offline',
    '--tools', piTools(study.allowedTools).join(','), '--model', spec.model, '--', prompt];
  const env = { ...process.env, PI_CODING_AGENT_DIR: agentDir, PI_OFFLINE: '1', PI_TELEMETRY: '0', PI_SKIP_VERSION_CHECK: '1', BENCH_MAX_TURNS: String(study.maxTurns), BENCH_PI_STATE: stateFile };
  return { cmd: cmd[0], args: [...cmd.slice(1), ...args], env };
}

// The event stream as a Claude Code -p result: is_error, num_turns, total_cost_usd and usage.
export function parsePiEvents(text, state = {}) {
  const events = text.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const assistant = events.filter((e) => e.type === 'message_end' && e.message?.role === 'assistant').map((e) => e.message);
  const sum = (k) => assistant.reduce((n, m) => n + (m.usage?.[k] ?? 0), 0);
  const last = assistant.at(-1);
  const settled = events.some((e) => e.type === 'agent_settled');
  const stopReason = last?.stopReason ?? null;
  return {
    agent: 'pi', model: last?.model ?? null,
    is_error: !settled || !last || stopReason === 'error' || stopReason === 'aborted' || Boolean(state.capped),
    subtype: state.capped ? 'error_max_turns' : stopReason,
    num_turns: events.filter((e) => e.type === 'turn_end').length,
    total_cost_usd: assistant.reduce((n, m) => n + (m.usage?.cost?.total ?? 0), 0),
    usage: { input_tokens: sum('input'), cache_creation_input_tokens: sum('cacheWrite'), cache_read_input_tokens: sum('cacheRead'), output_tokens: sum('output') },
    errorMessage: last?.errorMessage ?? null,
  };
}
