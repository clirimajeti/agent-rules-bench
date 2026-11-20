// D5: verifies the hand-written minimal correct solution of each task (studies/<study>/d5/<task>/diff.patch)
// with the study's own verify steps, in the same container and clean checkout as the runs (bench/verify.mjs),
// and writes studies/<study>/d5-excluded-tests.json: per task, the project test files that the solution fails.
// A solution whose type check fails is not correct; the script stops so it can be fixed.
// Usage: node bench/plan6-d5.mjs [study-name] [task]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadStudy } from './config.mjs';
import { STUDIES, failingTestFiles } from './plan6.mjs';
import { verifyRun, checkoutPath } from './verify.mjs';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [onlyStudy, onlyTask] = process.argv.slice(2);
  for (const file of STUDIES) {
    const study = loadStudy(file);
    if (onlyStudy && study.name !== onlyStudy) continue;
    const d5 = path.join(study.studyDir, 'd5');
    const out = path.join(study.studyDir, 'd5-excluded-tests.json');
    const excluded = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
    for (const task of fs.readdirSync(d5).filter((t) => fs.existsSync(path.join(d5, t, 'diff.patch'))).sort()) {
      if (onlyTask && task !== onlyTask) continue;
      if (!fs.existsSync(checkoutPath(study))) throw new Error(`no verify checkout at ${checkoutPath(study)}; run bench verify first`);
      const v = verifyRun({ ...study, resultsDir: d5 }, { id: task }, checkoutPath(study));
      if (!v.patchApplied) throw new Error(`${study.name} ${task}: the patch did not apply: ${v.patchError}`);
      if (!v.steps.typecheck?.ok) throw new Error(`${study.name} ${task}: the type check fails; see ${path.join(d5, task, 'verify-typecheck.log')}`);
      const failing = v.steps.tests.ok ? [] : failingTestFiles(fs.readFileSync(path.join(d5, task, 'verify-tests.log'), 'utf8'));
      if (!v.steps.tests.ok && !failing.length) throw new Error(`${study.name} ${task}: tests fail but no failing test file was found`);
      excluded[task] = failing;
      console.log(`${study.name} ${task}: type check ok, failing test files: ${failing.join(', ') || 'none'}`);
    }
    fs.writeFileSync(out, JSON.stringify(excluded, null, 2) + '\n');
  }
}
