#!/usr/bin/env node
// agent-rules-bench CLI: prepare | run | summarize on one study.json, pool across several.
import { pathToFileURL } from 'node:url';
import { loadStudy } from './config.mjs';
import { prepareStudy } from './prepare.mjs';
import { runStudy } from './run.mjs';
import { summarizeStudy } from './summarize.mjs';
import { poolStudies } from './pool.mjs';
import { verifyStudy } from './verify.mjs';

const USAGE = `usage:
  node bench/bench.mjs prepare   <study.json> [--arms a,b]
  node bench/bench.mjs run       <study.json> [--arms a,b] [--dry-run]
  node bench/bench.mjs verify    <study.json> [--arms a,b] [--rerun]
  node bench/bench.mjs summarize <study.json>
  node bench/bench.mjs pool      <study.json>... [--exclude study/model/arm,...] [--rules-arm id] [--out file.md]`;

export async function main(argv) {
  const [cmd, file, ...rest] = argv;
  if (cmd === 'pool') {
    const files = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !['--exclude', '--out', '--rules-arm'].includes(all[i - 1]));
    const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
    if (!files.length) { console.error(USAGE); return 2; }
    try { poolStudies(files, { exclude: opt('--exclude')?.split(',') ?? [], out: opt('--out'), rulesArm: opt('--rules-arm') ?? 'rules' }); } catch (e) { console.error(`agent-rules-bench: ${e.message}`); return 1; }
    return 0;
  }
  if (!['prepare', 'run', 'verify', 'summarize'].includes(cmd) || !file) {
    console.error(USAGE);
    return 2;
  }
  let study;
  try {
    study = loadStudy(file);
  } catch (e) {
    console.error(`agent-rules-bench: ${e.message}`);
    return 1;
  }
  try {
    const ai = rest.indexOf('--arms');
    const arms = ai >= 0 ? rest[ai + 1]?.split(',') : undefined;
    if (cmd === 'prepare') prepareStudy(arms ? { ...study, arms: study.arms.filter((a) => arms.includes(a.id)) } : study);
    if (cmd === 'run') {
      await runStudy(study, { arms, dryRun: rest.includes('--dry-run') });
      if (!rest.includes('--dry-run')) summarizeStudy(study);
    }
    if (cmd === 'verify') {
      verifyStudy(study, { arms, rerun: rest.includes('--rerun') });
      summarizeStudy(study);
    }
    if (cmd === 'summarize') summarizeStudy(study);
  } catch (e) {
    console.error(`agent-rules-bench: ${e.message}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
