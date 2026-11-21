#!/usr/bin/env bash
# rules: every rule block is removed from every n8n instruction file that states it (each found exactly once,
# word for word, all its lines), each rule becomes a lint rule with the codemyrules feedback loop, and each
# design-shaping rule gets a pointer line at the end of the root AGENTS.md (always loaded through CLAUDE.md).
set -euo pipefail
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
node --input-type=module -e '
  import fs from "node:fs";
  const { conventions } = await import(process.argv[1]);
  for (const c of conventions) for (const s of c.sources) {
    const text = fs.readFileSync(s.file, "utf8");
    const parts = text.split(`\n${s.block}\n`);
    if (parts.length !== 2) { console.error(`${c.id}: expected its block once in ${s.file}, found ${parts.length - 1}`); process.exit(1); }
    fs.writeFileSync(s.file, parts.join("\n"));
  }
  const pointers = conventions.filter((c) => c.pointer).map((c) => `- ${c.pointer}`);
  fs.appendFileSync("AGENTS.md", `\n## Enforced conventions\n\n${pointers.join("\n")}\n`);
' "$BENCH_STUDY_DIR/plugin/conventions.mjs"
D=.claude/codemyrules
mkdir -p $D/plugin
cp "$BENCH_STUDY_DIR/eslint.config.mjs" $D/eslint.config.mjs
cp "$BENCH_STUDY_DIR/plugin/index.js" "$BENCH_STUDY_DIR/plugin/conventions.mjs" $D/plugin/
ln -s "$BENCH_STUDY_DIR/node_modules" $D/node_modules # ESLint and the parsers, installed once in the study folder
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
