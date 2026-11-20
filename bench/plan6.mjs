#!/usr/bin/env node
// The registered analysis of Plan 6 (studies/plan-6.md) and the analyses its deviations add
// (studies/plan-6-deviations.md). Writes studies/plan-6-results.md. Seeded, so the same data gives the same numbers.
//
//   node bench/plan6.mjs [--out file.md]
//
// A run violates when the checker reports at least one finding on an added line after the task session, before any
// review fix (breaksAfterTaskAt); the checker config of each study already leaves out the files a convention does
// not cover. The parts that need hand labels (D2, D5, measurement checks) say "pending" until their inputs exist.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadStudy } from './config.mjs';
import { loadResults } from './summarize.mjs';
import { clopperPearson, exactUpper } from './compare.mjs';
import { mean, resampleMean, rng } from './pool.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const STUDIES = ['bulletproof-conventions', 'formbricks-conventions'].map((s) => path.join(ROOT, 'studies', s, 'study.json'));
export const LABELS = path.join(ROOT, 'studies', 'plan-6-labels');
// The key that maps label codes to runs stays outside the repo until the labels are done, so the labeller cannot see the arm.
export const KEY_PATHS = [path.join(LABELS, 'key.json'), path.join(os.homedir(), '.cache', 'agent-rules-bench', 'plan6-label-key.json')];
export const PRIMARY = ['sonnet', 'haiku'];
export const SECONDARY = ['qwen36codex'];
export const EXPLORATORY = ['opus55', 'fable52']; // D1
export const SEED = 20261114;
const ITERATIONS = 10000, MARGIN = [0.9, 1.1], ALPHA = 0.05;
// D3: where the Formbricks prose of each convention is
export const PROSE_LOCATION = {
  'local/no-new-server-actions': 'AGENTS.md (loaded)', 'local/en-us-locale-only': 'AGENTS.md (loaded)',
  'local/readonly-props': 'CODING_STANDARDS.md (not loaded)', 'local/shared-date-formatting': 'CODING_STANDARDS.md (not loaded)',
};

export const findingKey = (study, run, f) => `${study}|${run}|${f.ruleId}|${f.file}|${f.line}`;
const findings = (r) => r.breaksAfterTaskAt ?? null;
export function violating(r, falsePositives = new Set()) {
  const fs_ = findings(r);
  if (!fs_) return r.breaksAfterTask > 0; // no located findings: nothing can be excluded
  return fs_.some((f) => !falsePositives.has(findingKey(r.study, r.id, f)));
}
const total = (r) => r.taskCost + r.fixCost;
const geo = (xs) => Math.exp(mean(xs.map(Math.log)));

// Holm's step-down adjustment: adjusted p-values, compared with alpha.
export function holm(ps) {
  const sorted = Object.entries(ps).sort((a, b) => a[1] - b[1]);
  const out = {};
  let prev = 0;
  sorted.forEach(([k, p], i) => { prev = Math.max(prev, Math.min(1, (sorted.length - i) * p)); out[k] = prev; });
  return out;
}

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];

// Two one-sided tests on bootstrap ratios: the 90% interval must lie inside the margin; the TOST p-value is the
// larger of the two one-sided bootstrap p-values.
export function tost(boot, [lo, hi] = MARGIN) {
  const s = [...boot].sort((a, b) => a - b);
  const ci = [quantile(s, 0.05), quantile(s, 0.95)];
  const p = Math.max(s.filter((b) => b <= lo).length / s.length, s.filter((b) => b >= hi).length / s.length);
  return { ci, p, equivalent: ci[0] > lo && ci[1] < hi };
}

export function loadAll(files = STUDIES) {
  return files.map((f) => {
    const study = loadStudy(f);
    return { study, runs: loadResults(study.resultsDir).map((r) => ({ ...r, study: study.name })) };
  });
}

// prose against rules per project x model; x = prose, y = rules (H12 asks whether prose violates more)
export function strata(all, models, fp) {
  const out = [];
  for (const { study, runs } of all) {
    for (const model of models) {
      const side = (arm) => runs.filter((r) => r.ok && r.model === model && r.arm === arm);
      const x = side('prose'), y = side('rules');
      if (!x.length || !y.length) continue;
      out.push({ study: study.name, model, x, y, n1: x.length, n2: y.length, x1: x.filter((r) => violating(r, fp)).length, x2: y.filter((r) => violating(r, fp)).length });
    }
  }
  return out;
}

