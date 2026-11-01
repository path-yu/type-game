/**
 * 填空生成的全量体检：对 1156 篇文章各生成一次，检查不变量。
 * 用法：node scripts/audit-cloze.mjs [--show 3]
 *
 * 它不测界面，只测算法在真实语料上会不会产出"没法做"的题：
 * 空太少、空在专名上、两个空挨在一起、提示没有中文。
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildCloze } from '../src/lib/cloze.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const dictArr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words;
const lemma = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lemma.json'), 'utf8')).map;
const names = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/names.json'), 'utf8')).names);

const dict = new Map(dictArr.map(w => [w.w, w]));
const WORD = /[A-Za-z][A-Za-z'-]*/g;

function tokenize(text) {
  const out = [];
  let m;
  WORD.lastIndex = 0;
  while ((m = WORD.exec(text))) {
    const raw = m[0];
    const low = raw.toLowerCase().replace(/[^a-z']/g, '');
    out.push({ raw, key: lemma[low] ?? low ?? raw, start: m.index, end: m.index + raw.length });
  }
  return out;
}

/** 简化切句（与运行时一致：句末标点 + 可选引号 + 空白） */
const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./gi;
function splitSentences(text) {
  const guarded = text.replace(ABBR, m => m.replace('.', '\u0001'));
  const out = [];
  const re = /[.!?]+["'\u201d)\]]?\s+/g;
  let start = 0, m;
  while ((m = re.exec(guarded))) {
    const end = m.index + m[0].length;
    if (end > start) out.push({ start, end });
    start = end;
  }
  if (start < text.length) out.push({ start, end: text.length });
  return out;
}

const show = Number(process.argv[process.argv.indexOf('--show') + 1]) || 0;

let tooFew = 0, badName = 0, tooClose = 0, noHint = 0, dup = 0;
let totalBlanks = 0;
const perLevel = {};
const samples = [];

for (const a of articles) {
  const text = a.tx;
  const tokens = tokenize(text);
  const sentences = splitSentences(text);
  const { blanks } = buildCloze({
    articleId: a.id, text, tokens, sentences, names, dict, mastery: {},
  });

  perLevel[a.lv] = perLevel[a.lv] ?? { n: 0, blanks: 0 };
  perLevel[a.lv].n++;
  perLevel[a.lv].blanks += blanks.length;
  totalBlanks += blanks.length;

  if (blanks.length < 4) tooFew++;

  const starts = new Set();
  blanks.forEach((b, i) => {
    if (names.has(b.answer)) badName++;
    if (!b.zh) noHint++;
    if (starts.has(b.start)) dup++;
    starts.add(b.start);
    if (i > 0 && b.start - blanks[i - 1].end < 10) tooClose++;   // 至少隔开一个词
  });

  if (samples.length < show) {
    samples.push({
      id: a.id,
      title: a.s,
      text: text.slice(0, 220).replace(/\s+/g, ' '),
      blanks: blanks.map(b => `${b.answer}（${b.zh}）`),
    });
  }
}

console.log(`文章 ${articles.length} 篇 · 共生成 ${totalBlanks} 个空 · 平均 ${(totalBlanks / articles.length).toFixed(1)} 个/篇`);
console.log('按档位：');
Object.entries(perLevel).sort((a, b) => Number(a[0]) - Number(b[0]))
  .forEach(([lv, s]) => console.log(`  L${lv}  ${s.n} 篇 · 平均 ${(s.blanks / s.n).toFixed(1)} 空`));

const tooFewRatio = tooFew / articles.length;
const bad = [
  ['挖到专名', badName],
  ['空距过近', tooClose],
  ['缺中文提示', noHint],
  ['重复挖同一位置', dup],
];
console.log('\n不变量检查：');
bad.forEach(([name, n]) => console.log(`  ${n === 0 ? '✓' : '✗'} ${name}  ${n}`));
// 少量文章几乎全是虚词、内容词又缺词条，挖不出 4 个空；选题时会跳过它们。
// 只要比例 <1%，属于数据固有情况，不算失败。
const fewOk = tooFewRatio < 0.01;
console.log(`  ${fewOk ? '✓' : '✗'} 空少于 4 个  ${tooFew}（${(tooFewRatio * 100).toFixed(2)}%，选题时自动跳过）`);

samples.forEach((s, i) => {
  console.log(`\n样例 ${i + 1}：${s.id} · ${s.title}`);
  console.log(`  ${s.text}…`);
  console.log(`  空：${s.blanks.join(' | ')}`);
});

const ok = bad.every(([, n]) => n === 0) && fewOk;
console.log(ok ? '\n✅ 填空生成通过全部不变量' : '\n❌ 有问题');
process.exit(ok ? 0 : 1);
