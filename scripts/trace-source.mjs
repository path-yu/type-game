// 溯源：每篇"文章"能不能在原始书里逐字找到？找到的位置是不是按原文顺序递增？
// 这个脚本只为回答一个问题 —— 库里的文本是真实原文的切片，还是代码拼出来的。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOKS = path.join(ROOT, 'data/raw/books');

const normalize = p => p
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\u2026/g, '...')
  .replace(/\[[^\]]{0,40}\]/g, '')
  .replace(/[_*]+/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;

const byBook = new Map();
for (const a of articles) {
  const m = /^gutenberg:(\d+)$/.exec(a.u || '');
  if (!m) continue;
  if (!byBook.has(m[1])) byBook.set(m[1], []);
  byBook.get(m[1]).push(a);
}

let total = 0, found = 0;
const bad = [];
const stats = [];

for (const [gid, list] of byBook) {
  const f = path.join(BOOKS, `${gid}.txt`);
  if (!fs.existsSync(f)) { bad.push(`缺原文 ${gid}`); continue; }
  const raw = normalize(fs.readFileSync(f, 'utf8'));

  const hits = [];
  for (const a of list) {
    total++;
    const probe = a.tx.slice(0, 60);
    const at = raw.indexOf(probe);
    if (at < 0) { bad.push(`${a.id} 在 ${gid}.txt 里找不到`); continue; }
    found++;
    // 开头能对上，整段也要能对上（防止只对开头、后面是拼的）
    if (raw.slice(at, at + a.tx.length) !== a.tx) { bad.push(`${a.id} 前 60 字命中但中段不符`); continue; }
    hits.push({ at, len: a.tx.length, id: a.id });
  }

  // 按原文位置重排，看有没有互相压住的地方
  hits.sort((x, y) => x.at - y.at);
  let overlap = 0;
  for (let i = 1; i < hits.length; i++) {
    if (hits[i].at < hits[i - 1].at + hits[i - 1].len) overlap++;
  }
  const covered = hits.reduce((s, h) => s + h.len, 0);
  stats.push({ gid, title: list[0].s, hits: hits.length, overlap, cover: covered / raw.length, chars: raw.length });
}

console.log(`按原著分组的 ${byBook.size} 本书：`);
for (const [gid, list] of [...byBook].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${gid.padEnd(6)} ${String(list.length).padStart(3)} 篇  ${list[0].s}`);
}

console.log(`\n逐篇逐字比对：${total} 篇里命中 ${found} 篇`);
console.log(`维基条目（无本地原文可查）：${articles.filter(a => /^simple\.wikipedia:/.test(a.u || '')).length} 篇`);

console.log('\n每本书取了多少、有没有互相重叠、覆盖原作多少：');
console.log('  编号    篇数  重叠  覆盖率   原作规模');
for (const s of stats.sort((a, b) => b.hits - a.hits)) {
  console.log(`  ${s.gid.padEnd(6)} ${String(s.hits).padStart(4)}  ${String(s.overlap).padStart(3)}   ${(s.cover * 100).toFixed(1).padStart(5)}%   ${(s.chars / 1000).toFixed(0)}k 字符  ${s.title}`);
}

if (bad.length) {
  console.log('\n✗ 问题：');
  for (const b of bad.slice(0, 10)) console.log('  ' + b);
  process.exit(1);
}
console.log('\n✓ 全部可溯源：每篇都是原书里连续的一段，没有被拼接');
