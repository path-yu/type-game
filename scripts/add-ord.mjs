// 给每篇补一个"它在原书里排第几"的序号（ord / tot）。
//
// 为什么需要：build-data 在建库时对每个难度层做了洗牌（为了推荐时不总是同一本书），
// 洗牌之后 id 编号和原文顺序彻底脱钩 —— alice-0002 可能是原文第 100 段，
// 紧接着的 alice-0003 却是第 13 段。连着读同一本书的碎片，就成了跳着读。
//
// 这个脚本不改 id（tr.json 是按 id 索引的，动 id 等于让 5364 句译文全部错位），
// 只补两个字段：ord = 原书内序号，tot = 该书总段数。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'public/data/articles.json');
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

const data = JSON.parse(fs.readFileSync(ART, 'utf8'));
const byBook = new Map();
for (const a of data.items) {
  const m = /^gutenberg:(\d+)$/.exec(a.u || '');
  if (!m) continue;
  if (!byBook.has(m[1])) byBook.set(m[1], []);
  byBook.get(m[1]).push(a);
}

let placed = 0;
const missing = [];
for (const [gid, list] of byBook) {
  const f = path.join(BOOKS, `${gid}.txt`);
  if (!fs.existsSync(f)) { missing.push(gid); continue; }
  const raw = normalize(fs.readFileSync(f, 'utf8'));
  const hits = [];
  for (const a of list) {
    const at = raw.indexOf(a.tx.slice(0, 60));
    if (at < 0) { missing.push(a.id); continue; }
    hits.push({ a, at });
  }
  hits.sort((x, y) => x.at - y.at);
  hits.forEach(({ a }, i) => {
    a.ord = i + 1;
    a.tot = hits.length;
    placed++;
  });
}

// 维基条目没有本地原文，按 id 顺序补个占位，避免 UI 拿到 undefined
for (const a of data.items) {
  if (a.ord == null) { a.ord = 0; a.tot = 0; }
}

fs.writeFileSync(ART, JSON.stringify(data));
console.log(`✓ 已写入 ord/tot：${placed} 篇按原文位置排序`);
if (missing.length) console.log(`· 未能定位：${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ' …' : ''}`);

const sample = data.items.filter(a => a.s === 'Moby Dick').sort((x, y) => x.ord - y.ord).slice(0, 5);
console.log('\nMoby Dick 前 5 段（按原文顺序）：');
for (const a of sample) console.log(`  ord ${String(a.ord).padStart(2)}/${a.tot}  ${a.id.padEnd(12)} ${a.tx.slice(0, 46)}…`);
