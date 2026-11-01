#!/usr/bin/env node
// agent-rules-bench CLI: prepare | run | summarize, each on one study.json.
import { pathToFileURL } from 'node:url';
import { loadStudy } from './config.mjs';
import { prepareStudy } from './prepare.mjs';
import { runStudy } from './run.mjs';
import { summarizeStudy } from './summarize.mjs';

const USAGE = `usage:
  node bench/bench.mjs prepare   <study.json>
  node bench/bench.mjs run       <study.json> [--arms a,b] [--dry-run]
  node bench/bench.mjs summarize <study.json>`;

export async function main(argv) {
  const [cmd, file, ...rest] = argv;
  if (!['prepare', 'run', 'summarize'].includes(cmd) || !file) {
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
    if (cmd === 'prepare') prepareStudy(study);
    if (cmd === 'run') {
      const i = rest.indexOf('--arms');
      await runStudy(study, { arms: i >= 0 ? rest[i + 1]?.split(',') : undefined, dryRun: rest.includes('--dry-run') });
      if (!rest.includes('--dry-run')) summarizeStudy(study);
    }
    if (cmd === 'summarize') summarizeStudy(study);
  } catch (e) {
    console.error(`agent-rules-bench: ${e.message}`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
