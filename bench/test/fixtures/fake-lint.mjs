// Stand-in linter in ESLint JSON format: every line containing BAD is an error of rule no-bad.
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv.slice(2).map((f) => ({
  filePath: path.resolve(f),
  messages: fs.readFileSync(f, 'utf8').split('\n').flatMap((l, i) => (l.includes('BAD') ? [{ ruleId: 'no-bad', severity: 2, message: 'no BAD', line: i + 1 }] : [])),
}));
console.log(JSON.stringify(out));
