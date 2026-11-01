/**
 * 分层抽样：每个难度档随机抽 N 句，用于人工判断「翻译是否生硬」。
 * 固定随机种子，保证每次抽到同一批（可复现）。
 *
 * 用法：node scripts/qa-sample.mjs --n 20
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

const N = Number(process.argv[process.argv.indexOf('--n') + 1]) || 20;

// 确定性伪随机（mulberry32），换种子才换样本
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20261101);
const out = [];
const levels = [...new Set(articles.map(a => a.lv))].sort();

for (const lv of levels) {
  const pool = [];
  for (const a of articles.filter(x => x.lv === lv)) {
    const sents = splitSentences(a.tx);
    sents.forEach((s, i) => {
      const zh = (tr[a.id] || [])[i];
      // 只抽「有完整句子」的，跳过过短的应答句（对判断文风没有信息量）
      if (zh && s.text.replace(/\s+/g, '').length >= 45) pool.push({ id: a.id, lv, i, en: s.text, zh });
    });
  }
  for (let k = 0; k < N && pool.length; k++) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
}

fs.mkdirSync(path.join(ROOT, 'data/qa'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/qa/sample.json'), JSON.stringify(out, null, 1));

out.forEach((x, k) => {
  console.log(`${k + 1}. [${x.id}#${x.i}] L${x.lv}`);
  console.log(`   EN ${x.en.replace(/\s+/g, ' ')}`);
  console.log(`   ZH ${x.zh}`);
});
console.log(`\n共 ${out.length} 句`);
