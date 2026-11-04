// Aggregates result.json files per arm and model: mean and spread, cost split into draft and fix,
// rule breaks and builds, and the difference to the baseline arm. Writes summary.md and runs.csv.
import fs from 'node:fs';
import path from 'node:path';

export function loadResults(resultsDir) {
  if (!fs.existsSync(resultsDir)) return [];
  return fs.readdirSync(resultsDir).sort()
    .map((d) => path.join(resultsDir, d, 'result.json'))
    .filter((f) => fs.existsSync(f))
    .map((f) => {
      const r = JSON.parse(fs.readFileSync(f, 'utf8'));
      const v = path.join(path.dirname(f), 'verify.json');
      return fs.existsSync(v) ? { ...r, verify: JSON.parse(fs.readFileSync(v, 'utf8')) } : r;
    });
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const sd = (xs) => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)) : 0; };
const tokensIn = (u) => (u ? u.input + u.cacheWrite + u.cacheRead : 0);

// "build 8/8, tests 7/8" over the runs that were verified; a step skipped after an earlier failure counts as failed.
function verifiedSummary(rs) {
  const vs = rs.filter((r) => r.verify).map((r) => r.verify);
  if (!vs.length) return '-';
  const names = [...new Set(vs.flatMap((v) => Object.keys(v.steps)))];
  const parts = names.map((n) => `${n} ${vs.filter((v) => v.steps[n]?.ok).length}/${vs.length}`);
  const unapplied = vs.filter((v) => !v.patchApplied).length;
  // production code that passes the project's original suite: the run passed, or passed without its own tests
  const prod = vs.filter((v) => v.ok || v.withoutOwnTests?.ok).length;
  if (vs.some((v) => v.withoutOwnTests)) parts.push(`code without own tests ${prod}/${vs.length}`);
  const flaky = vs.filter((v) => Object.values(v.steps).some((s) => s.flaky)).length;
  return [...parts, ...(flaky ? [`flaky ${flaky}`] : []), ...(unapplied ? [`patch failed ${unapplied}`] : [])].join(', ');
}

export function aggregate(results) {
  const groups = new Map();
  for (const r of results) {
    const k = `${r.arm}|${r.model}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.entries()].map(([k, rs]) => {
    const [arm, model] = k.split('|');
    const total = rs.map((r) => r.taskCost + r.fixCost);
    const builds = rs.filter((r) => r.build);
    return {
      arm, model, runs: rs.length,
      ok: rs.filter((r) => r.ok).length,
      totalCost: mean(total), totalCostSd: sd(total),
      taskCost: mean(rs.map((r) => r.taskCost)), fixCost: mean(rs.map((r) => r.fixCost)),
      fixSessions: rs.filter((r) => r.fixed).length,
      turns: mean(rs.map((r) => r.turns)),
      inputTokens: mean(rs.map((r) => tokensIn(r.usage) + tokensIn(r.fixUsage))),
      outputTokens: mean(rs.map((r) => (r.usage?.output ?? 0) + (r.fixUsage?.output ?? 0))),
      seconds: mean(rs.map((r) => r.seconds)),
      runsWithBreaksAfterTask: rs.filter((r) => r.breaksAfterTask > 0).length,
      runsWithBreaksLeft: rs.filter((r) => r.breaksFinal > 0).length,
      hookCatches: rs.reduce((n, r) => n + r.hookCatches, 0),
      capped: rs.filter((r) => r.capped).length,
      builds: builds.length ? `${builds.filter((r) => r.build.ok).length}/${builds.length}` : '-',
      verified: verifiedSummary(rs),
    };
  });
}

const money = (x) => `$${x.toFixed(3)}`;

export function markdown(study, rows) {
  const lines = [`# ${study.name}`, '', `Repo: ${study.repo.source} @ ${study.repo.commit}, baseline arm: ${study.baselineArm}.`, ''];
  lines.push('| arm | model | runs | ok | total cost | draft | fix | fix sessions | turns | input tokens | output tokens | seconds | runs broken after task | runs broken at end | hook catches | capped | builds | verified |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    lines.push(`| ${r.arm} | ${r.model} | ${r.runs} | ${r.ok} | ${money(r.totalCost)} ±${r.totalCostSd.toFixed(3)} | ${money(r.taskCost)} | ${money(r.fixCost)} | ${r.fixSessions} | ${r.turns.toFixed(1)} | ${Math.round(r.inputTokens)} | ${Math.round(r.outputTokens)} | ${Math.round(r.seconds)} | ${r.runsWithBreaksAfterTask} | ${r.runsWithBreaksLeft} | ${r.hookCatches} | ${r.capped} | ${r.builds} | ${r.verified} |`);
  }
  const diffs = [];
  for (const model of new Set(rows.map((r) => r.model))) {
    const base = rows.find((r) => r.arm === study.baselineArm && r.model === model);
    if (!base) continue;
    for (const r of rows.filter((x) => x.model === model && x.arm !== study.baselineArm)) {
      const d = r.totalCost - base.totalCost;
      const within = Math.abs(d) <= Math.max(r.totalCostSd, base.totalCostSd);
      diffs.push(`- ${model}: ${r.arm} vs ${base.arm}: total cost ${d >= 0 ? '+' : '-'}${money(Math.abs(d))} (${base.totalCost ? ((100 * d) / base.totalCost).toFixed(0) : '-'}%)${within ? ', inside the spread' : ''}`);
    }
  }
  if (diffs.length) lines.push('', '## Against the baseline arm', '', ...diffs);
  return lines.join('\n') + '\n';
}

export function csv(results) {
  const cols = ['id', 'arm', 'model', 'task', 'rep', 'ok', 'turns', 'taskCost', 'fixCost', 'seconds', 'fixed', 'breaksAfterTask', 'breaksFinal', 'hookCatches', 'changedFiles', 'buildOk', 'verifyOk', 'verifyOkWithoutOwnTests'];
  const row = (r) => [r.id, r.arm, r.model, r.task, r.rep, r.ok, r.turns, r.taskCost, r.fixCost, r.seconds, r.fixed, r.breaksAfterTask, r.breaksFinal, r.hookCatches, r.changedFiles, r.build ? r.build.ok : '', r.verify ? r.verify.ok : '', r.verify ? Boolean(r.verify.ok || r.verify.withoutOwnTests?.ok) : ''].join(',');
  return [cols.join(','), ...results.map(row)].join('\n') + '\n';
}

export function summarizeStudy(study, log = console.log) {
  const results = loadResults(study.resultsDir);
  if (!results.length) {
    log('no results yet');
    return null;
  }
  const md = markdown(study, aggregate(results));
  fs.writeFileSync(path.join(study.resultsDir, 'summary.md'), md);
  fs.writeFileSync(path.join(study.resultsDir, 'runs.csv'), csv(results));
  log(md);
  return md;
}
