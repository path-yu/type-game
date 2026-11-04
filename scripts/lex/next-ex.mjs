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

/* 义项前面挂专业标签的，多半是术语：(law)、(geology)、(baseball)、(music) */
const DOMAIN = /\((law|geology|biology|botany|zoology|chemistry|physics|music|baseball|cricket|medicine|anatomy|architecture|nautical|military|heraldry|printing|typography|grammar|linguistics|computing|mathematics|finance|accounting|sports|hunting|fishing|agriculture|obsolete|archaic)\)/i;

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

const pending = idx.rows
  .filter(([w, f, , hasEx]) => f === 0 && hasEx === 0 && !done[w] && (!from || w.startsWith(from)))
  .map(([w, , pos]) => [w, pos.length, pos]);

/*
 * 英式 -ise 变体：词表里既然有 capitalise 也有 capitalize，两条都写就是白写一遍。
 * 有 -ize 主条的，-ise 一律跳过（organise / harmonise / immobilise 都是这种情况）。
 */
const allWords = new Set(idx.rows.map(r => r[0]));
const isBritishVariant = w =>
  /(ise|isation|ised|ising)$/.test(w) && allWords.has(w.replace(/ise/, 'ize').replace(/isation/, 'ization'));

const picked = [];
for (const [w, score, pos] of pending.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  if (picked.length >= n) break;
  const e = shardOf(w[0])[w];
  if (!e) continue;
  const glosses = (e.senses || []).map(s => s.d || '');
  // 专名：只要多数义项是「a city in …」这类句子就算，charles 这种半人半地名的也能拦住
  if (glosses.length && glosses.filter(g => PROPER.test(g)).length * 2 >= glosses.length) continue;
  if (glosses.length && glosses.filter(g => DOMAIN.test(g)).length * 2 >= glosses.length) continue;
  if (isBritishVariant(w)) continue;
  if (w.length > 10 || w.includes(' ') || w.includes('-')) continue;
  /*
   * 只收有动词或形容词义项的。纯名词那批基本都是术语和物件名
   * （anteater / bunt / congee / alto），义项再多也不值得编例句；
   * capsule、citation 这种常用的，早在按字母推的时候写掉了。
   */
  if (!/[va]/.test(pos)) continue;
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
