import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { clopperPearson, compare, compareMarkdown, exactUpper, matchesAny, productionBreaks } from '../compare.mjs';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);

test('exact tests match hand-computed hypergeometric tails', () => {
  // 3 of 8 broken against 0 of 8: P(a >= 3) = C(8,3) C(8,0) / C(16,3) = 56 / 560
  close(exactUpper([{ x1: 3, n1: 8, x2: 0, n2: 8 }]), 0.1);
  // per stratum a in 0..3 with pmf 0.1, 0.4, 0.4, 0.1; two such strata, S >= 6 only when both are 3
  close(exactUpper([{ x1: 3, n1: 8, x2: 0, n2: 8 }, { x1: 3, n1: 8, x2: 0, n2: 8 }]), 0.01);
  close(exactUpper([{ x1: 0, n1: 8, x2: 0, n2: 8 }]), 1); // no breaks at all: nothing to see
  close(exactUpper([{ x1: 0, n1: 8, x2: 3, n2: 8 }]), 1); // the other direction is never evidence
});

test('Clopper-Pearson matches the closed forms at the edges', () => {
  const [lo0, hi0] = clopperPearson(0, 8);
  close(lo0, 0); close(hi0, 1 - 0.025 ** (1 / 8), 1e-9);
  const [lo8, hi8] = clopperPearson(8, 8);
  close(lo8, 0.025 ** (1 / 8), 1e-9); close(hi8, 1);
  const [lo, hi] = clopperPearson(4, 8);
  assert.ok(lo < 0.5 && 0.5 < hi && Math.abs(lo - (1 - hi)) < 1e-9); // symmetric at k = n / 2
});

test('test files are matched the way git apply --exclude matches them', () => {
  assert.ok(matchesAny('src/test/java/a/FooIT.java', ['src/test/*']));
  assert.ok(matchesAny('apps/x/src/a/__tests__/b.tsx', ['*/__tests__/*']));
  assert.ok(!matchesAny('src/main/java/a/Foo.java', ['src/test/*']));
  assert.deepEqual(productionBreaks({ breaksAfterTask: 2, breaksAfterTaskAt: [{ file: 'src/test/A.java' }, { file: 'src/main/B.java' }] }, ['src/test/*']), { breaks: 1, located: true });
  assert.deepEqual(productionBreaks({ breaksAfterTask: 2 }, ['src/test/*']), { breaks: 2, located: false });
});

test('compare stratifies by study and model and reads catches and verify from the run folders', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arb-cmp-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (id, r, extra = {}) => {
    const dir = path.join(root, 'results', id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify({ id, ok: true, task: 'T1', fixCost: 0, turns: 10, breaksFinal: 0, breaksAfterTask: 0, breaksAfterTaskAt: [], ...r }));
    if (extra.catches) fs.writeFileSync(path.join(dir, 'failures.log'), extra.catches.map((ruleId) => JSON.stringify({ ruleId })).join('\n') + '\n');
    if (extra.verify) fs.writeFileSync(path.join(dir, 'verify.json'), JSON.stringify(extra.verify));
  };
  for (let i = 1; i <= 4; i++) {
    const broken = i <= 2; // 2 of 4 pointer_only runs break production code, one more breaks only a test
    write(`pointer_only-sonnet-T1-${i}`, { arm: 'pointer_only', model: 'sonnet', taskCost: 2, breaksAfterTask: broken ? 1 : 0, breaksAfterTaskAt: broken ? [{ file: 'src/main/A.java' }] : i === 3 ? [{ file: 'src/test/T.java' }] : [] }, { verify: { ok: true } });
    write(`rules_control-sonnet-T1-${i}`, { arm: 'rules_control', model: 'sonnet', taskCost: 1 }, { catches: ['design', 'mechanical'], verify: i === 4 ? { ok: false, withoutOwnTests: { ok: true } } : { ok: true } });
  }
  write('rules_control-haiku-T1-1', { arm: 'rules_control', model: 'haiku', taskCost: 1 }); // no pointer_only haiku: no stratum
  const study = { name: 's', resultsDir: path.join(root, 'results'), models: ['sonnet', 'haiku'], designRules: ['design'], verify: { testFiles: ['src/test/*'] } };
  const c = compare([study], 'pointer_only', 'rules_control', { iterations: 500 });
  assert.equal(c.strata.length, 1);
  assert.deepEqual([c.breaks.x1, c.breaks.n1, c.breaks.x2, c.breaks.n2], [2, 4, 0, 4]);
  close(c.breaks.cmhP, exactUpper([{ x1: 2, n1: 4, x2: 0, n2: 4 }]));
  close(c.cost.ratio, 2);
  assert.deepEqual(c.cost.ci, [2, 2]); // no spread, so the interval is the point
  assert.equal(c.secondary.rules_control.catches, 4); // only the design rule, in 4 runs
  assert.deepEqual([c.secondary.rules_control.verifyOk, c.secondary.rules_control.verified], [4, 4]);
  assert.deepEqual(compare([study], 'pointer_only', 'rules_control', { iterations: 500 }), c); // seeded
  const md = compareMarkdown(c);
  assert.match(md, /Runs broken: pointer_only 2\/4, rules_control 0\/4; exact CMH, one-sided \(pointer_only breaks more\): p = 0\.214/);
  assert.match(md, /\| s \| sonnet \| 2\/4 \| 0\/4 \| 0\.214 \| \+100% \|/);
  assert.throws(() => compare([study], 'rule_only', 'rules_control'), /no study has runs of both/);
  assert.throws(() => compare([study], 'pointer_only', 'rules_control', { tasks: ['T2'] }), /no study has runs of both/); // only T1 runs exist
  assert.equal(compare([study], 'pointer_only', 'rules_control', { iterations: 500, tasks: ['T1'] }).breaks.x1, 2);
});

test('context cost: the price fit recovers known prices, and N tokens cost one write plus a read per later turn', async () => {
  const { fitPrices, costPerSession } = await import('../context-cost.mjs');
  const truth = [3e-6, 3.75e-6, 0.3e-6, 15e-6];
  const sessions = [[10, 30000, 200000, 4000], [20, 50000, 900000, 9000], [5, 20000, 100000, 2000], [40, 80000, 1500000, 20000], [8, 25000, 300000, 3000]]
    .map((x) => ({ x, cost: x.reduce((a, v, i) => a + v * truth[i], 0) }));
  const { prices, maxRelError } = fitPrices(sessions);
  prices.forEach((p, i) => close(p, truth[i], 1e-12));
  assert.ok(maxRelError < 1e-9);
  close(costPerSession(1000, 11, truth), 1000 * (3.75e-6 + 10 * 0.3e-6), 1e-12);
});
