// The feedback loop a copy has in .claude/codemyrules, as a node command line for one hook. Installs before
// codemyrules 0.9 ship one script per hook (guard.mjs, lint-edited.mjs, lint-turn.mjs); later ones ship a pinned
// copy of the package and one CLI (`cli.mjs hook guard|edited|turn`). Null when the copy has no loop.
import fs from 'node:fs';
import path from 'node:path';

export const LOOP = '.claude/codemyrules';
const HOOK = { 'guard.mjs': 'guard', 'lint-edited.mjs': 'edited', 'lint-turn.mjs': 'turn' };

export function loopArgs(cwd, script) {
  const cli = path.join(cwd, LOOP, 'pkg', 'skills', 'codemyrules', 'scripts', 'cli.mjs');
  if (fs.existsSync(cli)) return [cli, 'hook', HOOK[script]];
  const old = path.join(cwd, LOOP, script);
  return fs.existsSync(old) ? [old] : null;
}
