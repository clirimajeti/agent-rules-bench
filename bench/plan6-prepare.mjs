#!/usr/bin/env node
// Writes the inputs of Plan 6 that need the session logs or a blind draw, once:
//   - studies/plan-6-labels/: the blind label sheets of the measurement checks and of D2
//       diffs-<study>.csv + diffs/<code>.patch  40 diffs per project, drawn with the study seed, arm hidden
//       findings.csv + findings.md              every checker finding after the task (both arms) and every loop
//                                               finding of the rules arm, in a seeded random order, arm hidden
//       conventions-<study>.md                  the text of each convention, to label against
//   - the key from codes to runs: ~/.cache/agent-rules-bench/plan6-label-key.json, kept outside the repo until the labels were done, then moved to studies/plan-6-labels/key.json
//   - studies/formbricks-conventions/d3-opened.json: whether each prose run opened CODING_STANDARDS.md (D3)
//
//   node bench/plan6-prepare.mjs [--force]
//
// Session logs: Claude Code keeps them in ~/.claude/projects (deleted after about 30 days); a copy is looked for in
// ~/.cache/agent-rules-bench/transcripts. Codex runs keep theirs in the run folder (task.events.jsonl).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { rng } from './pool.mjs';
import { EXPLORATORY, KEY_PATHS, LABELS as LABELS_6, PRIMARY, SECONDARY, SEED as SEED_6, csvRow, loadAll } from './plan6.mjs';

const SAMPLE = 40;
const TRANSCRIPT_ROOTS = [path.join(os.homedir(), '.claude', 'projects'), path.join(os.homedir(), '.cache', 'agent-rules-bench', 'transcripts')];

