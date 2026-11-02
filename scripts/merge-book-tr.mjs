/**
 * 把逐句译文并进 tr.json。
 *
 * 硬校验：每篇的译文条数必须等于 splitSentences(tx) 的句数。
 * 少一句就会整体错位——后面每个字的中文都对着上一句原文，而且界面上看不出来，
 * 只会觉得"翻译怪怪的"。宁可合并失败，也不能让错位的译文进库。
 *
 * 用法：node scripts/merge-book-tr.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from './lib/prose.mjs';
import { CALL_TR } from './lib/tr-call.mjs';
import { CAROL_TR } from './lib/tr-carol.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DATA = path.join(ROOT, 'public/data');

const articles = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8'));
const tr = JSON.parse(fs.readFileSync(path.join(DATA, 'tr.json'), 'utf8'));

const incoming = { ...CALL_TR, ...CAROL_TR };
const bad = [];
let n = 0;

for (const [id, zh] of Object.entries(incoming)) {
  const it = articles.items.find(x => x.id === id);
  if (!it) { bad.push(`${id}: 文章不存在`); continue; }
  const sents = splitSentences(it.tx);
  if (sents.length !== zh.length) {
    bad.push(`${id}: 原文 ${sents.length} 句 vs 译文 ${zh.length} 句`);
    continue;
  }
  if (zh.some(s => !s || !s.trim())) { bad.push(`${id}: 有空译文`); continue; }
  tr.map[id] = zh;
  n++;
}

if (bad.length) {
  console.error('✗ 合并中止，有问题的篇目：');
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}

console.log(`✓ ${n} 篇译文句句对齐，已并入`);
console.log('  tr.json 覆盖', Object.keys(tr.map).length, '/', articles.items.length, '篇');

if (!process.argv.includes('--dry')) {
  fs.writeFileSync(path.join(DATA, 'tr.json'), JSON.stringify(tr));
  console.log('  写入 tr.json');
}