// H13: geometric mean over strata of the rules / prose ratio of mean cost, stratified bootstrap
export function costRatio(ss, cost = total, { seed = SEED, iterations = ITERATIONS } = {}) {
  const priced = ss.filter((s) => mean(s.x.map(cost)) > 0);
  const rand = rng(seed);
  const point = geo(priced.map((s) => mean(s.y.map(cost)) / mean(s.x.map(cost))));
  const boot = Array.from({ length: iterations }, () => geo(priced.map((s) => resampleMean(s.y.map(cost), rand) / resampleMean(s.x.map(cost), rand))));
  return { point, ...tost(boot) };
}

// --- verify (H15 and D5)

// Production code passes: the run passed verify, or passed it without the agent's own tests (as summarize.mjs counts).
export const verifyOk = (r) => (r.verify ? Boolean(r.verify.ok || r.verify.withoutOwnTests?.ok) : null);
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
// Failing test files in a verify-tests log: Formbricks prints them under "outside the baseline", Vitest prints FAIL lines.
// ponytail: union over all attempts of a retried step; a file that failed once and then passed counts as failing,
// which can only make D5 stricter.
export function failingTestFiles(log) {
  const files = new Set();
  const lines = strip(log).split('\n');
  lines.forEach((l, i) => {
    const fail = l.match(/^\s*FAIL\s+(\S+\.(?:test|spec)\.[jt]sx?)/);
    if (fail) files.add(fail[1]);
    if (/outside the baseline: [1-9]/.test(l)) for (let j = i + 1; j < lines.length && /^ {2}\S+\.(?:test|spec)\.[jt]sx?$/.test(lines[j]); j++) files.add(lines[j].trim());
  });
  return [...files];
}

// D5: a variant passes when its type check passed and its tests passed or failed only in excluded test files.
export function verifyOkD5(r, dir, excluded) {
  if (!r.verify) return null;
  if (!excluded.length) return verifyOk(r);
  const variant = (v, suffix) => {
    if (!v || !v.steps?.typecheck?.ok) return false;
    if (v.steps.tests?.ok) return true;
    const log = path.join(dir, r.id, `verify-tests${suffix}.log`);
    if (!fs.existsSync(log) || v.steps.tests?.timedOut) return false;
    const failing = failingTestFiles(fs.readFileSync(log, 'utf8'));
    return failing.length > 0 && failing.every((f) => excluded.includes(f));
  };
  return variant(r.verify, '') || variant(r.verify.withoutOwnTests, '-without-own-tests');
}

// --- labels

