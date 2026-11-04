// Pools several studies: for every prose arm against the "rules" arm (same study and model) it reports the
// cost ratio (rules / prose, total cost including fix rounds) with a bootstrap 95% interval, and first-draft breaks.
// Prose arms are arms whose id starts with "prose"; those with "loaded" in the id are always-loaded prose, the
// others (linked, buried) prose the agent can miss. Pooled ratios are geometric means across comparisons, with a
// bootstrap that resamples runs within every arm at once. Seeded, so the same data gives the same numbers.
import fs from 'node:fs';
import path from 'node:path';
import { loadStudy } from './config.mjs';
import { loadResults } from './summarize.mjs';

export function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
export const resampleMean = (xs, rand) => { let s = 0; for (let i = 0; i < xs.length; i++) s += xs[Math.floor(rand() * xs.length)]; return s / xs.length; };
export const percentiles = (xs) => { const s = [...xs].sort((a, b) => a - b); const at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]; return [at(0.025), at(0.975)]; };
const total = (r) => r.taskCost + r.fixCost;

export function comparisons(results, { seed = 1, iterations = 10000, rulesArm = 'rules' } = {}) {
  const rand = rng(seed);
  const groups = new Map();
  for (const r of results) {
    const k = `${r.study}|${r.model}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const out = [];
  for (const [k, rs] of groups) {
    const [study, model] = k.split('|');
    const rules = rs.filter((r) => r.arm === rulesArm);
    if (!rules.length) continue;
    const proseArms = [...new Set(rs.map((r) => r.arm).filter((a) => a.startsWith('prose')))].sort();
    for (const prose of proseArms) {
      const p = rs.filter((r) => r.arm === prose);
      const proseCosts = p.map(total), rulesCosts = rules.map(total);
      const boot = Array.from({ length: iterations }, () => resampleMean(rulesCosts, rand) / resampleMean(proseCosts, rand));
      out.push({
        study, model, prose, kind: prose.includes('loaded') ? 'loaded' : 'missable',
        ratio: mean(rulesCosts) / mean(proseCosts), ci: percentiles(boot),
        proseBroken: p.filter((r) => r.breaksAfterTask > 0).length, rulesBroken: rules.filter((r) => r.breaksAfterTask > 0).length,
        n: p.length, rulesN: rules.length, proseCosts, rulesCosts,
      });
    }
  }
  return out;
}

export function poolComparisons(cs, { seed = 1, iterations = 10000, exclude = [] } = {}) {
  const rand = rng(seed);
  const kept = cs.filter((c) => !exclude.includes(`${c.study}/${c.model}/${c.prose}`));
  const out = [];
  for (const kind of ['missable', 'loaded']) {
    for (const model of [...new Set(kept.map((c) => c.model))].sort().concat('all')) {
      const cells = kept.filter((c) => c.kind === kind && (model === 'all' || c.model === model));
      if (!cells.length) continue;
      const geo = (ratios) => Math.exp(mean(ratios.map(Math.log)));
      const boot = Array.from({ length: iterations }, () => geo(cells.map((c) => resampleMean(c.rulesCosts, rand) / resampleMean(c.proseCosts, rand))));
      out.push({
        kind, model, cells: cells.length, ratio: geo(cells.map((c) => c.ratio)), ci: percentiles(boot),
        proseBroken: cells.reduce((s, c) => s + c.proseBroken, 0), proseRuns: cells.reduce((s, c) => s + c.n, 0),
        rulesBroken: cells.reduce((s, c) => s + c.rulesBroken, 0), rulesRuns: cells.reduce((s, c) => s + c.rulesN, 0),
      });
    }
  }
  return out;
}

// A change that rounds to 0 is written "0%", never "-0%" or "+0%".
const pct = (r) => { const v = Math.round((r - 1) * 100); return v === 0 ? '0%' : `${v > 0 ? '+' : ''}${v}%`; };
const KIND = { missable: 'prose the agent can miss (linked or buried)', loaded: 'always-loaded prose' };

export function poolMarkdown(cs, pooled, exclude, rulesArm = 'rules') {
  const lines = ['# Pooled results', '', ...(rulesArm === 'rules' ? [] : [`Rules side: the "${rulesArm}" arm.`, '']), 'Rules + pointer + loop against prose, total cost per run including review fixes. Ratio = rules / prose; 95% bootstrap interval; first-draft breaks are runs with a rule broken after the task, before any review.', ''];
  lines.push('## Pooled', '', '| against | model | comparisons | cost change | 95% interval | prose: runs broken | rules: runs broken |', '|---|---|---|---|---|---|---|');
  for (const p of pooled) lines.push(`| ${KIND[p.kind]} | ${p.model} | ${p.cells} | ${pct(p.ratio)} | ${pct(p.ci[0])} to ${pct(p.ci[1])} | ${p.proseBroken}/${p.proseRuns} | ${p.rulesBroken}/${p.rulesRuns} |`);
  if (exclude.length) lines.push('', `Excluded from pooling: ${exclude.join(', ')}.`);
  lines.push('', '## Per comparison', '', '| study | model | prose arm | cost change | 95% interval | prose broken | rules broken |', '|---|---|---|---|---|---|---|');
  for (const c of cs) lines.push(`| ${c.study} | ${c.model} | ${c.prose} | ${pct(c.ratio)} | ${pct(c.ci[0])} to ${pct(c.ci[1])} | ${c.proseBroken}/${c.n} | ${c.rulesBroken}/${c.rulesN} |`);
  return lines.join('\n') + '\n';
}

export function poolStudies(files, { exclude = [], out, rulesArm = 'rules', log = console.log } = {}) {
  const results = files.flatMap((f) => { const s = loadStudy(f); return loadResults(s.resultsDir).map((r) => ({ ...r, study: s.name })); });
  const cs = comparisons(results, { rulesArm });
  const md = poolMarkdown(cs, poolComparisons(cs, { exclude }), exclude, rulesArm);
  if (out) fs.writeFileSync(path.resolve(out), md);
  log(md);
  return md;
}
