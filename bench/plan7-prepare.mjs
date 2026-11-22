#!/usr/bin/env node
// Writes the blind label sheets of Plan 7's measurement checks (studies/plan-7.md), with Plan 6's tools:
//   1. for every run with a review fix, the code at the end of the task (before the fix), rebuilt from the session
//      logs (<run>/after-task.patch; the outcome per run in studies/plan-7-labels/after-task-replay.json);
//   2. studies/plan-7-labels/: 40 diffs drawn with the study seed and every finding after the task (both arms) and
//      every loop finding of the rules arm, in a seeded random order, arm hidden;
//   3. the key from codes to runs: ~/.cache/agent-rules-bench/plan7-label-key.json, kept outside the repo until
//      the labels are done, then moved to studies/plan-7-labels/key.json.
//
//   node bench/plan7-prepare.mjs [--force]
import os from 'node:os';
import path from 'node:path';
import { loadStudy } from './config.mjs';
import { loadResults } from './summarize.mjs';
import { replayAll } from './plan6-after-task.mjs';
import { prepare } from './plan6-prepare.mjs';
import { PRIMARY, STUDY } from './plan7.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LABELS = path.join(ROOT, 'studies', 'plan-7-labels');
const KEY_PATHS = [path.join(LABELS, 'key.json'), path.join(os.homedir(), '.cache', 'agent-rules-bench', 'plan7-label-key.json')];
const SEED = 20261122;

const study = loadStudy(STUDY);
const all = [{ study, runs: loadResults(study.resultsDir).map((r) => ({ ...r, study: study.name })) }];
const fixed = new Set(all[0].runs.filter((r) => r.ok && r.fixed).map((r) => `${study.name}/${r.id}`));
const replay = replayAll({ all, labels: LABELS, wanted: fixed });
const counts = {}; for (const v of Object.values(replay)) counts[v] = (counts[v] ?? 0) + 1;
console.log('after-task replay:', counts);
console.log(await prepare({ force: process.argv.includes('--force'), all, labels: LABELS, keyPaths: KEY_PATHS, seed: SEED, main: PRIMARY, d3: false }));
