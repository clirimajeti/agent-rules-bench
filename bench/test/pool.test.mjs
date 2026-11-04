import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparisons, poolComparisons, poolMarkdown } from '../pool.mjs';

const run = (study, arm, model, cost, broken = 0) => ({ study, arm, model, taskCost: cost, fixCost: 0, breaksAfterTask: broken });
const cell = (study, arm, model, costs, broken = []) => costs.map((c, i) => run(study, arm, model, c, broken[i] ?? 0));

test('comparisons pair every prose arm with the rules arm per study and model, classed by arm name', () => {
  const results = [
    ...cell('s1', 'prose_buried', 'sonnet', [2, 2, 2, 2], [1, 1, 0, 0]),
    ...cell('s1', 'prose_loaded', 'sonnet', [1, 1, 1, 1]),
    ...cell('s1', 'rules', 'sonnet', [1, 1, 1, 1]),
  ];
  const cs = comparisons(results, { seed: 1, iterations: 2000 });
  assert.deepEqual(cs.map((c) => [c.study, c.model, c.prose, c.kind]), [
    ['s1', 'sonnet', 'prose_buried', 'missable'],
    ['s1', 'sonnet', 'prose_loaded', 'loaded'],
  ]);
  const buried = cs[0];
  assert.equal(buried.ratio, 0.5);
  assert.deepEqual([buried.ci[0], buried.ci[1]], [0.5, 0.5]); // no spread, so the interval is the point
  assert.deepEqual([buried.proseBroken, buried.rulesBroken, buried.n], [2, 0, 4]);
  assert.equal(cs[1].ratio, 1);
});

test('pooling averages log ratios across cells, honours exclusions, and is reproducible with a seed', () => {
  const results = [
    ...cell('a', 'prose_buried', 'sonnet', [2, 2.2, 1.8, 2]), ...cell('a', 'rules', 'sonnet', [1, 1.1, 0.9, 1]),
    ...cell('b', 'prose_buried', 'haiku', [1, 1.1, 0.9, 1]), ...cell('b', 'rules', 'haiku', [1, 1.1, 0.9, 1]),
    ...cell('b', 'prose_loaded', 'haiku', [1, 1, 1, 1]),
  ];
  const opts = { seed: 7, iterations: 3000 };
  const pooled = poolComparisons(comparisons(results, opts), opts);
  const missable = pooled.find((p) => p.kind === 'missable' && p.model === 'all');
  assert.ok(Math.abs(missable.ratio - Math.SQRT1_2) < 0.01, `geometric mean of 0.5 and 1 is ~0.707, got ${missable.ratio}`);
  assert.ok(missable.ci[0] < missable.ratio && missable.ratio < missable.ci[1]);
  assert.deepEqual(poolComparisons(comparisons(results, opts), opts), pooled); // same seed, same numbers
  const without = poolComparisons(comparisons(results, opts), { ...opts, exclude: ['a/sonnet/prose_buried'] });
  assert.equal(without.find((p) => p.kind === 'missable' && p.model === 'all').cells, 1);
});

test('comparisons can put another arm on the rules side', () => {
  const results = [...cell('s', 'prose_buried', 'haiku', [2, 2]), ...cell('s', 'rules', 'haiku', [1, 1]), ...cell('s', 'generated', 'haiku', [0.5, 0.5])];
  assert.equal(comparisons(results, { iterations: 100 })[0].ratio, 0.5);
  assert.equal(comparisons(results, { iterations: 100, rulesArm: 'generated' })[0].ratio, 0.25);
});

test('a change that rounds to zero is written 0%, without a sign', () => {
  const md = poolMarkdown([{ study: 's', model: 'm', prose: 'prose_loaded', ratio: 0.997, ci: [0.89, 1.004], proseBroken: 0, n: 8, rulesBroken: 0, rulesN: 8 }], [], []);
  assert.match(md, /\| s \| m \| prose_loaded \| 0% \| -11% to 0% \|/);
});
