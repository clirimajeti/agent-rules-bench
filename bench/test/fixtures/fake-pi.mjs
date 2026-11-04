// Stand-in for `pi -p --mode json` in tests: edits like fake-claude (rule-breaking unless the copy has a .rules
// marker, fixed on review feedback), records its arguments and config folder, and prints pi-style JSON events.
import fs from 'node:fs';
const prompt = process.argv.at(-1);
const fix = /Code review/.test(prompt);
let text = fs.existsSync('src.ts') ? fs.readFileSync('src.ts', 'utf8') : '';
if (fix) text = text.replaceAll('BAD', 'GOOD');
else text += fs.existsSync('.rules') ? 'export const added = GOOD;\n' : 'export const added = BAD;\n';
fs.writeFileSync('src.ts', text);
if (process.env.FAKE_PI_LOG) fs.appendFileSync(process.env.FAKE_PI_LOG, JSON.stringify({ argv: process.argv.slice(2), agentDir: process.env.PI_CODING_AGENT_DIR, maxTurns: process.env.BENCH_MAX_TURNS, cwd: process.cwd() }) + '\n');
const usage = (o) => ({ input: 100, output: o, cacheRead: 1000, cacheWrite: 0, totalTokens: 1100 + o, cost: { total: 0 } });
const lines = [
  { type: 'session', id: 'x' }, { type: 'agent_start' },
  { type: 'message_end', message: { role: 'assistant', model: 'fake', usage: usage(10), stopReason: 'toolUse' } }, { type: 'turn_end' },
  { type: 'message_end', message: { role: 'assistant', model: 'fake', usage: usage(20), stopReason: 'stop' } }, { type: 'turn_end' },
  { type: 'agent_end' }, { type: 'agent_settled' },
];
for (const l of lines) console.log(JSON.stringify(l));
