// Writes paper/generated/*.tex from the studies' results, so no number in the paper is typed by hand.
// Run from the repo root: node paper/tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadStudy } from '../bench/config.mjs';
import { loadResults } from '../bench/summarize.mjs';
import { compare, productionBreaks } from '../bench/compare.mjs';
import { comparisons, poolComparisons } from '../bench/pool.mjs';

const S = (n) => loadStudy(`studies/${n}/study.json`);
const out = path.resolve('paper/generated');
fs.mkdirSync(out, { recursive: true });

const pct = (r) => { const v = Math.round((r - 1) * 100); return v === 0 ? '0\\%' : `${v > 0 ? '+' : '$-$'}${Math.abs(v)}\\%`; };
const ci = (c) => `${pct(c[0])} to ${pct(c[1])}`;
const p3 = (p) => (p < 0.001 ? '$<$0.001' : p.toFixed(3));
const tt = (s) => `\\texttt{${s.replaceAll('_', '\\_')}}`;
const CLAUDE = ['sonnet', 'haiku'];
const macros = [];
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven'];
// LaTeX macro names take letters only: H11 -> HEleven
const macro = (name, value) => macros.push(`\\newcommand{\\${name.replace(/\d+/g, (d) => WORDS[d])}}{${value}}`);

// ---- Run counts and correctness over every Claude Code run in the public studies.
const PUBLIC = ['jhipster-clock-authorities', 'jhipster-buried', 'fastapi-crud-status', 'bulletproof-notify-querykey',
  'bulletproof-large-context', 'bulletproof-40-rules', 'bulletproof-business-context'];
const verifyOk = (r) => Boolean(r.verify?.ok || r.verify?.withoutOwnTests?.ok);
const perStudy = PUBLIC.map((n) => {
  const s = S(n);
  const all = loadResults(s.resultsDir).filter((r) => r.ok);
  return { name: n, claude: all.filter((r) => CLAUDE.includes(r.model)), local: all.filter((r) => !CLAUDE.includes(r.model)) };
});
const claudeRuns = perStudy.flatMap((s) => s.claude);
macro('NClaudeRuns', claudeRuns.length);
macro('NClaudeSessions', claudeRuns.length + claudeRuns.filter((r) => r.fixCost > 0 || r.fixUsage).length);
const localRuns = perStudy.flatMap((s) => s.local);
macro('NLocalRuns', localRuns.length);
const sessions = (rs) => rs.length + rs.filter((r) => r.fixCost > 0 || r.fixUsage).length;
macro('NAllRuns', claudeRuns.length + localRuns.length);
macro('NAllSessions', sessions(claudeRuns) + sessions(localRuns));
macro('NVerifyOk', claudeRuns.filter(verifyOk).length);
macro('NVerifyHaikuFail', claudeRuns.filter((r) => !verifyOk(r) && r.model === 'haiku').length);
macro('NVerifyFail', claudeRuns.filter((r) => !verifyOk(r)).length);
macro('TotalCost', `\\$${claudeRuns.reduce((s, r) => s + r.taskCost + r.fixCost, 0).toFixed(0)}`);

// ---- Exploratory pool (same call and exclusion as studies/pooled.md).
const EXPLORATORY = ['jhipster-clock-authorities', 'jhipster-buried', 'fastapi-crud-status', 'bulletproof-notify-querykey'];
const exclude = ['fastapi-crud-status/sonnet/prose_loaded'];
const poolResults = EXPLORATORY.flatMap((n) => { const s = S(n); return loadResults(s.resultsDir).filter((r) => CLAUDE.includes(r.model)).map((r) => ({ ...r, study: s.name })); });
const cs = comparisons(poolResults);
const pooled = poolComparisons(cs, { exclude });
const KIND = { missable: 'Prose the agent can miss', loaded: 'Always-loaded prose' };
const poolRows = pooled.map((p) => `${p.model === 'sonnet' ? KIND[p.kind] : ''} & ${p.model} & ${p.cells} & ${p.proseBroken}/${p.proseRuns} & ${p.rulesBroken}/${p.rulesRuns} & ${pct(p.ratio)} & ${ci(p.ci)} \\\\${p.model === 'all' && p.kind === 'missable' ? ' \\midrule' : ''}`);
fs.writeFileSync(path.join(out, 'pooled.tex'), poolRows.join('\n') + '\n');
for (const p of pooled.filter((x) => x.model === 'all')) {
  const k = p.kind === 'missable' ? 'Miss' : 'Loaded';
  macro(`Pool${k}Cost`, pct(p.ratio)); macro(`Pool${k}CI`, ci(p.ci));
  macro(`Pool${k}Prose`, `${p.proseBroken}/${p.proseRuns}`); macro(`Pool${k}Rules`, `${p.rulesBroken}/${p.rulesRuns}`);
}
const perComp = cs.map((c) => `${tt(c.study)} & ${c.model} & ${tt(c.prose)} & ${c.proseBroken}/${c.n} & ${c.rulesBroken}/${c.rulesN} & ${pct(c.ratio)} & ${ci(c.ci)} \\\\`);
fs.writeFileSync(path.join(out, 'pooled-per-comparison.tex'), perComp.join('\n') + '\n');

