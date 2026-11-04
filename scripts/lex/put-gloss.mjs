/**
 * 把译好的中文释义并进 merged.json。
 *
 * 唯一硬规则：每条中文数组的长度必须等于该词的义项数。
 * 少一条就整条错位 —— 界面上「中文配着下一行英文」，肉眼看不出，
 * 只会觉得这词翻得怪。所以宁可拒收，也不收错位的。
 *
 * 用法：node scripts/lex/put-gloss.mjs data/lex-zh/in/batch-120.json [--dry]
 * 输入：{ "word": ["义项1中文", "义项2中文", ...], ... }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const OUT = path.join(ROOT, 'data/lex-zh/merged.json');

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) { console.error('用法: node scripts/lex/put-gloss.mjs <batch.json> [--dry]'); process.exit(1); }

const incoming = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));
const merged = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

const cache = new Map();
const shardOf = (ch) => {
  if (!cache.has(ch)) cache.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return cache.get(ch);
};

let ok = 0;
const bad = [];
for (const [w, zh] of Object.entries(incoming)) {
  const e = shardOf(w[0])[w];
  if (!e) { bad.push([w, '词条不存在']); continue; }
  if (!Array.isArray(zh)) { bad.push([w, '不是数组']); continue; }
  if (zh.length !== e.senses.length) {
    bad.push([w, `条数 ${zh.length} ≠ 义项 ${e.senses.length}`]);
    continue;
  }
  if (zh.some(x => typeof x !== 'string' || !x.trim())) { bad.push([w, '有空条目']); continue; }
  merged[w] = zh.map(x => x.trim());
  ok++;
}

console.log(`收下 ${ok} 条 · 拒收 ${bad.length} 条`);
for (const [w, why] of bad.slice(0, 15)) console.log(`  ✗ ${w}: ${why}`);
if (bad.length > 15) console.log(`  …另有 ${bad.length - 15} 条`);

if (dry) { console.log('--dry，不写盘'); process.exit(bad.length ? 1 : 0); }
fs.writeFileSync(OUT, JSON.stringify(merged, null, 1) + '\n');
console.log(`merged.json 现有 ${Object.keys(merged).length} 词`);
process.exit(bad.length ? 1 : 0);
