// Stand-in for `codex exec --json` in tests: edits like fake-claude, records its arguments and CODEX_HOME,
// and prints Codex-style JSON events, including a warning item that must not fail the run.
import fs from 'node:fs';
const prompt = process.argv.at(-1);
const fix = /Code review/.test(prompt);
let text = fs.existsSync('src.ts') ? fs.readFileSync('src.ts', 'utf8') : '';
if (fix) text = text.replaceAll('BAD', 'GOOD');
else text += fs.existsSync('.rules') ? 'export const added = GOOD;\n' : 'export const added = BAD;\n';
fs.writeFileSync('src.ts', text);
if (process.env.FAKE_CODEX_LOG) fs.appendFileSync(process.env.FAKE_CODEX_LOG, JSON.stringify({ argv: process.argv.slice(2), home: process.env.CODEX_HOME, cwd: process.cwd() }) + '\n');
for (const l of [
  { type: 'thread.started', thread_id: 't' },
  { type: 'item.completed', item: { id: 'i0', type: 'error', message: 'Model metadata not found.' } },
  { type: 'turn.started' },
  { type: 'item.completed', item: { id: 'i1', type: 'command_execution', command: 'cat src.ts', exit_code: 0 } },
  { type: 'item.completed', item: { id: 'i2', type: 'agent_message', text: 'done' } },
  { type: 'turn.completed', usage: { input_tokens: 1000, cached_input_tokens: 800, cache_write_input_tokens: 0, output_tokens: 50 } },
]) console.log(JSON.stringify(l));
