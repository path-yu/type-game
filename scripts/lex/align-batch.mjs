/**
 * 把「按旧义项顺序译的中文」对到新顺序上。
 *
 * 译一批词的时候，义项顺序是当时的样子；如果之后排序规则改了（比如加了
 * 按词性分组），同样的位次指向的就变成另一个义项了。数量还对得上，
 * 内容已经错位 —— 这类错必须在这里拦住。
 *
 * 做法：用上一版分片（git HEAD）里的英文释义作参照，把「英文释义 → 中文」
 * 搬到当前的义项顺序上；对不上的留空。
 *
 * 用法：node scripts/lex/align-batch.mjs data/lex-zh/in/batch-4.json [...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const OUT = path.join(ROOT, 'data/lex-zh/merged.json');
const files = process.argv.slice(2);
if (!files.length) { console.error('用法: node scripts/lex/align-batch.mjs <batch.json>...'); process.exit(1); }

const merged = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const oldCache = new Map();
const old = (ch) => {
  if (!oldCache.has(ch)) {
    const raw = execSync(`git show HEAD:public/data/lex/${ch}.json`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    oldCache.set(ch, JSON.parse(raw));
  }
  return oldCache.get(ch);
};
const curCache = new Map();
const cur = (ch) => {
  if (!curCache.has(ch)) curCache.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return curCache.get(ch);
};

let ok = 0, partial = 0, miss = 0;
for (const f of files) {
  const batch = JSON.parse(fs.readFileSync(path.resolve(ROOT, f), 'utf8'));
  for (const [w, zh] of Object.entries(batch)) {
    const before = old(w[0])[w]?.senses?.map(s => s.d) ?? [];
    const after = cur(w[0])?.[w]?.senses?.map(s => s.d) ?? [];
    if (!after.length) { miss++; continue; }
    const map = new Map();
    before.forEach((g, i) => { if (zh[i]) map.set(g, zh[i]); });
    const next = after.map(g => map.get(g) ?? '');
    const hit = next.filter(Boolean).length;
    if (!hit) { miss++; continue; }
    merged[w] = next;
    if (hit === after.length) ok++; else partial++;
  }
}

fs.writeFileSync(OUT, JSON.stringify(merged, null, 1) + '\n');
console.log(`完整 ${ok} · 部分 ${partial} · 无对应 ${miss} · 累计 ${Object.keys(merged).length} 词`);
