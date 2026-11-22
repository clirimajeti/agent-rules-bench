// Writes paper/generated/*.tex from the studies' results, so no number in the paper is typed by hand.
// Run from the repo root: node paper/tables.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadStudy } from '../bench/config.mjs';
import { loadResults } from '../bench/summarize.mjs';
import { compare, productionBreaks } from '../bench/compare.mjs';
import { comparisons, poolComparisons } from '../bench/pool.mjs';
import { clopperPearson, exactUpper } from '../bench/compare.mjs';
import * as P6 from '../bench/plan6.mjs';
import * as P7 from '../bench/plan7.mjs';

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
// totals over every study; the EMSE version adds Plan 7 to them
const totals = {};
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

// ---- Plan 6 (registered on OSF): the same calls as bench/plan6.mjs, which writes studies/plan-6-results.md.
{
  const all = P6.loadAll();
  const labels = P6.loadLabels();
  if (!labels) throw new Error('Plan 6: no label key (studies/plan-6-labels/key.json)');
  const runsOf = (models) => all.flatMap(({ runs }) => runs.filter((r) => r.ok && models.includes(r.model)));
  const nPrimary = runsOf(P6.PRIMARY).length, nLocal = runsOf(P6.SECONDARY).length, nLatest = runsOf(P6.EXPLORATORY).length;
  macro('PSixPrimaryRuns', nPrimary); macro('PSixLocalRuns', nLocal); macro('PSixLatestRuns', nLatest);
  macro('PSixRuns', nPrimary + nLocal + nLatest);
  totals.runs = claudeRuns.length + localRuns.length + nPrimary + nLocal + nLatest;
  macro('NTotalRuns', totals.runs);
  // A run is one task session, plus one review-fix session if it violated a rule.
  totals.sessions = sessions(claudeRuns) + sessions(localRuns) + sessions(runsOf([...P6.PRIMARY, ...P6.SECONDARY, ...P6.EXPLORATORY]));
  macro('NTotalSessions', totals.sessions);
  const total = (r) => r.taskCost + r.fixCost;
  const p6Cost = runsOf([...P6.PRIMARY, ...P6.EXPLORATORY]).reduce((a, r) => a + total(r), 0);
  macro('PSixCost', `\\$${p6Cost.toFixed(0)}`);
  macro('NTotalCost', `\\$${(claudeRuns.reduce((a, r) => a + total(r), 0) + p6Cost).toFixed(0)}`);

  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const sum = (ss, k) => ss.reduce((a, s) => a + s[k], 0);
  const frac = (a, b) => `${a}/${b}`;
  const cpi = (k, n) => { const [lo, hi] = clopperPearson(k, n); return `${Math.round(lo * 100)}\\% to ${Math.round(hi * 100)}\\%`; };
  const PROJ = { 'bulletproof-conventions': 'bulletproof-react', 'formbricks-conventions': 'Formbricks' };
  const MODEL = { sonnet: 'Sonnet 5.5', haiku: 'Haiku 5.5', qwen36codex: 'Qwen3.6 (Codex)', opus55: 'Opus 5.5', fable52: 'Fable 5.2' };

  // H12 to H14 per stratum
  const ss = P6.strata(all, P6.PRIMARY);
  const sec = P6.strata(all, P6.SECONDARY);
  const h12p = exactUpper(ss);
  const h13 = P6.costRatio(ss), h13task = P6.costRatio(ss, (r) => r.taskCost);
  const adj = P6.holm({ H12: h12p, H13: h13.p });
  if (adj.H12 <= 0.05 || adj.H13 <= 0.05) throw new Error('Plan 6: a hypothesis now holds; update the text');
  const rows = [...ss, ...sec].map((s) => `${s === sec[0] ? '\\midrule\n' : ''}${PROJ[s.study]} & ${MODEL[s.model]} & ${s.x1}/${s.n1} & ${s.x2}/${s.n2} & ${p3(exactUpper([s]))} & ${s.model === 'qwen36codex' ? '--' : pct(avg(s.y.map(total)) / avg(s.x.map(total)))} \\\\`);
  fs.writeFileSync(path.join(out, 'plan6.tex'), rows.join('\n') + '\n');
  macro('HTwelveProse', frac(sum(ss, 'x1'), sum(ss, 'n1'))); macro('HTwelveRules', frac(sum(ss, 'x2'), sum(ss, 'n2')));
  macro('HTwelveP', p3(h12p)); macro('HTwelveHolm', p3(adj.H12));
  macro('HThirteenCost', pct(h13.point)); macro('HThirteenCI', ci(h13.ci)); macro('HThirteenP', p3(h13.p)); macro('HThirteenHolm', p3(adj.H13));
  macro('HThirteenTaskCost', pct(h13task.point)); macro('HThirteenTaskCI', ci(h13task.ci));
  for (const [name, st] of [['BP', 'bulletproof-conventions'], ['FB', 'formbricks-conventions']]) {
    const s = ss.filter((x) => x.study === st);
    macro(`PSix${name}Prose`, frac(sum(s, 'x1'), sum(s, 'n1'))); macro(`PSix${name}Rules`, frac(sum(s, 'x2'), sum(s, 'n2')));
    macro(`PSix${name}P`, p3(exactUpper(s)));
  }
  const secPool = [{ x1: sum(sec, 'x1'), n1: sum(sec, 'n1'), x2: sum(sec, 'x2'), n2: sum(sec, 'n2') }];
  macro('HFourteenProse', frac(secPool[0].x1, secPool[0].n1)); macro('HFourteenRules', frac(secPool[0].x2, secPool[0].n2));
  macro('HFourteenP', p3(exactUpper(secPool)));

  // H15 and the D5 sensitivity: verify passes per project and arm, primary models
  const excl = Object.fromEntries(all.map(({ study }) => [study.name, JSON.parse(fs.readFileSync(path.join(study.studyDir, 'd5-excluded-tests.json'), 'utf8'))]));
  const vrows = [];
  for (const { study, runs } of all) {
    const cells = ['prose', 'rules'].map((arm) => {
      const rs = runs.filter((r) => r.ok && P6.PRIMARY.includes(r.model) && r.arm === arm);
      const a = rs.map((r) => P6.verifyOk(r)).filter((x) => x !== null);
      const b = rs.map((r) => P6.verifyOkD5(r, study.resultsDir, excl[study.name][r.task] ?? [])).filter((x) => x !== null);
      return [frac(a.filter(Boolean).length, a.length), frac(b.filter(Boolean).length, b.length)];
    });
    vrows.push(`${PROJ[study.name]} & ${cells[0][0]} & ${cells[1][0]} & ${cells[0][1]} & ${cells[1][1]} \\\\`);
  }
  fs.writeFileSync(path.join(out, 'plan6-verify.tex'), vrows.join('\n') + '\n');

  // bulletproof: the rules arm and which convention the violating runs broke (primary models)
  const bp = all.find((a) => a.study.name === 'bulletproof-conventions');
  const bpRules = bp.runs.filter((r) => r.ok && P6.PRIMARY.includes(r.model) && r.arm === 'rules');
  macro('PSixBPCatchRuns', frac(bpRules.filter((r) => r.hookCatches > 0).length, bpRules.length));
  macro('PSixBPIgnoredRuns', bpRules.filter((r) => r.ignoredCatches > 0).length);
  const bpViol = bp.runs.filter((r) => r.ok && P6.PRIMARY.includes(r.model) && P6.violating(r));
  const role = bpViol.filter((r) => (r.breaksAfterTaskAt ?? []).some((f) => f.ruleId === 'local/role-checks-through-authorization'));
  macro('PSixBPRoleRuns', frac(role.length, bpViol.length));
  macro('PSixBPRoleTFour', frac(role.filter((r) => r.task === 'T4').length, role.length));

  // Formbricks per convention (D3): runs with a finding of the convention after the task
  const fb = all.find((a) => a.study.name === 'formbricks-conventions');
  const F = {
    'local/no-new-server-actions': ['F1', 'No new server actions', 'loaded'],
    'local/readonly-props': ['F2', 'Props use \\texttt{Readonly<>}', 'not loaded'],
    'local/shared-date-formatting': ['F3', 'Shared date formatting', 'not loaded'],
    'local/en-us-locale-only': ['F4', 'Strings only in \\texttt{en-US.json}', 'loaded'],
  };
  const cell = (models, arm, rule) => { const rs = fb.runs.filter((r) => r.ok && models.includes(r.model) && r.arm === arm); return frac(rs.filter((r) => (r.breaksAfterTaskAt ?? []).some((f) => f.ruleId === rule)).length, rs.length); };
  fs.writeFileSync(path.join(out, 'plan6-formbricks.tex'), Object.entries(F).map(([rule, [id, text, where]]) =>
    `${id} & ${text} & ${where} & ${cell(P6.PRIMARY, 'prose', rule)} & ${cell(P6.PRIMARY, 'rules', rule)} & ${cell(P6.SECONDARY, 'prose', rule)} & ${cell(P6.SECONDARY, 'rules', rule)} \\\\`).join('\n') + '\n');
  const opened = JSON.parse(fs.readFileSync(path.join(fb.study.studyDir, 'd3-opened.json'), 'utf8'));
  const f23 = (r) => (r.breaksAfterTaskAt ?? []).some((f) => ['local/readonly-props', 'local/shared-date-formatting'].includes(f.ruleId));
  const fbProse = fb.runs.filter((r) => r.ok && P6.PRIMARY.includes(r.model) && r.arm === 'prose');
  const yes = fbProse.filter((r) => opened[r.id] === true), no = fbProse.filter((r) => opened[r.id] === false);
  macro('PSixOpened', frac(yes.length, fbProse.length));
  macro('PSixOpenedViol', frac(yes.filter(f23).length, yes.length)); macro('PSixNotOpenedViol', frac(no.filter(f23).length, no.length));

  // measurement checks
  const cc = P6.checkerCounts(all, labels);
  for (const [name, st] of [['BP', 'bulletproof-conventions'], ['FB', 'formbricks-conventions']]) {
    const { cells, tp, fp, fn } = cc[st];
    macro(`PSix${name}Cells`, cells);
    macro(`PSix${name}Precision`, frac(tp, tp + fp)); macro(`PSix${name}PrecisionCI`, cpi(tp, tp + fp));
    macro(`PSix${name}Recall`, frac(tp, tp + fn)); macro(`PSix${name}RecallCI`, cpi(tp, tp + fn));
  }
  // bulletproof: the disagreements of checker and labels by convention (checker only = fp, labels only = fn)
  const by = { fp: {}, fn: {} };
  for (const row of labels.diffRows.filter((r) => r.study === 'bulletproof-conventions')) {
    const run = bp.runs.find((r) => r.id === labels.key.diffs[row.code]?.run);
    const checker = (run?.breaksAfterTaskAt ?? []).some((f) => f.ruleId === `local/${row.convention}`);
    const k = checker && row.violated === 'no' ? 'fp' : !checker && row.violated === 'yes' ? 'fn' : null;
    if (k) by[k][row.convention] = (by[k][row.convention] ?? 0) + 1;
  }
  macro('PSixBPFpRole', by.fp['role-checks-through-authorization'] ?? 0);
  macro('PSixBPFnNoAny', by.fn['no-any'] ?? 0); macro('PSixBPFnZod', by.fn['input-types-from-zod'] ?? 0);
  macro('PSixBPFnOther', Object.entries(by.fn).filter(([c]) => !['no-any', 'input-types-from-zod'].includes(c)).reduce((a, [, n]) => a + n, 0));
  const loop = P6.falseLabels(labels, 'loop'), after = P6.falseLabels(labels, 'after-task');
  macro('PSixLoopFalse', frac(loop.f, loop.n)); macro('PSixLoopFalseCI', cpi(loop.f, loop.n));
  macro('PSixAfterFalse', frac(after.f, after.n)); macro('PSixAfterFalseCI', cpi(after.f, after.n));
  for (const [name, i] of [['BP', 0], ['FB', 1]]) {
    const e = P6.ruleEffortCounts(all[i].study);
    macro(`PSix${name}Conventions`, e.conventions); macro(`PSix${name}LOC`, e.loc); macro(`PSix${name}Cases`, e.cases);
  }

  // D1: the newest models, descriptive
  const d1 = [];
  for (const { study, runs } of all) for (const m of P6.EXPLORATORY) {
    const c = (arm) => { const rs = runs.filter((r) => r.ok && r.model === m && r.arm === arm); return [frac(rs.filter((r) => P6.violating(r)).length, rs.length), avg(rs.map((r) => r.turns)).toFixed(1)]; };
    const [p, pt] = c('prose'), [q, qt] = c('rules');
    d1.push(`${PROJ[study.name]} & ${MODEL[m]} & ${p} & ${q} & ${pt} & ${qt} \\\\`);
  }
  fs.writeFileSync(path.join(out, 'plan6-latest.tex'), d1.join('\n') + '\n');
}

