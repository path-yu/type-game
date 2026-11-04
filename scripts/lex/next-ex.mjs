/**
 * 挑出「语料里没出现、也还没补例句」的词，供下一批手写。
 *
 * 3.5 万里有 8 千多个是拿 WordNet 词表补足的：没有语料例句，义项也全是英文。
 * 这些词按义项数排序，义项多的通常更常见（run/get/take 那种），
 * 比按字母随机抓更有意义；专名（地名、人名、属名）单独剔掉——给 Aberdeen
 * 写例句没有学习价值。
 *
 * 用法：node scripts/lex/next-ex.mjs [--n=40] [--from=a] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const EX = path.join(ROOT, 'data/lex-zh/examples.json');

const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? 40);
const from = process.argv.find(a => a.startsWith('--from='))?.slice(7) ?? '';
const asJson = process.argv.includes('--json');

const idx = JSON.parse(fs.readFileSync(path.join(LEX, 'index.json'), 'utf8'));
const done = fs.existsSync(EX) ? JSON.parse(fs.readFileSync(EX, 'utf8')) : {};

/* 专名和术语的味儿：gloss 里几乎全是这种句式 */
const PROPER = /\b(a city|a town|a village|a state|a county|a river|a mountain|a lake|an island|a country|a port|a capital|a district|a province|a region|United States|genus|family|inhabitant|member of)\b/i;

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

const pending = idx.rows
  .filter(([w, f, , hasEx]) => f === 0 && hasEx === 0 && !done[w] && (!from || w.startsWith(from)))
  .map(([w, , pos]) => [w, pos.length]);

const picked = [];
for (const [w, score] of pending.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  if (picked.length >= n) break;
  const e = shardOf(w[0])[w];
  if (!e) continue;
  const glosses = (e.senses || []).map(s => s.d || '');
  if (glosses.length && glosses.every(g => PROPER.test(g))) continue; // 地名、人名、属名
  picked.push({
    w,
    senses: (e.senses || []).map(s => `${s.p} ${s.d}`),
  });
}

if (asJson) {
  console.log(JSON.stringify(picked, null, 1));
} else {
  const total = idx.rows.filter(([w, f, , hasEx]) => f === 0 && hasEx === 0 && !done[w]).length;
  console.log(`还差 ${total} 个词没有例句${from ? `（${from} 段）` : ''}，本批 ${picked.length} 个：\n`);
  for (const p of picked) {
    console.log(`${p.w}  [${p.senses.length}]`);
    for (const s of p.senses.slice(0, 4)) console.log(`    ${s.slice(0, 110)}`);
  }
}
