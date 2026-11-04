/**
 * 中文释义的进度：不只看词条数，更看**语料词次覆盖率**。
 *
 * 26,911 个词条里译了 600 多个，看着才 2%；但按出现次数算，
 * 这几个词占了语料的大半 —— 衡量"查得懂"应该用后者。
 *
 * 用法：node scripts/lex/status.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lex/index.json'), 'utf8'));
const merged = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lex-zh/merged.json'), 'utf8'));
const ov = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lex-zh/overrides.json'), 'utf8'));

const has = new Set([...Object.keys(merged), ...Object.keys(ov).filter(k => k !== '_comment')]);

let totalTok = 0, coveredTok = 0, withFreq = 0, coveredWords = 0;
for (const [w, f] of idx.rows) {
  totalTok += f;
  if (f > 0) withFreq++;
  if (has.has(w)) { coveredTok += f; coveredWords++; }
}

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '0.0') + '%';
console.log(`词条 ${idx.total.toLocaleString()} · 有语料频次 ${withFreq.toLocaleString()}`);
console.log(`中文释义 ${coveredWords} 词（人工 ${Object.keys(ov).length - 1} + 分批 ${Object.keys(merged).length}）`);
console.log(`语料词次覆盖 ${pct(coveredTok, totalTok)}  （${coveredTok.toLocaleString()} / ${totalTok.toLocaleString()}）`);

/* 还差的高频词：按频次取前 20 */
const todo = idx.rows
  .filter(([w, f]) => f > 0 && !has.has(w))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
console.log('\n下一个该译的高频词：');
console.log('  ' + todo.map(([w, f]) => `${w}(${f})`).join(' '));
