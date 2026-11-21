// Runs inside the verify container after `vitest related`: reads Vitest's JSON report and fails only on a failing
// test file that does not also fail on the unchanged commit (the baseline list). Paths are relative to apps/web.
import fs from 'node:fs';

const [report, baseline] = process.argv.slice(2);
const base = new Set(fs.readFileSync(baseline, 'utf8').split('\n').filter(Boolean));
let r;
try {
  r = JSON.parse(fs.readFileSync(report, 'utf8'));
} catch {
  console.log('no Vitest report: the test run did not start');
  process.exit(1);
}
const failed = r.testResults.filter((t) => t.status !== 'passed').map((t) => t.name.split('/apps/web/')[1]);
const fresh = failed.filter((f) => !base.has(f));
console.log(`related test files: ${r.testResults.length}, failing: ${failed.length}, outside the baseline: ${fresh.length}`);
for (const f of fresh) console.log(`  ${f}`);
process.exit(fresh.length ? 1 : 0);