// ---- Confirmatory hypotheses, each with the call its analysis plan names.
const ABL = ['jhipster-buried', 'fastapi-crud-status', 'bulletproof-notify-querykey'].map(S);
const T = ['T1', 'T2', 'T3', 'T4'], C = ['C1', 'C2', 'C3', 'C4'];
const run = (studies, arm, against, opts = {}) => compare(studies, arm, against, { models: CLAUDE, ...opts });
const H = {
  H1: run(ABL, 'pointer_only', 'rules_control'),
  H2: run(ABL, 'rule_only', 'rules_control'),
  H4: run([S('bulletproof-sequence')], 'prose_buried', 'rules', { tasks: ['T2', 'T3'] }),
  H5: run([S('bulletproof-large-context')], 'prose_loaded_large', 'rules'),
  H7: run([S('bulletproof-40-rules')], 'prose', 'rules'),
  H9: run([S('bulletproof-business-context')], 'prose', 'rules', { tasks: T }),
  H11: run([S('bulletproof-business-context')], 'prose', 'rules', { tasks: C }),
};
H.H6 = H.H5; H.H8 = H.H7; H.H10 = H.H9;

// Holm within each family named in the plans; H1 and H2 are each tested at 0.05 without correction.
const pOf = (h) => (['H1', 'H5', 'H7', 'H9'].includes(h) ? H[h].breaks.cmhP : H[h].cost.p);
const verdict = {};
for (const fam of [['H1'], ['H2'], ['H5', 'H6'], ['H7', 'H8'], ['H9', 'H10', 'H11']]) {
  const sorted = [...fam].sort((a, b) => pOf(a) - pOf(b));
  let stop = false;
  sorted.forEach((h, i) => { const ok = !stop && pOf(h) < 0.05 / (fam.length - i); if (!ok) stop = true; verdict[h] = ok; });
}
// H2's plan decides by the interval lying above no change; same answer as its p here, checked below.
if ((H.H2.cost.ci[0] > 1) !== verdict.H2) throw new Error('H2: interval and p disagree');

const ROWS = [
  ['H1', 'Plan 1', 'No feedback loop: more violations', 'pointer\\_only vs.\\ full', 'breaks'],
  ['H2', 'Plan 1', 'No pointer costs more', 'rule\\_only vs.\\ full', 'cost'],
  ['H5', 'Plan 3', 'Large always-loaded file: more violations', 'prose\\_loaded\\_large vs.\\ rules', 'breaks'],
  ['H6', 'Plan 3', 'Large always-loaded file costs more', 'prose\\_loaded\\_large vs.\\ rules', 'cost'],
  ['H7', 'Plan 4', '40 prose lines: more violations', 'prose vs.\\ rules', 'breaks'],
  ['H8', 'Plan 4', '40 prose lines cost more', 'prose vs.\\ rules', 'cost'],
  ['H9', 'Plan 5', '40 lines in business context: more violations', 'prose vs.\\ rules, T1--T4', 'breaks'],
  ['H10', 'Plan 5', '40 lines in business context cost more', 'prose vs.\\ rules, T1--T4', 'cost'],
  ['H11', 'Plan 5', 'Prose costs more on unrelated tasks', 'prose vs.\\ rules, C1--C4', 'cost'],
];
const hRows = ROWS.map(([h, plan, claim, cmp, kind]) => {
  const c = H[h];
  const res = kind === 'breaks' ? `${c.breaks.x1}/${c.breaks.n1} vs.\\ ${c.breaks.x2}/${c.breaks.n2}` : `${pct(c.cost.ratio)} [${ci(c.cost.ci)}]`;
  return `${h} & ${plan.replace('Plan ', '')} & ${claim} & ${cmp} & ${res} & ${p3(pOf(h))} & ${verdict[h] ? '\\textbf{yes}' : 'no'} \\\\`;
});
hRows.splice(2, 0, `H4 & 2 & Missed rule compounds over sessions & prose\\_buried vs.\\ rules, T2--T3 & ${H.H4.breaks.x1}/${H.H4.breaks.n1} vs.\\ ${H.H4.breaks.x2}/${H.H4.breaks.n2} & -- & not tested \\\\`);
// H3 (Plan 1) has no test: the verify result per arm with its exact interval.
const V = { NoLoop: H.H1.secondary.pointer_only, NoPointer: H.H2.secondary.rule_only, Full: H.H1.secondary.rules_control };
const vOk = (v) => `${v.verifyOk}/${v.verified}`;
hRows.splice(2, 0, `H3 & 1 & Functional correctness does not differ & pointer\\_only, rule\\_only, full & ${vOk(V.NoLoop)}, ${vOk(V.NoPointer)}, ${vOk(V.Full)} & -- & no test \\\\`);
for (const [k, v] of Object.entries(V)) { macro(`H3${k}`, vOk(v)); macro(`H3${k}CI`, `${Math.round(v.verifyCi[0] * 100)}\\% to ${Math.round(v.verifyCi[1] * 100)}\\%`); }
fs.writeFileSync(path.join(out, 'hypotheses.tex'), hRows.join('\n') + '\n');

