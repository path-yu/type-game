/**
 * 切句规则收紧之后的译文重对齐。
 *
 * 旧规则：`标点 + 空格` 就断句 —— `Alas! it was too late` 被拆成两句。
 * 新规则：句界后面必须是大写字母/引号/括号。全库 164 处误断被合回，
 * 5600 句 → 5436 句，译文数组必须跟着重组。
 *
 * 做法：按**字符区间**把旧译文映射到新句子上。新句若横跨多条旧句，
 * 就把那几条译文直接拼起来（它们本来就是一句话被切断的两半）。
 * 映射不上的一律报错，不猜。
 */
import fs from 'node:fs';
import { splitSentences } from '../src/lib/split.js';

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./gi;
const OLD_BOUNDARY = /[.!?]+["'\u201d)\]]?\s+/g;

/** 旧规则的原样复刻 —— 必须和「当初生成 tr.json 时」的切法一致 */
function splitOld(text) {
  const guarded = text.replace(ABBR, m => m.replace('.', '\u0001'));
  const out = [];
  let start = 0, m;
  while ((m = OLD_BOUNDARY.exec(guarded))) {
    const end = m.index + m[0].length;
    if (end > start) out.push({ start, end, text: text.slice(start, end).trim() });
    start = end;
  }
  if (start < text.length) {
    const t = text.slice(start).trim();
    if (t) out.push({ start, end: text.length, text: t });
  }
  return out;
}

const arts = JSON.parse(fs.readFileSync('public/data/articles.json', 'utf8')).items;
const tr = JSON.parse(fs.readFileSync('public/data/tr.json', 'utf8'));

let changed = 0, merged = 0, same = 0;
const bad = [];

for (const a of arts) {
  const zh = tr.map[a.id];
  if (!zh) continue;

  const oldSegs = splitOld(a.tx);
  const newSegs = splitSentences(a.tx);

  if (zh.length !== oldSegs.length) {
    bad.push(`${a.id} 译文 ${zh.length} 句 / 旧切法 ${oldSegs.length} 句`);
    continue;
  }
  if (oldSegs.length === newSegs.length) { same++; continue; }

  const next = newSegs.map(n => {
    const hits = [];
    oldSegs.forEach((o, i) => {
      if (o.end > n.start && o.start < n.end) hits.push(i);
    });
    if (!hits.length) return null;
    const parts = hits.map(i => (zh[i] || '').trim()).filter(Boolean);
    if (parts.length > 1) merged += parts.length - 1;
    return parts.join('');
  });

  if (next.some(x => x === null || !x)) { bad.push(`${a.id} 有句子映射不到译文`); continue; }

  tr.map[a.id] = next;
  changed++;
}

if (bad.length) {
  console.error('✗ 无法对齐，未写入任何数据：');
  for (const b of bad.slice(0, 10)) console.error('  ' + b);
  process.exit(1);
}

fs.writeFileSync('public/data/tr.json', JSON.stringify(tr));
console.log(`✓ 重对齐 ${changed} 篇（合并 ${merged} 处误断），${same} 篇不受影响`);
