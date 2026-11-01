// Stand-in for `claude -p` in tests: writes rule-breaking code unless the arm has a .rules marker,
// and removes the break when the prompt is review feedback. Prints a result JSON like Claude Code does.
import fs from 'node:fs';
const prompt = process.argv[process.argv.indexOf('-p') + 1];
const fix = /Code review/.test(prompt);
const file = 'src.ts';
let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
if (fix) text = text.replaceAll('BAD', 'GOOD');
else text += fs.existsSync('.rules') ? 'export const added = GOOD;\n' : 'export const added = BAD;\n';
fs.writeFileSync(file, text);
console.log(JSON.stringify({ is_error: false, total_cost_usd: fix ? 0.05 : 0.1, num_turns: fix ? 2 : 3,
  usage: { input_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: 1000, output_tokens: 50 } }));
