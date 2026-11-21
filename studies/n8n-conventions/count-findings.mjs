// Runs the study's checkers over a whole n8n checkout and counts findings and files per rule: how often the
// existing code breaks each rule, which an agent can copy. Test code is left out by the study's config.
// Usage: node count-findings.mjs <n8n checkout>   (prints a Markdown table)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { conventions } from './plugin/conventions.mjs';

const studyDir = path.dirname(fileURLToPath(import.meta.url));

export async function countFindings(checkout) {
  const eslint = new ESLint({ cwd: checkout, overrideConfigFile: path.join(studyDir, 'eslint.config.mjs'), errorOnUnmatchedPattern: false });
  const results = await eslint.lintFiles([...new Set(conventions.flatMap((c) => c.files))]);
  const counts = Object.fromEntries(conventions.map((c) => [c.id, { findings: 0, files: 0 }]));
  for (const r of results) {
    const fatal = r.messages.filter((m) => m.fatal);
    if (fatal.length) throw new Error(`parse error in ${r.filePath}: ${fatal[0].message}`);
    for (const id of new Set(r.messages.map((m) => m.ruleId?.replace(/^local\//, '')))) {
      if (!counts[id]) continue;
      counts[id].files++;
      counts[id].findings += r.messages.filter((m) => m.ruleId === `local/${id}`).length;
    }
  }
  return counts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const counts = await countFindings(path.resolve(process.argv[2]));
  console.log('| Rule | Findings | Files |\n|---|---|---|');
  for (const [id, c] of Object.entries(counts)) console.log(`| ${id} | ${c.findings} | ${c.files} |`);
}
