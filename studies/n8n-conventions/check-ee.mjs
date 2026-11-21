// Lists every path with ".ee" in a file or folder name that a run's diff touches. Such files are under the
// n8n Enterprise License, which forbids publishing them; no published diff may contain them.
// Usage: node check-ee.mjs <resultsDir>   (prints "<run> <path>" lines; exit code 1 if any)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EE = /(^|\/)[^/]*\.ee(\.|\/|$)/;

export function eePaths(patchText) {
  const paths = [...patchText.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)].flatMap((m) => [m[1], m[2]]);
  return [...new Set(paths)].filter((p) => EE.test(p));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node check-ee.mjs <resultsDir>'); process.exit(2); }
  let found = 0;
  for (const run of fs.readdirSync(dir)) {
    const patch = path.join(dir, run, 'diff.patch');
    if (!fs.existsSync(patch)) continue;
    for (const p of eePaths(fs.readFileSync(patch, 'utf8'))) { console.log(`${run} ${p}`); found++; }
  }
  process.exit(found ? 1 : 0);
}
