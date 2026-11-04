// What always-loaded text costs per session, derived from the sessions themselves: fits the per-token prices
// (input, cache write, cache read, output) to every session's reported cost by least squares, per model, then
// prices N extra tokens in CLAUDE.md as one cache write plus one cache read on each later turn:
//   cost(N) = N * (write + (turns - 1) * read), at the median, quartiles and range of the observed turns.
// The fit residual shows whether the four prices explain the reported costs exactly.
import fs from 'node:fs';
import path from 'node:path';
import { loadStudy } from './config.mjs';

export function sessionsOf(study) {
  const out = [];
  if (!fs.existsSync(study.resultsDir)) return out;
  for (const d of fs.readdirSync(study.resultsDir)) {
    for (const f of ['task.json', 'fix.json']) {
      const p = path.join(study.resultsDir, d, f);
      if (!fs.existsSync(p)) continue;
      let j;
      try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
      if (j.is_error !== false || !j.modelUsage) continue;
      for (const [model, u] of Object.entries(j.modelUsage)) {
        out.push({ model, turns: j.num_turns, x: [u.inputTokens, u.cacheCreationInputTokens, u.cacheReadInputTokens, u.outputTokens], cost: u.costUSD });
      }
    }
  }
  return out;
}

// Least squares via the normal equations, solved by Gaussian elimination with partial pivoting.
export function fitPrices(sessions) {
  const k = 4, A = Array.from({ length: k }, () => new Array(k + 1).fill(0));
  for (const s of sessions) for (let i = 0; i < k; i++) { for (let j = 0; j < k; j++) A[i][j] += s.x[i] * s.x[j]; A[i][k] += s.x[i] * s.cost; }
  for (let c = 0; c < k; c++) {
    const p = A.reduce((best, row, r) => (r >= c && Math.abs(row[c]) > Math.abs(A[best][c]) ? r : best), c);
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < k; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j <= k; j++) A[r][j] -= f * A[c][j]; }
  }
  const prices = A.map((row, i) => row[k] / row[i]);
  const maxRelError = Math.max(...sessions.map((s) => Math.abs(s.x.reduce((a, x, i) => a + x * prices[i], 0) - s.cost) / s.cost));
  return { prices, maxRelError };
}

const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]; };
export const costPerSession = (tokens, turns, [, write, read]) => tokens * (write + Math.max(0, turns - 1) * read);

export function contextCost(files, { tokens = 1000, out, log = console.log } = {}) {
  const sessions = files.flatMap((f) => sessionsOf(loadStudy(f)));
  const lines = ['# What always-loaded text costs', '', `Derived from ${sessions.length} sessions: per-token prices fitted to each session's reported cost, then ${tokens} extra tokens in an always-loaded file priced as one cache write plus one cache read on every later turn.`, ''];
  lines.push('| model | sessions | fit error (max) | cache write $/Mtok | cache read $/Mtok | turns: min / Q1 / median / Q3 / max | cost per session at median turns | at Q1 to Q3 |', '|---|---|---|---|---|---|---|---|');
  for (const model of [...new Set(sessions.map((s) => s.model))].sort()) {
    const ss = sessions.filter((s) => s.model === model);
    const { prices, maxRelError } = fitPrices(ss);
    const turns = ss.map((s) => s.turns);
    const q = [0, 0.25, 0.5, 0.75, 1].map((p) => quantile(turns, p));
    const $ = (t) => `$${costPerSession(tokens, t, prices).toFixed(4)}`;
    lines.push(`| ${model} | ${ss.length} | ${(maxRelError * 100).toFixed(2)}% | ${(prices[1] * 1e6).toFixed(2)} | ${(prices[2] * 1e6).toFixed(3)} | ${q.join(' / ')} | ${$(q[2])} | ${$(q[1])} to ${$(q[3])} |`);
  }
  lines.push('', 'Assumes one API call per turn (`num_turns`), each reading the cached prefix that holds the always-loaded file; ancillary calls Claude Code makes outside the turn count are not priced.');
  lines.push('', 'This is the price of the tokens alone; whether always-loaded text also changes what the agent does (as in F7, where it skipped the linked docs) needs runs, not arithmetic.');
  const md = lines.join('\n') + '\n';
  if (out) fs.writeFileSync(path.resolve(out), md);
  log(md);
  return md;
}
