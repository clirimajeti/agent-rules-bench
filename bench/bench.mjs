#!/usr/bin/env node
// agent-rules-bench CLI: prepare | run | summarize on one study.json, pool across several.
import { pathToFileURL } from 'node:url';
import { loadStudy } from './config.mjs';
import { prepareStudy } from './prepare.mjs';
import { runStudy } from './run.mjs';
import { summarizeStudy } from './summarize.mjs';
import { poolStudies } from './pool.mjs';
import { verifyStudy } from './verify.mjs';
import { compareStudies } from './compare.mjs';
import { contextCost } from './context-cost.mjs';

const USAGE = `usage:
  node bench/bench.mjs prepare   <study.json> [--arms a,b] [--models m,n]
  node bench/bench.mjs run       <study.json> [--arms a,b] [--models m,n] [--dry-run]
  node bench/bench.mjs verify    <study.json> [--arms a,b] [--rerun | --failed]
  node bench/bench.mjs summarize <study.json>
  node bench/bench.mjs pool      <study.json>... [--exclude study/model/arm,...] [--rules-arm id] [--out file.md]
  node bench/bench.mjs compare   <study.json>... --arm id --against id [--tasks T1,T2] [--models m,n] [--out file.md]
  node bench/bench.mjs context-cost <study.json>... [--tokens n] [--out file.md]`;

export async function main(argv) {
  const [cmd, file, ...rest] = argv;
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  if (cmd === 'context-cost') {
    const files = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !['--tokens', '--out'].includes(all[i - 1]));
    if (!files.length) { console.error(USAGE); return 2; }
    try { contextCost(files, { tokens: Number(opt('--tokens') ?? 1000), out: opt('--out') }); } catch (e) { console.error(`agent-rules-bench: ${e.message}`); return 1; }
    return 0;
  }
  if (cmd === 'compare') {
    const files = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !['--arm', '--against', '--out', '--tasks', '--models'].includes(all[i - 1]));
    if (!files.length) { console.error(USAGE); return 2; }
    try { compareStudies(files, { arm: opt('--arm'), against: opt('--against'), tasks: opt('--tasks')?.split(','), models: opt('--models')?.split(','), out: opt('--out') }); } catch (e) { console.error(`agent-rules-bench: ${e.message}`); return 1; }
    return 0;
  }
  if (cmd === 'pool') {
    const files = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !['--exclude', '--out', '--rules-arm'].includes(all[i - 1]));
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
    const mi = rest.indexOf('--models');
    const models = mi >= 0 ? rest[mi + 1]?.split(',') : undefined;
    const withModels = models ? { ...study, models: study.models.filter((m) => models.includes(m.id)) } : study;
    if (cmd === 'prepare') prepareStudy(arms ? { ...withModels, arms: withModels.arms.filter((a) => arms.includes(a.id)) } : withModels);
    if (cmd === 'run') {
      await runStudy(study, { arms, models, dryRun: rest.includes('--dry-run') });
      if (!rest.includes('--dry-run')) summarizeStudy(study);
    }
    if (cmd === 'verify') {
      verifyStudy(study, { arms, rerun: rest.includes('--rerun'), failed: rest.includes('--failed') });
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
