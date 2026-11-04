/**
 * 挑出还没中文释义的词，按语料频次从高到低。
 *
 * 只挑 sense 数 ≤ 4 的：一次翻太多义项容易走神，质量会掉；
 * 高频又义项多的（run/get/take）单独留到最后慢慢啃。
 *
 * 用法：node scripts/lex/next-gloss.mjs [--n=120] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const ZH = path.join(ROOT, 'data/lex-zh/merged.json');

const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? 120);
const asJson = process.argv.includes('--json');

const idx = JSON.parse(fs.readFileSync(path.join(LEX, 'index.json'), 'utf8'));
const done = fs.existsSync(ZH) ? JSON.parse(fs.readFileSync(ZH, 'utf8')) : {};
// 人工表里已经定过的词不要再发出来（它们的中文不走分批翻译这条路）
const OV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lex-zh/overrides.json'), 'utf8'));
for (const k of Object.keys(OV)) done[k] = 1;

const rows = idx.rows.filter(([w, f]) => f > 0 && !done[w]);

/* 按频次从高到低挑，分片按需读一次就缓存 */
const byFreq = [...rows].sort((a, b) => b[1] - a[1]);
const shards = new Map();
const picked = [];
for (const [w, f] of byFreq) {
  if (picked.length >= n) break;
  const ch = w[0];
  if (!shards.has(ch)) {
    shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  }
  const e = shards.get(ch)[w];
  if (!e || e.senses.length > 4) continue;
  const todo = e.senses.filter(x => x.d && !x.zh);
  if (!todo.length) continue; // 已经有中文了（人工表或旧词典兜底）
  picked.push({ w, f, senses: todo.map(s => ({ p: s.p, d: s.d })) });
}

if (asJson) {
  console.log(JSON.stringify(picked, null, 1));
} else {
  console.log(`待译 ${rows.length} 词 · 本次取 ${picked.length}`);
  for (const it of picked) {
    console.log(`\n${it.w} (${it.f})`);
    it.senses.forEach((s, i) => console.log(`  ${i + 1}. [${s.p || '-'}] ${s.d}`));
  }
}
