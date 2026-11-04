// Compares one arm against another across studies, stratified by study x model, as studies/analysis-plan.md lays out:
// runs with a production-code break after the task (exact one-sided Fisher per stratum, exact conditional
// Cochran-Mantel-Haenszel across strata), total cost per run (geometric mean of per-stratum ratios with a stratified
// bootstrap), and descriptive secondaries: loop catches of design-shaping rules, turns, breaks left at the end, and
// the verify outcome with exact (Clopper-Pearson) intervals. Seeded, so the same data gives the same numbers.
import fs from 'node:fs';
import path from 'node:path';
import { loadStudy } from './config.mjs';
import { loadResults } from './summarize.mjs';
import { mean, percentiles, resampleMean, rng } from './pool.mjs';

// Glob as git apply --exclude reads it: "*" also matches "/", so "src/test/*" covers every file below src/test.
const globRe = (g) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')}$`);
export const matchesAny = (file, globs) => globs.some((g) => globRe(g).test(file));

// Runs that recorded where they broke a rule count only breaks outside the test files; older runs count every break.
export function productionBreaks(r, testFiles) {
  if (!Array.isArray(r.breaksAfterTaskAt)) return { breaks: r.breaksAfterTask, located: false };
  return { breaks: r.breaksAfterTaskAt.filter((b) => !matchesAny(b.file, testFiles)).length, located: true };
}

const logFact = (() => { const t = [0]; return (n) => { for (let i = t.length; i <= n; i++) t[i] = t[i - 1] + Math.log(i); return t[n]; }; })();
const logChoose = (n, k) => logFact(n) - logFact(k) - logFact(n - k);

// Distribution of the broken-run count in the first arm, given the margins: hypergeometric on [lo, hi].
function hypergeom(x1n, x2n, broken) {
  const lo = Math.max(0, broken - x2n), hi = Math.min(x1n, broken);
  const pmf = [];
  for (let a = lo; a <= hi; a++) pmf.push(Math.exp(logChoose(x1n, a) + logChoose(x2n, broken - a) - logChoose(x1n + x2n, broken)));
  return { lo, pmf };
}

// One-sided exact test that the first arm breaks more often: P(S >= observed) under the product of the per-stratum
// hypergeometrics (exact conditional CMH; with one stratum it is Fisher's exact test).
export function exactUpper(strata) {
  let lo = 0, dist = [1], observed = 0;
  for (const s of strata) {
    const h = hypergeom(s.n1, s.n2, s.x1 + s.x2);
    const next = new Array(dist.length + h.pmf.length - 1).fill(0);
    dist.forEach((p, i) => h.pmf.forEach((q, j) => { next[i + j] += p * q; }));
    dist = next; lo += h.lo; observed += s.x1;
  }
  return Math.min(1, dist.slice(observed - lo).reduce((a, b) => a + b, 0));
}

const binomCdf = (k, n, p) => { let s = 0; for (let i = 0; i <= k; i++) s += Math.exp(logChoose(n, i) + i * Math.log(p) + (n - i) * Math.log1p(-p)); return s; };
const bisect = (f, lo = 0, hi = 1) => { for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (f(m)) hi = m; else lo = m; } return (lo + hi) / 2; };

// Exact 95% interval for k successes out of n.
export function clopperPearson(k, n) {
  const lower = k === 0 ? 0 : bisect((p) => 1 - binomCdf(k - 1, n, p) >= 0.025);
  const upper = k === n ? 1 : bisect((p) => binomCdf(k, n, p) <= 0.025);
  return [lower, upper];
}

const total = (r) => r.taskCost + r.fixCost;
const geo = (xs) => Math.exp(mean(xs.map(Math.log)));
const designCatches = (study, r) => {
  const f = path.join(study.resultsDir, r.id, 'failures.log');
  if (!fs.existsSync(f)) return 0;
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).filter((l) => study.designRules.includes(JSON.parse(l).ruleId)).length;
};
const verifyOk = (r) => (r.verify ? Boolean(r.verify.ok || r.verify.withoutOwnTests?.ok) : null);