// Minimal CSV: commas, quotes and newlines inside quoted fields.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return (body ?? []).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
export const csvRow = (xs) => xs.map((x) => (/[",\n]/.test(String(x)) ? `"${String(x).replaceAll('"', '""')}"` : String(x))).join(',');

export function loadLabels() {
  const keyFile = KEY_PATHS.find((p) => fs.existsSync(p));
  if (!keyFile) return null;
  const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  const read = (f) => (fs.existsSync(path.join(LABELS, f)) ? parseCsv(fs.readFileSync(path.join(LABELS, f), 'utf8')) : []);
  const findingRows = read('findings.csv').filter((r) => ['correct', 'false'].includes(r.label) && r.rule.startsWith('local/'));
  const diffRows = Object.keys(key.diffs ?? {}).length ? [...new Set(Object.values(key.diffs).map((d) => d.study))].flatMap((s) => read(`diffs-${s}.csv`).map((r) => ({ ...r, study: s }))).filter((r) => ['yes', 'no'].includes(r.violated)) : [];
  // where the code shown with each finding came from (findings.md): exact, moved (a later state of the file), or not recoverable
  const md = fs.existsSync(path.join(LABELS, 'findings.md')) ? fs.readFileSync(path.join(LABELS, 'findings.md'), 'utf8') : '';
  const shown = Object.fromEntries([...md.matchAll(/^## (X\d+): .*\n\n.*; code from (.*)\.$/gm)].map(([, c, src]) => [c, src.includes('not recoverable') ? 'not recoverable' : src.includes('may have moved') ? 'moved' : 'exact']));
  return { key, shown, findingRows, diffRows, findingsTotal: Object.keys(key.findings ?? {}).length, diffCells: read('diffs-bulletproof-conventions.csv').length + read('diffs-formbricks-conventions.csv').length };
}

// --- report

const p3 = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));
const pct = (r) => { const v = Math.round((r - 1) * 100); return v === 0 ? '0%' : `${v > 0 ? '+' : ''}${v}%`; };
const ci95 = (k, n) => { if (!n) return '-'; const [lo, hi] = clopperPearson(k, n); return `${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%`; };
const frac = (k, n) => `${k}/${n}`;

function h12Section(ss, title) {
  const lines = [`| project | model | prose violating | rules violating | Fisher p (one-sided) |`, '|---|---|---|---|---|'];
  for (const s of ss) lines.push(`| ${s.study} | ${s.model} | ${frac(s.x1, s.n1)} (${ci95(s.x1, s.n1)}) | ${frac(s.x2, s.n2)} (${ci95(s.x2, s.n2)}) | ${p3(exactUpper([s]))} |`);
  const x1 = ss.reduce((a, s) => a + s.x1, 0), n1 = ss.reduce((a, s) => a + s.n1, 0), x2 = ss.reduce((a, s) => a + s.x2, 0), n2 = ss.reduce((a, s) => a + s.n2, 0);
  return { p: exactUpper(ss), x1, n1, x2, n2, md: [`### ${title}`, '', `Pooled: prose ${frac(x1, n1)} (${(100 * x1 / n1).toFixed(1)}%), rules ${frac(x2, n2)} (${(100 * x2 / n2).toFixed(1)}%); risk difference ${(100 * (x1 / n1 - x2 / n2)).toFixed(1)} percentage points; exact conditional CMH, one-sided: p = ${p3(exactUpper(ss))}.`, '', ...lines, ''].join('\n') };
}

function describeRows(all, models, label, verifyFn = (r) => verifyOk(r)) {
  const rows = ['| project | model | arm | runs | capped | violating | mean violations | runs left violating at the end | loop catches (runs) | ignored catches (runs) | mean turns | verify passes |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const { study, runs } of all) {
    for (const model of models) {
      for (const arm of ['prose', 'rules']) {
        const rs = runs.filter((r) => r.ok && r.model === model && r.arm === arm);
        if (!rs.length) continue;
        const v = rs.map(verifyFn).filter((x) => x !== null);
        const ok = v.filter(Boolean).length;
        rows.push(`| ${study.name} | ${model} | ${arm} | ${rs.length} | ${rs.filter((r) => r.capped).length} | ${rs.filter((r) => violating(r)).length} | ${mean(rs.map((r) => r.breaksAfterTask)).toFixed(2)} | ${rs.filter((r) => r.breaksFinal > 0).length} | ${arm === 'rules' ? rs.filter((r) => r.hookCatches > 0).length : '-'} | ${arm === 'rules' ? rs.filter((r) => r.ignoredCatches > 0).length : '-'} | ${mean(rs.map((r) => r.turns)).toFixed(1)} | ${v.length ? `${frac(ok, v.length)} (${ci95(ok, v.length)})` : 'not verified'} |`);
      }
    }
  }
  return [`### ${label}`, '', ...rows, ''].join('\n');
}

function verifySection(all, models, verifyFn) {
  const rows = ['| project | arm | verify passes | exact 95% interval |', '|---|---|---|---|'];
  for (const { study, runs } of all) {
    for (const arm of ['prose', 'rules']) {
      const v = runs.filter((r) => r.ok && models.includes(r.model) && r.arm === arm).map((r) => verifyFn(r, study)).filter((x) => x !== null);
      const ok = v.filter(Boolean).length;
      rows.push(`| ${study.name} | ${arm} | ${frac(ok, v.length)} | ${ci95(ok, v.length)} |`);
    }
  }
  return rows.join('\n');
}

function d3Section(all) {
  const fb = all.find((a) => a.study.name === 'formbricks-conventions');
  if (!fb) return '';
  const opened = (() => { const f = path.join(fb.study.studyDir, 'd3-opened.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; })();
  const lines = ['## D3: Formbricks per convention, with the prose location (descriptive)', '', 'Runs with at least one finding of the convention after the task.', ''];
  const models = [...PRIMARY, ...SECONDARY, ...EXPLORATORY];
  lines.push(`| convention | prose location | ${models.map((m) => `${m} prose | ${m} rules`).join(' | ')} |`, `|---|---|${models.map(() => '---|---').join('|')}|`);
  for (const [rule, where] of Object.entries(PROSE_LOCATION)) {
    const cell = (m, arm) => { const rs = fb.runs.filter((r) => r.ok && r.model === m && r.arm === arm); const k = rs.filter((r) => (r.breaksAfterTaskAt ?? []).some((f) => f.ruleId === rule)).length; return rs.length ? `${frac(k, rs.length)} (${ci95(k, rs.length)})` : '-'; };
    lines.push(`| ${rule} | ${where} | ${models.map((m) => `${cell(m, 'prose')} | ${cell(m, 'rules')}`).join(' | ')} |`);
  }
  lines.push('');
  if (!opened) return [...lines, 'Mechanism check: pending (`node bench/plan6-prepare.mjs` writes `formbricks-conventions/d3-opened.json` from the session logs).', ''].join('\n');
  lines.push('Mechanism check (exploratory): `prose` runs that opened `CODING_STANDARDS.md` during the task session (a Read, shell or search call on that file), and the runs among them with a finding of F2 or F3 (`readonly-props`, `shared-date-formatting`).', '');
  lines.push('| model | opened | F2/F3 violating when opened | not opened | F2/F3 violating when not opened | no session log |', '|---|---|---|---|---|---|');
  const f23 = (r) => (r.breaksAfterTaskAt ?? []).some((f) => ['local/readonly-props', 'local/shared-date-formatting'].includes(f.ruleId));
  for (const m of models) {
    const rs = fb.runs.filter((r) => r.ok && r.model === m && r.arm === 'prose');
    if (!rs.length) continue;
    const yes = rs.filter((r) => opened[r.id] === true), no = rs.filter((r) => opened[r.id] === false), unknown = rs.filter((r) => typeof opened[r.id] !== 'boolean');
    lines.push(`| ${m} | ${frac(yes.length, rs.length)} | ${frac(yes.filter(f23).length, yes.length)} | ${frac(no.length, rs.length)} | ${frac(no.filter(f23).length, no.length)} | ${unknown.length} |`);
  }
  return [...lines, ''].join('\n');
}

function measurementSection(all, labels) {
  const lines = ['## Measurement checks', ''];
  if (!labels) return [...lines, 'Pending: no label key yet (`node bench/plan6-prepare.mjs`).', ''].join('\n');
  const { key, findingRows, diffRows, findingsTotal, diffCells } = labels;
  const linterErrors = Object.values(key.findings).filter((k) => !k.ruleId.startsWith('local/')).length;
  lines.push(`Labels filled: findings ${findingRows.length}/${findingsTotal - linterErrors}, diff cells ${diffRows.length}/${diffCells}.`);
  if (linterErrors) lines.push(`${linterErrors} loop findings are linter errors (for example a parse error in half-edited code), not convention findings; they are not labelled and not counted.`);
  lines.push('');
  // checker precision and recall on the blind diff sample, per project: a cell is (diff, convention)
  for (const { study, runs } of all) {
    const rows = diffRows.filter((r) => r.study === study.name);
    if (!rows.length) continue;
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (const row of rows) {
      const run = runs.find((r) => r.id === key.diffs[row.code]?.run);
      if (!run) continue;
      const checker = (run.breaksAfterTaskAt ?? []).some((f) => f.ruleId === `local/${row.convention}`);
      const human = row.violated === 'yes';
      if (checker && human) tp++; else if (checker) fp++; else if (human) fn++; else tn++;
    }
    lines.push(`- ${study.name}, ${rows.length} labelled cells: precision ${tp + fp ? `${frac(tp, tp + fp)} (${ci95(tp, tp + fp)})` : '-'}, recall ${tp + fn ? `${frac(tp, tp + fn)} (${ci95(tp, tp + fn)})` : '-'} (true negatives ${tn}).`);
  }
  // false-positive rate of the findings, by kind
  // Only findings labelled against the code the checker saw count. A "moved" finding showed a later state of the file
  // (a Codex loop finding: the log has no time to place it), so its label judges that later code, not the finding.
  const shownOf = (r) => labels.shown?.[r.code] ?? 'exact';
  for (const kind of ['loop', 'after-task']) {
    const all_ = findingRows.filter((r) => key.findings[r.code]?.kind === kind && (kind === 'after-task' || key.findings[r.code]?.arm === 'rules'));
    const rows = all_.filter((r) => shownOf(r) === 'exact');
    const f = rows.filter((r) => r.label === 'false').length;
    if (rows.length) lines.push(`- ${kind === 'loop' ? 'Loop findings (rules arm)' : 'Findings after the task (both arms)'}, labelled against the flagged code: ${frac(f, rows.length)} labelled false (${ci95(f, rows.length)}).`);
    const moved = all_.filter((r) => shownOf(r) === 'moved');
    if (moved.length) lines.push(`  ${moved.length} more were shown with a later state of the file (the flagged line may have moved or been fixed since); their labels (${moved.filter((r) => r.label === 'false').length} false, ${moved.filter((r) => r.label === 'correct').length} correct) judge that later code and are left out of the rate.`);
  }
  const lost = Object.entries(key.findings).filter(([c]) => labels.shown?.[c] === 'not recoverable').length;
  if (lost) lines.push(`- ${lost} findings could not be shown: their code could not be rebuilt from the run and its logs (\`studies/plan-6-labels/after-task-replay.json\`). They are not labelled.`);
  return [...lines, ''].join('\n');
}

function ruleEffort(all) {
  const lines = ['## Rule effort', '', '| project | conventions | rule source lines (plugin/, without tests) | test cases (valid + invalid) |', '|---|---|---|---|'];
  for (const { study } of all) {
    const dir = path.join(study.studyDir, 'plugin');
    const src = fs.readdirSync(dir).filter((f) => /\.(m?js)$/.test(f)).map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
    const loc = src.join('\n').split('\n').filter((l) => l.trim() && !/^\s*\/\//.test(l)).length;
    const cases = src.join('\n').match(/\{\s*filename:/g)?.length ?? 0;
    const n = (src.join('\n').match(/^\s*id: '/gm) ?? []).length;
    lines.push(`| ${study.name} | ${n} | ${loc} | ${cases} |`);
  }
  lines.push('', 'Lines are non-empty, non-comment lines of every file in `plugin/`, including the prose text and the examples of each convention; a per-convention count needs the hand split listed in the measurement checks.', '');
  return lines.join('\n');
}

export function analyse(all = loadAll()) {
  const labels = loadLabels();
  const fpSet = new Set();
  if (labels) for (const r of labels.findingRows) { const k = labels.key.findings[r.code]; if (r.label === 'false' && k?.kind === 'after-task') fpSet.add(findingKey(k.study, k.run, k)); }
  const out = ['# Plan 6: results', '', `Generated by \`node bench/plan6.mjs\` from the result files; seed ${SEED}, ${ITERATIONS} bootstrap resamples. Registered plan: \`studies/plan-6.md\`; deviations: \`studies/plan-6-deviations.md\`.`, ''];
  const notOk = all.flatMap(({ runs }) => runs.filter((r) => !r.ok && [...PRIMARY, ...SECONDARY].includes(r.model)));
  if (notOk.length) out.push(`Runs left out because their session failed: ${notOk.map((r) => `${r.study}/${r.id}`).join(', ')}.`, '');

  // confirmatory family
  const ss = strata(all, PRIMARY);
  const h12 = h12Section(ss, 'H12: prose has more violating runs than rules (primary models)');
  const h13 = costRatio(ss);
  const h13task = costRatio(ss, (r) => r.taskCost);
  const adj = holm({ H12: h12.p, H13: h13.p });
  out.push('## Confirmatory: H12 and H13 (Holm, family-wise alpha 0.05)', '', h12.md);
  out.push('### H13: the cost of rules is equivalent to the cost of prose within 10%', '');
  out.push(`- Total cost (task plus review fix), rules / prose: ${pct(h13.point)}; 90% stratified bootstrap interval ${pct(h13.ci[0])} to ${pct(h13.ci[1])}; margin -10% to +10%; TOST p = ${p3(h13.p)}.`);
  out.push(`- Task session only (without the review fix): ${pct(h13task.point)}; 90% interval ${pct(h13task.ci[0])} to ${pct(h13task.ci[1])}.`, '');
  out.push('| hypothesis | p | Holm-adjusted p | holds at 0.05 |', '|---|---|---|---|');
  out.push(`| H12 | ${p3(h12.p)} | ${p3(adj.H12)} | ${adj.H12 <= ALPHA ? 'yes' : 'no'} |`, `| H13 | ${p3(h13.p)} | ${p3(adj.H13)} | ${adj.H13 <= ALPHA ? 'yes' : 'no'} |`, '');
  out.push('Cost per stratum (rules / prose, ratio of mean total cost):', '', '| project | model | prose mean | rules mean | change |', '|---|---|---|---|---|');
  for (const s of ss) { const a = mean(s.x.map(total)), b = mean(s.y.map(total)); out.push(`| ${s.study} | ${s.model} | $${a.toFixed(3)} | $${b.toFixed(3)} | ${pct(b / a)} |`); }
  out.push('');

  // secondary
  const sec = strata(all, SECONDARY);
  const pooled = sec.length ? [{ x1: sec.reduce((a, s) => a + s.x1, 0), n1: sec.reduce((a, s) => a + s.n1, 0), x2: sec.reduce((a, s) => a + s.x2, 0), n2: sec.reduce((a, s) => a + s.n2, 0) }] : [];
  out.push('## Secondary: H14 (local model in Codex, outside the family)', '');
  if (pooled.length) out.push(`Pooled over both projects: prose ${frac(pooled[0].x1, pooled[0].n1)}, rules ${frac(pooled[0].x2, pooled[0].n2)}; exact Fisher test, one-sided: p = ${p3(exactUpper(pooled))}.`, '', h12Section(sec, 'Per project').md);

  // H15
  out.push('## H15: verify pass rate per arm (descriptive guard)', '', 'Verify passes when the type check and the project\'s tests pass, or pass without the agent\'s own tests.', '');
  out.push('Primary models:', '', verifySection(all, PRIMARY, (r) => verifyOk(r)), '', 'Local model:', '', verifySection(all, SECONDARY, (r) => verifyOk(r)), '');

  // secondary outcomes, every stratum
  out.push('## Secondary outcomes per stratum', '', describeRows(all, PRIMARY, 'Primary models'), describeRows(all, SECONDARY, 'Local model'), describeRows(all, EXPLORATORY, 'D1: exploratory models (descriptive only)'));

  // D2
  out.push('## D2: H12 without the findings labelled as false positives (sensitivity)', '');
  if (!labels || !labels.findingRows.length) out.push('Pending: the findings are not labelled yet (`studies/plan-6-labels/findings.csv`).', '');
  else {
    const done = labels.findingRows.filter((r) => labels.key.findings[r.code]?.kind === 'after-task').length;
    const need = Object.values(labels.key.findings).filter((k) => k.kind === 'after-task').length;
    const lost = Object.entries(labels.key.findings).filter(([c, k]) => k.kind === 'after-task' && labels.shown?.[c] === 'not recoverable').length;
    out.push(`${done} of ${need} findings after the task are labelled; ${lost} could not be shown (see the measurement checks) and ${need - done - lost} were left unlabelled. Every finding that is not labelled false stays counted as a violation.`, '');
    out.push(`${fpSet.size} findings after the task are labelled false and left out.`, '', h12Section(strata(all, PRIMARY, fpSet), 'H12 without the false positives (primary models)').md, h12Section(strata(all, SECONDARY, fpSet), 'Local model without the false positives').md);
  }

  // D3
  out.push(d3Section(all));

  // D5
  out.push('## D5: verify without the tests the task itself breaks (sensitivity)', '');
  const excl = Object.fromEntries(all.map(({ study }) => { const f = path.join(study.studyDir, 'd5-excluded-tests.json'); return [study.name, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null]; }));
  if (Object.values(excl).some((e) => e === null)) out.push(`Pending: \`d5-excluded-tests.json\` is missing in ${Object.entries(excl).filter(([, e]) => e === null).map(([s]) => s).join(', ')} (written after the minimal correct solutions are verified).`, '');
  else {
    for (const [s, e] of Object.entries(excl)) out.push(`- ${s}: ${Object.entries(e).map(([t, fs_]) => `${t}: ${fs_.length ? fs_.map((f) => `\`${f}\``).join(', ') : 'none'}`).join('; ')}`);
    const fn = (r, study) => verifyOkD5(r, study.resultsDir, excl[study.name][r.task] ?? []);
    out.push('', 'Primary models:', '', verifySection(all, PRIMARY, fn), '', 'Local model:', '', verifySection(all, SECONDARY, fn), '');
  }

  out.push(measurementSection(all, labels), ruleEffort(all));
  return out.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--out');
  const out = i > 0 ? process.argv[i + 1] : path.join(ROOT, 'studies', 'plan-6-results.md');
  const md = analyse();
  fs.writeFileSync(out, md + '\n');
  console.log(`wrote ${out}`);
}
