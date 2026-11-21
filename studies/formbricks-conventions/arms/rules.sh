#!/usr/bin/env bash
# rules: the four convention lines are removed from the maintainers' files (each exactly once, word for word),
# each convention becomes a lint rule with the codemyrules feedback loop, and the design-shaping one gets a
# pointer line at the end of apps/web/AGENTS.md (loaded through apps/web/CLAUDE.md), as codemyrules installs it.
set -euo pipefail
CODEMYRULES="${CODEMYRULES:-$HOME/dev_private/tools/skills/codemyrules}"
node --input-type=module -e '
  import fs from "node:fs";
  const { conventions } = await import(process.argv[1]);
  for (const c of conventions) {
    const lines = fs.readFileSync(c.source.file, "utf8").split("\n");
    const at = lines.flatMap((l, i) => (l === c.source.line ? [i] : []));
    if (at.length !== 1) { console.error(`${c.id}: expected its line once in ${c.source.file}, found ${at.length}`); process.exit(1); }
    lines.splice(at[0], 1);
    fs.writeFileSync(c.source.file, lines.join("\n"));
  }
  const pointers = conventions.filter((c) => c.pointer).map((c) => `- ${c.pointer}`);
  fs.appendFileSync("apps/web/AGENTS.md", `\n## Enforced conventions\n\n${pointers.join("\n")}\n`);
' "$BENCH_STUDY_DIR/plugin/conventions.mjs"
D=.claude/codemyrules
mkdir -p $D/plugin
cp "$BENCH_STUDY_DIR/eslint.config.mjs" $D/eslint.config.mjs
cp "$BENCH_STUDY_DIR/plugin/index.js" "$BENCH_STUDY_DIR/plugin/conventions.mjs" $D/plugin/
ln -s "$BENCH_STUDY_DIR/node_modules" $D/node_modules # ESLint and the parsers, installed once in the study folder
node "$CODEMYRULES/skills/codemyrules/scripts/install.mjs" "$BENCH_COPY" --config "$BENCH_STUDY_DIR/arms/loop.json" --apply > /dev/null
