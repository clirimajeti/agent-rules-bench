// Plan 7 analysis on fake runs: strata per model x task, H16 (exact CMH), H17 (cost TOST), per-rule counts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyse, strata, PRIMARY } from '../plan7.mjs';

const TASKS = ['T1', 'T2', 'T3', 'T4'];
// prose: one violating run per model x task; rules: none; equal cost in both arms
function fakeRuns() {
  const runs = [];
  for (const arm of ['prose', 'rules']) for (const model of PRIMARY) for (const task of TASKS) for (let rep = 1; rep <= 4; rep++) {
    const broken = arm === 'prose' && rep === 1;
    runs.push({
      id: `${arm}-${model}-${task}-${rep}`, study: 'n8n-conventions', arm, model, task, rep, ok: true,
      taskCost: 1 + rep / 100, fixCost: broken ? 0.1 : 0, turns: 10, capped: false, hookCatches: arm === 'rules' ? 1 : 0, ignoredCatches: 0,
      breaksAfterTask: broken ? 1 : 0, breaksFinal: 0,
      breaksAfterTaskAt: broken ? [{ ruleId: task < 'T3' ? 'local/no-as-cast' : 'local/node-errors', file: 'x.ts', line: 1 }] : [],
    });
  }
  return runs;
}

test('one stratum per model and task, prose against rules', () => {
  const ss = strata(fakeRuns(), PRIMARY);
  assert.equal(ss.length, 8);
  assert.equal(ss.reduce((a, s) => a + s.x1, 0), 8);
  assert.equal(ss.reduce((a, s) => a + s.x2, 0), 0);
  assert.ok(ss.every((s) => s.n1 === 4 && s.n2 === 4));
});

test('the report has H16, H17, Holm and every rule', () => {
  const md = analyse(fakeRuns());
  assert.match(md, /H16/);
  assert.match(md, /H17/);
  assert.match(md, /Holm/);
  const h16 = md.match(/exact conditional CMH, one-sided: p = (<?\d+(?:\.\d+)?)/);
  assert.ok(h16 && (h16[1].startsWith('<') || Number(h16[1]) < 0.01), `H16 p: ${h16?.[1]}`);
  assert.match(md, /\| no-as-cast \| 4 \| 0 \|/);
  assert.match(md, /\| node-errors \| 4 \| 0 \|/);
});

test('a failed session is left out and named', () => {
  const runs = fakeRuns();
  runs[0].ok = false;
  assert.equal(strata(runs, PRIMARY).reduce((a, s) => a + s.n1, 0), 31);
  assert.match(analyse(runs), /left out because their session failed: n8n-conventions\/prose-sonnet-T1-1/);
});

test('D1: a run whose only finding is a linter error (no study rule) is left out in the sensitivity analysis', () => {
  const runs = fakeRuns();
  const r = runs.find((x) => x.id === 'prose-sonnet-T4-1');
  r.breaksAfterTaskAt = [{ ruleId: 'eslint', file: 'x.ts', line: 1 }];
  const md = analyse(runs);
  assert.match(md, /D1 sensitivity.*prose 7\/32/s);
});
