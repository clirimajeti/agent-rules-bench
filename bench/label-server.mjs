#!/usr/bin/env node
// A local page for the blind finding labels of Plan 6: one finding at a time, with the convention text next to it.
// Each label is written to studies/plan-6-labels/findings.csv at once. Reads only the label sheets, never the key.
//
//   node bench/label-server.mjs [--port 4317]     then open http://127.0.0.1:4317
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { LABELS, csvRow, parseCsv } from './plan6.mjs';

const CSV = path.join(LABELS, 'findings.csv');
const LABEL_VALUES = ['correct', 'false', ''];

// findings.md: "## X001: local/rule" sections with a file line and one code block
export function parseFindings(md) {
  return md.split(/^## /m).slice(1).map((s) => {
    const [head, ...rest] = s.split('\n');
    const [code, rule] = head.split(': ');
    const body = rest.join('\n');
    return { code, rule, where: body.match(/^`.*$/m)?.[0] ?? '', snippet: body.match(/```\n([\s\S]*?)\n```/)?.[1] ?? '' };
  });
}

// conventions-<study>.md: "## id" sections with the prose of the convention
export function parseConventions(md) {
  return Object.fromEntries(md.split(/^## /m).slice(1).map((s) => { const [id, ...rest] = s.split('\n'); return [`local/${id.trim()}`, rest.join('\n').trim()]; }));
}

const study = (where) => (where.includes('apps/react-vite') ? 'bulletproof-conventions' : 'formbricks-conventions');

function load() {
  const findings = parseFindings(fs.readFileSync(path.join(LABELS, 'findings.md'), 'utf8'));
  const conventions = Object.fromEntries(['bulletproof-conventions', 'formbricks-conventions'].map((s) => [s, parseConventions(fs.readFileSync(path.join(LABELS, `conventions-${s}.md`), 'utf8'))]));
  const labels = Object.fromEntries(parseCsv(fs.readFileSync(CSV, 'utf8')).map((r) => [r.code, r]));
  return findings.map((f) => ({ ...f, convention: conventions[study(f.where)][f.rule] ?? (f.rule.startsWith('local/') ? '(convention text not found)' : 'Not a convention: the linter itself reported an error here (for example a parse error in half-edited code). Skip it; the analysis leaves it out.'), label: labels[f.code]?.label ?? '', note: labels[f.code]?.note ?? '' }));
}

function save(code, label, note) {
  const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
  const row = rows.find((r) => r.code === code);
  if (!row) throw new Error(`unknown finding ${code}`);
  Object.assign(row, { label, note });
  const tmp = `${CSV}.tmp`;
  fs.writeFileSync(tmp, [csvRow(['code', 'rule', 'file', 'label', 'note']), ...rows.map((r) => csvRow([r.code, r.rule, r.file, r.label, r.note]))].join('\n') + '\n');
  fs.renameSync(tmp, CSV); // a crash mid-write never leaves a half-written sheet
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Finding labels</title><style>
:root{--bg:#fafaf9;--fg:#1c1917;--muted:#78716c;--card:#fff;--line:#e7e5e4;--hit:#fef3c7;--add:#f0fdf4;--ok:#15803d;--bad:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#1c1917;--fg:#f5f5f4;--muted:#a8a29e;--card:#292524;--line:#44403c;--hit:#713f12;--add:#14281c;--ok:#4ade80;--bad:#f87171}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:1000px;margin:0 auto;padding:16px}
header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.bar{flex:1;height:6px;background:var(--line);border-radius:3px;min-width:120px}.bar div{height:100%;background:var(--ok);border-radius:3px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin-top:12px}
.muted{color:var(--muted)}pre{overflow-x:auto;font:13px/1.45 ui-monospace,monospace;margin:0}
#code{max-height:65vh;overflow:auto}pre span{display:block;padding:0 4px}pre span.add{background:var(--add)}pre span.hit{background:var(--hit);outline:2px solid var(--bad)}
.conv{white-space:pre-wrap}button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button.correct{border-color:var(--ok);color:var(--ok)}button.false{border-color:var(--bad);color:var(--bad)}
.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}input{flex:1;min-width:160px;font:inherit;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg)}
.state{font-weight:600}.state.correct{color:var(--ok)}.state.false{color:var(--bad)}kbd{font:12px ui-monospace,monospace;border:1px solid var(--line);border-radius:4px;padding:0 4px}
</style></head><body><main>
<header><strong id="pos"></strong><div class="bar"><div id="prog"></div></div><span id="count" class="muted"></span></header>
<div class="card"><div class="muted">Convention</div><h3 id="rule" style="margin:4px 0"></h3><div id="conv" class="conv"></div></div>
<div class="card"><div id="where" class="muted"></div><div class="muted">Whole file; green = added by the agent, red outline = flagged line.</div><pre id="code"></pre></div>
<div class="card"><div>Does the flagged code (highlighted) really break the convention? <span id="state" class="state"></span></div>
<div class="actions"><button class="correct" id="c">Correct <kbd>c</kbd></button><button class="false" id="f">False <kbd>f</kbd></button>
<button id="prev">Back <kbd>&larr;</kbd></button><button id="next">Skip <kbd>&rarr;</kbd></button><button id="todo">Next unlabelled <kbd>n</kbd></button>
<input id="note" placeholder="Note (optional, saved with the label)"></div>
<p class="muted" id="err"></p></div>
</main><script>
let items=[],i=0;const $=(id)=>document.getElementById(id);
const esc=(s)=>s.replace(/[&<>]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function show(){const f=items[i];$('pos').textContent=f.code+' ('+(i+1)+'/'+items.length+')';
const done=items.filter((x)=>x.label).length;$('count').textContent=done+' labelled, '+items.filter(open).length+' left';$('prog').style.width=(100*done/items.length)+'%';
$('rule').textContent=f.rule;$('conv').textContent=f.convention;$('where').innerHTML=esc(f.where).replace(/\`([^\`]*)\`/g,'<code>$1</code>');
$('code').innerHTML=(f.where.includes('not recoverable')?'The code of this finding could not be rebuilt. Skip it (press the right arrow); it stays counted as found.':(f.snippet||'(no code)')).split('\\n').map((l)=>'<span class="'+(l.startsWith('>>')?'hit':/^.. +\\d+ \\+/.test(l)?'add':'')+'">'+esc(l)+'</span>').join('');
const h=$('code').querySelector('.hit');$('code').scrollTop=h?h.offsetTop-$('code').offsetTop-$('code').clientHeight/3:0;
$('state').textContent=f.label?'Labelled: '+f.label:'';$('state').className='state '+f.label;$('note').value=f.note;$('err').textContent='';}
async function label(v){const f=items[i];const note=$('note').value;
const r=await fetch('/label',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:f.code,label:v,note})});
if(!r.ok){$('err').textContent='Not saved: '+await r.text();return;}f.label=v;f.note=note;next();}
const next=()=>{if(i<items.length-1)i++;show();},prev=()=>{if(i>0)i--;show();};
// open findings: unlabelled, with code to judge, and a convention (not a linter error)
const open=(x)=>!x.label&&!x.where.includes('not recoverable')&&x.rule.startsWith('local/');
const todo=()=>{const order=[...items.keys()].slice(i+1).concat([...items.keys()].slice(0,i+1));const j=order.find((k)=>open(items[k]));if(j!==undefined){i=j;show();}else{$('err').textContent='Nothing left to label.';}};
$('c').onclick=()=>label('correct');$('f').onclick=()=>label('false');$('next').onclick=next;$('prev').onclick=prev;$('todo').onclick=todo;
document.addEventListener('keydown',(e)=>{if(e.target.tagName==='INPUT')return;
if(e.key==='c')label('correct');else if(e.key==='f')label('false');else if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();else if(e.key==='n')todo();});
fetch('/findings').then((r)=>r.json()).then((d)=>{items=d;const j=items.findIndex(open);i=j>=0?j:0;show();});
</script></body></html>`;

const server = http.createServer((req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
    if (req.method === 'GET' && req.url === '/findings') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(load())); }
    if (req.method === 'POST' && req.url === '/label') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
      req.on('end', () => {
        try {
          const { code, label, note } = JSON.parse(body);
          if (!LABEL_VALUES.includes(label) || typeof note !== 'string') throw new Error('label must be correct or false');
          save(String(code), label, note.replace(/[\r\n]+/g, ' ').slice(0, 500));
          res.writeHead(204); res.end();
        } catch (e) { res.writeHead(400); res.end(e.message); }
      });
      return;
    }
    res.writeHead(404); res.end();
  } catch (e) { res.writeHead(500); res.end(e.message); }
});

if (process.argv[1]?.endsWith('label-server.mjs')) {
  const i = process.argv.indexOf('--port');
  const port = i > 0 ? Number(process.argv[i + 1]) : 4317;
  server.listen(port, '127.0.0.1', () => console.log(`labelling page: http://127.0.0.1:${port}  (Ctrl+C to stop; labels are saved to ${CSV})`));
}
