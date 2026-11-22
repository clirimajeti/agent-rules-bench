// Runs inside the verify container after `vitest related`: reads Vitest's JSON report and fails only on a failing
// test file that does not also fail on the unchanged commit (the baseline list). Paths are from the repo root (/repo).
// Usage: node verify-tests.mjs <vitest-report.json> <baseline.txt>
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function judge(report, baseline) {
  const failed = report.testResults.filter((t) => t.status !== 'passed').map((t) => t.name.split('/repo/')[1] ?? t.name);
  return { files: report.testResults.length, failing: failed.length, fresh: failed.filter((f) => !baseline.has(f)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [reportFile, baselineFile] = process.argv.slice(2);
  const baseline = new Set(fs.readFileSync(baselineFile, 'utf8').split('\n').filter(Boolean));
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  } catch {
    console.log('no Vitest report: the test run did not start');
    process.exit(1);
  }
  const r = judge(report, baseline);
  console.log(`related test files: ${r.files}, failing: ${r.failing}, outside the baseline: ${r.fresh.length}`);
  for (const f of r.fresh) console.log(`  ${f}`);
  process.exit(r.fresh.length ? 1 : 0);
}