for (const [h, c] of Object.entries(H)) {
  macro(`${h}Breaks`, `${c.breaks.x1}/${c.breaks.n1}`); macro(`${h}BreaksAgainst`, `${c.breaks.x2}/${c.breaks.n2}`);
  macro(`${h}BreaksP`, p3(c.breaks.cmhP));
  if (c.cost) { macro(`${h}Cost`, pct(c.cost.ratio)); macro(`${h}CI`, ci(c.cost.ci)); macro(`${h}CostP`, p3(c.cost.p)); }
  macro(`${h}N`, c.breaks.n1 + c.breaks.n2);
}
const seqAll = loadResults(S('bulletproof-sequence').resultsDir);
macro('SeqOk', seqAll.filter((r) => r.ok).length); macro('SeqPlanned', 48);
macro('HOneCatchFull', H.H2.secondary.rules_control.catches); macro('HTwoCatchNoPointer', H.H2.secondary.rule_only.catches);

// ---- Descriptive comparisons named in the plans (no tests).
const D = [
  ['Context tax, large file, lint rules on both sides', run([S('bulletproof-large-context')], 'rules_large', 'rules')],
  ['Dilution: same rule text, large vs.\\ short file', run([S('bulletproof-large-context')], 'prose_loaded_large', 'prose_loaded')],
  ['No conventions vs.\\ 40 prose lines', run([S('bulletproof-40-rules')], 'none', 'prose')],
  ['No conventions vs.\\ 40 prose lines, in business context', run([S('bulletproof-business-context')], 'none', 'prose', { tasks: T })],
  ['Prose vs.\\ none on unrelated tasks (C1--C4)', run([S('bulletproof-business-context')], 'prose', 'none', { tasks: C })],
];
const pool45 = run([S('bulletproof-40-rules'), S('bulletproof-business-context')], 'prose', 'rules', { tasks: T });
D.push(['Plans 4 and 5 pooled (chosen after the results)', pool45]);
fs.writeFileSync(path.join(out, 'descriptive.tex'), D.map(([label, c]) => `${label} & ${tt(c.arm)} vs.\\ ${tt(c.against)} & ${c.breaks.x1}/${c.breaks.n1} vs.\\ ${c.breaks.x2}/${c.breaks.n2} & ${p3(c.breaks.cmhP)} & ${pct(c.cost.ratio)} [${ci(c.cost.ci)}] \\\\`).join('\n') + '\n');
macro('PoolFourFiveBreaks', `${pool45.breaks.x1}/${pool45.breaks.n1}`); macro('PoolFourFiveP', p3(pool45.breaks.cmhP));
macro('NoneVsProseCost', pct(D[2][1].cost.ratio)); macro('NoneVsProseCI', ci(D[2][1].cost.ci));
macro('TaxCost', pct(D[0][1].cost.ratio)); macro('TaxCI', ci(D[0][1].cost.ci));

// ---- What codemyrules built on its own (the generated arm), against the hand-written rules.
const gen = run(ABL, 'generated', 'rules');
macro('GenBreaks', `${gen.breaks.x1}/${gen.breaks.n1}`); macro('GenCost', pct(gen.cost.ratio)); macro('GenCI', ci(gen.cost.ci));

// ---- Every Claude Code run with the feedback loop: production breaks after the task.
const LOOP = ['rules', 'rules_control', 'rule_only', 'rules_large', 'generated'];
const loopRuns = PUBLIC.flatMap((n) => { const s = S(n); return loadResults(s.resultsDir).filter((r) => r.ok && CLAUDE.includes(r.model) && LOOP.includes(r.arm)).map((r) => productionBreaks(r, s.verify?.testFiles ?? []).breaks); });
macro('NLoopRuns', loopRuns.length); macro('NLoopBroken', loopRuns.filter((b) => b > 0).length);

// ---- Local model in pi and Codex (breaks only; no cost reported).
const bp = S('bulletproof-notify-querykey');
const local = [];
for (const [model, harness] of [['qwen36', 'pi'], ['qwen36codex', 'Codex']]) {
  for (const arm of ['prose_buried', 'prose_loaded', 'rules']) {
    const c = compare([bp], arm, 'rules', { models: [model] });
    const s = c.strata[0];
    local.push(`${harness} & ${tt(arm)} & ${s.x1}/${s.n1} & ${arm === 'rules' ? '--' : p3(s.fisherP)} & ${c.secondary[arm].turns.toFixed(1)} \\\\`);
  }
}
fs.writeFileSync(path.join(out, 'local.tex'), local.join('\n') + '\n');

fs.writeFileSync(path.join(out, 'macros.tex'), macros.join('\n') + '\n');
console.log(`wrote ${fs.readdirSync(out).length} files to paper/generated (${claudeRuns.length} Claude Code runs)`);
