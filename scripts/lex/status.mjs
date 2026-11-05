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

/*
 * 例句的两种来源：语料里捞出来的，和人手写的。
 * index 的第 4 位已经是「有没有例句」（两种都算），手写的条数从 examples.json 数。
 */
const exPath = path.join(ROOT, 'data/lex-zh/examples.json');
const gen = fs.existsSync(exPath) ? JSON.parse(fs.readFileSync(exPath, 'utf8')) : {};
const withEx = idx.rows.filter(r => r[3] === 1).length;
const genN = Object.keys(gen).length;

// 专名（地名、人名）不配例句 —— 它们算在「缺」里会让人以为还有活没干完
// 顺便统计「逐义项中文」：一个词的所有义项都有 zh 才算完成
const lexDir = path.join(ROOT, 'public/data/lex');
let propN = 0;
let senseFull = 0, genFull = 0, genN2 = 0;
for (const f of fs.readdirSync(lexDir)) {
  if (!/^[a-z]\.json$/.test(f)) continue;
  const shard = JSON.parse(fs.readFileSync(path.join(lexDir, f), 'utf8'));
  for (const [w, e] of Object.entries(shard)) {
    if (e.prop) propN++;
    const full = e.senses?.length && e.senses.every(s => s.zh);
    if (full) senseFull++;
    if (gen[w]) { genN2++; if (full) genFull++; }
  }
}

console.log(`\n例句 ${withEx.toLocaleString()} 词（语料 ${(withEx - genN).toLocaleString()} + 手写 ${genN}）· 仍缺 ${(idx.total - withEx).toLocaleString()}（其中专名 ${propN} 不配例句）`);
console.log('  补下一批：npm run lex:ex');
console.log(`逐义项中文 ${senseFull.toLocaleString()} 词 · 手写例句那 ${genN2} 词已覆盖 ${genFull}`);
console.log('  补下一批：npm run lex:sense');
