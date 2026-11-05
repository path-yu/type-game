/**
 * 挑出「已经有补充例句、但义项还是纯英文」的词，供补中文释义。
 *
 * 背景：8 千个词表补全词从来没被翻译过——`merged.json` 只覆盖语料里
 * 出现过的词。补例句时顺手写了一句词级「简释」，但点开词条看义项，
 * 每一行仍然是英文。这个脚本就是把这一层挑出来。
 *
 * 输出顺序按词频排名（越常用越靠前），一条一条列义项，方便逐条对位。
 *
 * 用法：node scripts/lex/next-sense-zh.mjs [--n=40] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const EX = path.join(ROOT, 'data/lex-zh/examples.json');

const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? 40);
const asJson = process.argv.includes('--json');

const idx = JSON.parse(fs.readFileSync(path.join(LEX, 'index.json'), 'utf8'));
const done = fs.existsSync(EX) ? JSON.parse(fs.readFileSync(EX, 'utf8')) : {};

/* 词频只用来排序：常用的先译 */
const rank = new Map();
const loadFreq = (file, pick) => {
  const p = path.join(ROOT, 'data/wordfreq', file);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const w = pick(line);
      if (!w) return;
      const prev = rank.get(w);
      if (prev === undefined || i + 1 < prev) rank.set(w, i + 1);
    });
};
loadFreq('google-10000.txt', l => l.trim());
loadFreq('en-50k.txt', l => l.split(' ')[0].trim());

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

const rows = [];
for (const w of Object.keys(done)) {
  const e = shardOf(w[0])[w];
  if (!e) continue;
  const senses = e.senses ?? [];
  if (!senses.length) continue;
  if (senses.some(s => s.zh)) continue; // 已经译过（哪怕是部分）
  rows.push([w, rank.get(w) ?? 99999]);
}
rows.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));

const picked = rows.slice(0, n).map(([w]) => {
  const e = shardOf(w[0])[w];
  return {
    w,
    rank: rank.get(w) ?? 0,
    senses: (e.senses ?? []).map(s => `${s.p}  ${s.d}`),
  };
});

if (asJson) {
  console.log(JSON.stringify(picked, null, 1));
} else {
  console.log(`还有 ${rows.length} 个词条只给英文义项，本批 ${picked.length} 个：\n`);
  for (const p of picked) {
    console.log(`${p.w}  [${p.senses.length}]${p.rank ? `  #${p.rank}` : ''}`);
    p.senses.forEach((s, i) => console.log(`  ${i + 1}. ${s.slice(0, 120)}`));
  }
}
