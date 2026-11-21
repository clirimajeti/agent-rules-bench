// Every convention's examples through the study's real ESLint config, so the rule and the files it covers are
// tested together: each valid example gives no finding of that rule, each invalid one that rule.
// With N8N_SRC set to a checkout of the pinned commit, it also checks that every source block is there word for word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conventions, ruleText } from './conventions.mjs';

const studyDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const joined = (block) => block.replace(/^- /, '').replace(/\n\s*/g, ' ');

test('every convention has a unique id, its sources, examples and review text', () => {
  assert.equal(new Set(conventions.map((c) => c.id)).size, conventions.length);
  for (const c of conventions) {
    assert.ok(['design', 'mechanical'].includes(c.kind), c.id);
    assert.ok(c.prose && c.sources.length && c.valid.length && c.invalid.length, c.id);
    for (const s of c.sources) assert.ok(s.block.startsWith('- ') && !s.block.endsWith('\n'), `${c.id} in ${s.file}`);
    // the message is the first block word for word; a rule made of several bullets of one file (node-errors) adds
    // the others, each ended with a full stop; the same rule repeated in another file adds nothing
    const sameFile = c.sources.filter((s) => s.file === c.sources[0].file).map((s) => joined(s.block));
    assert.equal(c.prose, sameFile.length > 1 ? sameFile.map((t) => `${t}.`).join(' ') : sameFile[0], c.id);
    assert.equal(ruleText[`local/${c.id}`], c.prose);
    assert.equal(Boolean(c.pointer), c.kind === 'design', `${c.id}: a pointer exactly for design-shaping rules`);
  }
});

test('every source block is in the pinned n8n instruction files, once', { skip: !process.env.N8N_SRC && 'N8N_SRC not set' }, () => {
  for (const c of conventions) {
    for (const s of c.sources) {
      const text = fs.readFileSync(path.join(process.env.N8N_SRC, s.file), 'utf8');
      // a block is whole lines: it starts at a line start and ends at a line end
      const at = [...text.matchAll(new RegExp(`(^|\\n)${s.block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`, 'g'))];
      assert.equal(at.length, 1, `${c.id} in ${s.file}`);
    }
  }
});