// ---- Plan 7 (registered on OSF): the same calls as bench/plan7.mjs, which writes studies/plan-7-results.md.
// Its runs are not in the totals above, which the LLM4Code version (main.tex) also uses.
{
  const runs = P7.load();
  const ss = P7.strata(runs, P7.PRIMARY);
  const sum = (k, s = ss) => s.reduce((a, x) => a + x[k], 0);
  const frac = (a, b) => `${a}/${b}`;
  const h16 = exactUpper(ss);
  const h17 = P6.costRatio(ss), h17task = P6.costRatio(ss, (r) => r.taskCost);
  const adj = P6.holm({ H16: h16, H17: h17.p });
  if (adj.H16 > 0.05 || adj.H17 <= 0.05) throw new Error('Plan 7: a hypothesis decision changed; update the text');
  const ok = runs.filter((r) => r.ok && P7.PRIMARY.includes(r.model));
  macro('PSevenRuns', ok.length);
  macro('NTotalRunsEMSE', totals.runs + ok.length);
  macro('NTotalSessionsEMSE', totals.sessions + sessions(ok));
  macro('PSevenCost', `\\$${ok.reduce((a, r) => a + r.taskCost + r.fixCost, 0).toFixed(0)}`);
  macro('HSixteenProse', frac(sum('x1'), sum('n1'))); macro('HSixteenRules', frac(sum('x2'), sum('n2')));
  macro('HSixteenP', p3(h16)); macro('HSixteenHolm', p3(adj.H16));
  macro('HSeventeenCost', pct(h17.point)); macro('HSeventeenCI', ci(h17.ci)); macro('HSeventeenP', p3(h17.p)); macro('HSeventeenHolm', p3(adj.H17));
  macro('HSeventeenTaskCost', pct(h17task.point)); macro('HSeventeenTaskCI', ci(h17task.ci));
  // deviation D1: only findings of the six study rules count, not linter errors
  const d1 = P7.strata(runs, P7.PRIMARY, (r) => (r.breaksAfterTaskAt ?? []).some((f) => f.ruleId.startsWith('local/')));
  macro('PSevenDOneProse', frac(sum('x1', d1), sum('n1', d1))); macro('PSevenDOneP', p3(exactUpper(d1)));
  const has = (r, id) => (r.breaksAfterTaskAt ?? []).some((f) => f.ruleId === `local/${id}`);
  for (const [name, id] of [['AsCast', 'no-as-cast'], ['Manager', 'no-manager-in-business-logic'], ['Helpers', 'shared-helpers']]) {
    macro(`PSeven${name}`, ok.filter((r) => r.arm === 'prose' && has(r, id)).length);
  }
  const MODEL = { sonnet: 'Sonnet 5.5', haiku: 'Haiku 5.5' };
  const total = (r) => r.taskCost + r.fixCost;
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const rules = ok.filter((r) => r.arm === 'rules');
  macro('PSevenLoopRuns', rules.filter((r) => r.hookCatches > 0).length);
  macro('PSevenIgnoredRuns', rules.filter((r) => r.ignoredCatches > 0).length);
  macro('PSevenProseLeft', ok.filter((r) => r.arm === 'prose' && r.breaksFinal > 0).length);
  macro('PSevenTurnsProse', avg(ok.filter((r) => r.arm === 'prose').map((r) => r.turns)).toFixed(1));
  macro('PSevenTurnsRules', avg(rules.map((r) => r.turns)).toFixed(1));
  fs.writeFileSync(path.join(out, 'plan7.tex'), ss.map((s) => `${MODEL[s.model]} & ${s.task} & ${s.x1}/${s.n1} & ${s.x2}/${s.n2} & ${p3(exactUpper([s]))} & ${pct(avg(s.y.map(total)) / avg(s.x.map(total)))} \\\\`).join('\n') + '\n');
}

fs.writeFileSync(path.join(out, 'macros.tex'), macros.join('\n') + '\n');
console.log(`wrote ${fs.readdirSync(out).length} files to paper/generated (${claudeRuns.length} Claude Code runs)`);