export function compare(studies, arm, against, { seed = 1, iterations = 10000, tasks, models } = {}) {
  const strata = [];
  for (const study of studies) {
    const results = loadResults(study.resultsDir).filter((r) => r.ok && (!tasks || tasks.includes(r.task)));
    for (const model of study.models.map((m) => (typeof m === 'string' ? m : m.id)).filter((m) => !models || models.includes(m))) {
      const side = (a) => results.filter((r) => r.arm === a && r.model === model).map((r) => ({ ...r, ...productionBreaks(r, study.verify?.testFiles ?? []), catches: designCatches(study, r) }));
      const x = side(arm), y = side(against);
      if (!x.length || !y.length) continue;
      strata.push({ study: study.name, model, x, y, n1: x.length, n2: y.length, x1: x.filter((r) => r.breaks > 0).length, x2: y.filter((r) => r.breaks > 0).length, ratio: mean(y.map(total)) ? mean(x.map(total)) / mean(y.map(total)) : null });
    }
  }
  if (!strata.length) throw new Error(`no study has runs of both "${arm}" and "${against}"`);
  const rand = rng(seed);
  // a local model reports no cost: its stratum counts for breaks, not for cost
  const priced = strata.filter((s) => s.ratio !== null);
  const boot = Array.from({ length: priced.length ? iterations : 0 }, () => geo(priced.map((s) => resampleMean(s.x.map(total), rand) / resampleMean(s.y.map(total), rand))));
  for (const s of strata) {
    s.fisherP = exactUpper([s]);
    if (s.ratio === null) continue;
    const b = Array.from({ length: Math.min(iterations, 2000) }, () => resampleMean(s.x.map(total), rand) / resampleMean(s.y.map(total), rand));
    s.ci = percentiles(b);
  }
  const all = (k) => strata.flatMap((s) => s[k]);
  const describe = (runs) => {
    const verified = runs.filter((r) => verifyOk(r) !== null);
    const ok = verified.filter(verifyOk).length;
    return {
      runs: runs.length, catches: runs.reduce((n, r) => n + r.catches, 0), turns: mean(runs.map((r) => r.turns)),
      leftAtEnd: runs.filter((r) => r.breaksFinal > 0).length, unlocated: runs.filter((r) => !r.located).length,
      verified: verified.length, verifyOk: ok, verifyCi: verified.length ? clopperPearson(ok, verified.length) : null,
    };
  };
  return {
    arm, against, strata,
    breaks: { x1: strata.reduce((n, s) => n + s.x1, 0), n1: strata.reduce((n, s) => n + s.n1, 0), x2: strata.reduce((n, s) => n + s.x2, 0), n2: strata.reduce((n, s) => n + s.n2, 0), cmhP: exactUpper(strata) },
    cost: priced.length ? { ratio: geo(priced.map((s) => s.ratio)), ci: percentiles(boot), strata: priced.length } : null,
    secondary: { [arm]: describe(all('x')), [against]: describe(all('y')) },
  };
}

// A change that rounds to 0 is written "0%", never "-0%" or "+0%".
const pct = (r) => { const v = Math.round((r - 1) * 100); return v === 0 ? '0%' : `${v > 0 ? '+' : ''}${v}%`; };
const p3 = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));
const share = (lo, hi) => `${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%`;

export function compareMarkdown(c, tasks) {
  const { arm, against } = c;
  const lines = [`# ${arm} against ${against}${tasks ? ` (tasks ${tasks.join(', ')})` : ''}`, '', `Stratified by study x model. Breaks are runs with a production-code break after the task, before any review fix; cost is total cost per run including the fix (${arm} / ${against}).`, ''];
  lines.push('## Pooled', '');
  lines.push(`- Runs broken: ${arm} ${c.breaks.x1}/${c.breaks.n1}, ${against} ${c.breaks.x2}/${c.breaks.n2}; exact CMH, one-sided (${arm} breaks more): p = ${p3(c.breaks.cmhP)}.`);
  lines.push(c.cost ? `- Cost: ${pct(c.cost.ratio)} (95% stratified bootstrap interval ${pct(c.cost.ci[0])} to ${pct(c.cost.ci[1])})${c.cost.strata < c.strata.length ? `, over the ${c.cost.strata} strata that report a cost` : ''}.` : '- Cost: no stratum reports a cost.');
  lines.push('', '## Per stratum', '', `| study | model | ${arm} broken | ${against} broken | Fisher p (one-sided) | cost change | 95% interval |`, '|---|---|---|---|---|---|---|');
  for (const s of c.strata) lines.push(`| ${s.study} | ${s.model} | ${s.x1}/${s.n1} | ${s.x2}/${s.n2} | ${p3(s.fisherP)} | ${s.ratio === null ? 'no cost' : pct(s.ratio)} | ${s.ci ? `${pct(s.ci[0])} to ${pct(s.ci[1])}` : '-'} |`);
  lines.push('', '## Secondary (descriptive)', '', '| arm | runs | design-rule loop catches | mean turns | runs broken at the end | verify: production code passes | exact 95% interval |', '|---|---|---|---|---|---|---|');
  for (const [a, d] of Object.entries(c.secondary)) lines.push(`| ${a} | ${d.runs} | ${d.catches} | ${d.turns.toFixed(1)} | ${d.leftAtEnd} | ${d.verified ? `${d.verifyOk}/${d.verified}` : 'not verified'} | ${d.verifyCi ? share(...d.verifyCi) : '-'} |`);
  const unlocated = Object.values(c.secondary).reduce((n, d) => n + d.unlocated, 0);
  if (unlocated) lines.push('', `${unlocated} runs did not record where they broke a rule, so all their breaks count, test files included.`);
  return lines.join('\n') + '\n';
}

export function compareStudies(files, { arm, against, tasks, models, out, log = console.log } = {}) {
  if (!arm || !against) throw new Error('compare needs --arm and --against');
  const md = compareMarkdown(compare(files.map((f) => loadStudy(f)), arm, against, { tasks, models }), tasks);
  if (out) fs.writeFileSync(path.resolve(out), md);
  log(md);
  return md;
}