export function shuffle(xs, seed) {
  const rand = rng(seed), a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// New-file lines of a unified diff, per file: Map(line number -> { text, added }).
export function patchLines(patch) {
  const files = new Map();
  let cur = null, n = 0;
  for (const l of patch.split('\n')) {
    if (l.startsWith('+++ ')) { const f = l.slice(4).replace(/^b\//, ''); cur = f === '/dev/null' ? null : new Map(); if (cur) files.set(f, cur); continue; }
    if (l.startsWith('diff --git') || l.startsWith('--- ')) continue;
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (h) { n = Number(h[1]); continue; }
    if (!cur) continue;
    if (l.startsWith('+')) cur.set(n++, { text: l.slice(1), added: true });
    else if (l.startsWith(' ')) cur.set(n++, { text: l.slice(1), added: false });
  }
  return files;
}

// The whole file, flagged line marked with >>, added lines with +.
const around = (lines, line) => [...lines.keys()].sort((a, b) => a - b)
  .map((i) => `${i === line ? '>>' : '  '} ${String(i).padStart(4)} ${lines.get(i).added ? '+' : ' '} ${lines.get(i).text}`).join('\n');

// The final version of every file in a diff, whole: base lines (readBase(file) -> text, '' for a new file) with the hunks applied.
// Map(file -> Map(line number -> { text, added })).
export function finalFiles(patch, readBase) {
  const files = new Map();
  for (const sec of patch.split(/^diff --git .*$/m).slice(1)) {
    const to = sec.match(/^\+\+\+ (?:b\/)?(.*)$/m)?.[1];
    if (!to || to === '/dev/null') continue;
    const from = sec.match(/^--- (?:a\/)?(.*)$/m)?.[1];
    const base = from && from !== '/dev/null' ? readBase(from).split('\n') : [];
    if (base.at(-1) === '') base.pop();
    const out = new Map();
    let o = 1, n = 1;
    const keep = () => { out.set(n++, { text: base[o - 1] ?? '', added: false }); o++; };
    for (const h of sec.split(/^(?=@@ )/m).slice(1)) {
      const [head, ...body] = h.split('\n');
      const oldStart = Number(head.match(/^@@ -(\d+)/)[1]);
      while (o < oldStart) keep();
      for (const l of body) {
        if (l.startsWith('+')) out.set(n++, { text: l.slice(1), added: true });
        else if (l.startsWith('-')) o++;
        else if (l.startsWith(' ')) { out.set(n++, { text: l.slice(1), added: false }); o++; }
      }
    }
    while (o <= base.length) keep();
    files.set(to, out);
  }
  return files;
}

const gitBase = (copy) => (file) => {
  const r = spawnSync('git', ['show', `bench-base:${file}`], { cwd: copy, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`no base of ${file} in ${copy}: ${r.stderr}`);
  return r.stdout;
};

export function transcriptIndex() {
  const idx = new Map();
  for (const root of TRANSCRIPT_ROOTS) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root)) {
      const dir = path.join(root, d);
      if (!fs.statSync(dir).isDirectory()) { if (d.endsWith('.jsonl') && !idx.has(d.slice(0, -6))) idx.set(d.slice(0, -6), dir); continue; }
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.jsonl') && !idx.has(f.slice(0, -6))) idx.set(f.slice(0, -6), path.join(dir, f));
    }
  }
  return idx;
}

export const readJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

// The tool calls of a run's task session: [{ ts, name, input }] (Claude Code) or [{ ts: null, name: 'shell', input: { command } }] (Codex).
export function toolCalls(runDir, idx) {
  const events = path.join(runDir, 'task.events.jsonl');
  if (fs.existsSync(events)) return readJsonl(events).filter((e) => e.item?.type === 'command_execution' && e.type === 'item.started').map((e) => ({ ts: null, name: 'shell', input: { command: e.item.command } }));
  const task = path.join(runDir, 'task.json');
  if (!fs.existsSync(task)) return null;
  let id;
  try { id = JSON.parse(fs.readFileSync(task, 'utf8')).session_id; } catch { return null; }
  const f = id && idx.get(id);
  if (!f) return null;
  return readJsonl(f).flatMap((e) => (Array.isArray(e.message?.content) ? e.message.content.filter((b) => b.type === 'tool_use').map((b) => ({ ts: e.timestamp, name: b.name, input: b.input ?? {} })) : []));
}

// Each convention with its text (plugin/conventions.mjs) and its scope, read from the study's own ESLint config.
export async function loadConventions(studyDir) {
  const { conventions, ruleText } = await import(pathToFileURL(path.join(studyDir, 'plugin', 'conventions.mjs')).href);
  const config = (await import(pathToFileURL(path.join(studyDir, 'eslint.config.mjs')).href)).default;
  return conventions.map((c) => {
    const id = `local/${c.id}`;
    const entries = config.filter((e) => e.rules && id in e.rules);
    const inScope = (f) => entries.some((e) => e.files.some((g) => path.matchesGlob(f, g)) && !(e.ignores ?? []).some((g) => path.matchesGlob(f, g)));
    return { id: c.id, prose: ruleText[id], inScope };
  });
}

// D3: a Read, shell or search call that names CODING_STANDARDS.md
export const openedStandards = (calls) => calls.some((c) => !['Edit', 'Write', 'MultiEdit'].includes(c.name) && JSON.stringify(c.input).includes('CODING_STANDARDS.md'));

// The code a loop finding pointed at: the agent's last edit of that file before the finding (Claude Code), else the final diff.
function loopSnippet(f, calls, afterLines) {
  const edits = (calls ?? []).filter((c) => ['Edit', 'Write', 'MultiEdit'].includes(c.name) && String(c.input.file_path ?? '').endsWith(`/${f.file}`) && c.ts && c.ts <= f.ts);
  const last = edits.at(-1);
  if (last?.name === 'Write') {
    const lines = new Map(String(last.input.content).split('\n').map((t, i) => [i + 1, { text: t, added: true }]));
    return { source: 'the file as the agent wrote it', code: around(lines, f.line) };
  }
  if (last) {
    const text = last.name === 'MultiEdit' ? last.input.edits.map((e) => e.new_string).join('\n...\n') : last.input.new_string;
    const final = afterLines?.size ? `\n\n----- the whole file at the end of the task, before the review fix (line ${f.line} is marked; it may have moved since the finding) -----\n${around(afterLines, f.line)}` : '';
    return { source: 'the agent\'s edit just before the finding (line numbers not known), then the whole file at the end of the task', code: `----- the edit -----\n${text}${final}` };
  }
  if (afterLines?.has(f.line)) return { source: 'the code at the end of the task, before the review fix (the line may have moved since the finding)', code: around(afterLines, f.line) };
  return { source: 'not recoverable', code: '' };
}

// Plan 7 passes its own runs, label folder, key file and seed; the defaults are Plan 6's.
export async function prepare({ force = false, all = loadAll(), labels: LABELS = LABELS_6, keyPaths = KEY_PATHS, seed: SEED = SEED_6, main = [...PRIMARY, ...SECONDARY], d3 = true } = {}) {
  const keyFile = keyPaths[keyPaths.length - 1];
  if (!force && (fs.existsSync(path.join(LABELS, 'findings.csv')) || keyPaths.some((p) => fs.existsSync(p)))) throw new Error('label sheets or key exist already; --force overwrites them (and any labels in them)');
  const idx = transcriptIndex();
  fs.mkdirSync(path.join(LABELS, 'diffs'), { recursive: true });
  const key = { seed: SEED, diffs: {}, findings: {} };
  const items = [];

  for (const { study, runs } of all) {
    const short = study.name[0].toUpperCase(); // B(ulletproof), F(ormbricks), N(8n)
    const conventions = await loadConventions(study.studyDir);

    // diffs: seeded draw of 40 main-study runs, both arms
    const pool = runs.filter((r) => r.ok && main.includes(r.model)).sort((a, b) => a.id.localeCompare(b.id));
    const sample = shuffle(pool, SEED).slice(0, SAMPLE);
    const rows = [csvRow(['code', 'convention', 'violated', 'note'])];
    sample.forEach((r, i) => {
      const code = `${short}${String(i + 1).padStart(2, '0')}`;
      key.diffs[code] = { study: study.name, run: r.id, arm: r.arm, model: r.model };
      // the code the checker judged after the task: before the review fix when there was one (bench/plan6-after-task.mjs)
      const after = path.join(study.resultsDir, r.id, 'after-task.patch');
      if (r.fixed && !fs.existsSync(after)) throw new Error(`${r.id}: no after-task.patch; run bench/plan6-after-task.mjs first`);
      const patch = fs.readFileSync(fs.existsSync(after) ? after : path.join(study.resultsDir, r.id, 'diff.patch'), 'utf8');
      fs.writeFileSync(path.join(LABELS, 'diffs', `${code}.patch`), patch);
      for (const c of conventions) if ([...patchLines(patch).keys()].some((f) => c.inScope(f))) rows.push(csvRow([code, c.id, '', '']));
    });
    fs.writeFileSync(path.join(LABELS, `diffs-${study.name}.csv`), rows.join('\n') + '\n');
    fs.writeFileSync(path.join(LABELS, `conventions-${study.name}.md`), [`# Conventions: ${study.name}`, '', ...conventions.flatMap((c) => [`## ${c.id}`, '', c.prose, ''])].join('\n'));

    // findings
    for (const r of runs.filter((x) => x.ok && main.includes(x.model))) {
      const dir = path.join(study.resultsDir, r.id);
      const base = gitBase(path.join(study.workdir, r.arm));
      const finalLines = finalFiles(fs.readFileSync(path.join(dir, 'diff.patch'), 'utf8'), base);
      // the code the checker saw after the task, before the review fix (bench/plan6-after-task.mjs); the run itself kept only the final diff
      const afterPatch = path.join(dir, 'after-task.patch');
      // a run without a review fix ends with the code of the task
      const afterLines = fs.existsSync(afterPatch) ? finalFiles(fs.readFileSync(afterPatch, 'utf8'), base) : r.fixed ? null : finalLines;
      const after = r.breaksAfterTaskAt ?? [];
      for (const f of after) {
        const lines = afterLines?.get(f.file);
        items.push({ kind: 'after-task', study: study.name, run: r.id, arm: r.arm, model: r.model, ...f, ...(lines ? { source: 'the code at the end of the task, before the review fix', code: around(lines, f.line) } : { source: 'not recoverable', code: '' }) });
      }
      const log = path.join(dir, 'failures.log');
      if (!fs.existsSync(log)) continue;
      const calls = toolCalls(dir, idx);
      const seen = new Set(after.map((f) => `${f.ruleId}|${f.file}`)); // a loop finding the agent left is labelled as a finding after the task
      for (const e of readJsonl(log)) {
        const k = `${e.ruleId}|${e.file}`;
        if (seen.has(k)) continue;
        seen.add(k);
        items.push({ kind: 'loop', study: study.name, run: r.id, arm: r.arm, model: r.model, ruleId: e.ruleId, file: e.file, line: e.line, ...loopSnippet(e, calls, afterLines?.get(e.file)) });
      }
    }

    // D3
    if (d3 && study.name === 'formbricks-conventions') {
      const opened = {};
      for (const r of runs.filter((x) => x.arm === 'prose' && [...main, ...EXPLORATORY].includes(x.model))) {
        const calls = toolCalls(path.join(study.resultsDir, r.id), idx);
        opened[r.id] = calls ? openedStandards(calls) : null;
      }
      fs.writeFileSync(path.join(study.studyDir, 'd3-opened.json'), JSON.stringify(opened, null, 2) + '\n');
    }
  }

  const ordered = shuffle(items, SEED);
  const csv = [csvRow(['code', 'rule', 'file', 'label', 'note'])];
  const md = ['# Findings to label', '', 'For each finding: is the flagged code a real violation of the convention (`correct`) or not (`false`)? Write the label in `findings.csv`.', 'The convention texts are in `conventions-<study>.md`. The arm and the run are hidden.', ''];
  ordered.forEach((it, i) => {
    const code = `X${String(i + 1).padStart(3, '0')}`;
    key.findings[code] = { kind: it.kind, study: it.study, run: it.run, arm: it.arm, model: it.model, ruleId: it.ruleId, file: it.file, line: it.line };
    csv.push(csvRow([code, it.ruleId, it.file, '', '']));
    md.push(`## ${code}: ${it.ruleId}`, '', `\`${it.file}\` line ${it.line}; code from ${it.source}.`, '', '```', it.code || '(no code)', '```', '');
  });
  fs.writeFileSync(path.join(LABELS, 'findings.csv'), csv.join('\n') + '\n');
  fs.writeFileSync(path.join(LABELS, 'findings.md'), md.join('\n'));
  fs.mkdirSync(path.dirname(keyFile), { recursive: true });
  fs.writeFileSync(keyFile, JSON.stringify(key, null, 2) + '\n');
  return { diffs: Object.keys(key.diffs).length, findings: ordered.length, byKind: { 'after-task': ordered.filter((x) => x.kind === 'after-task').length, loop: ordered.filter((x) => x.kind === 'loop').length }, unrecoverable: ordered.filter((x) => x.source === 'not recoverable').length, keyFile };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(await prepare({ force: process.argv.includes('--force') })); } catch (e) { console.error(`plan6-prepare: ${e.message}`); process.exitCode = 1; }
}
