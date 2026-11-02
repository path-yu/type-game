/**
 * 校正每篇文章的「句数」字段。
 *
 * 背景：切句规则曾在 build-data 里另抄了一份，和前端 src/lib/split.js 漂移了。
 * 结果是 139 篇文章的 `st` 和实际渲染的段落数对不上 ——
 * 页头写「3 句」，阅读页却渲染 4 段。译文是按前端那份对齐的，所以译文没错，
 * 错的是这个字段。
 *
 * 只改 `st` 与 `avg`，**不动 `lv`**：等级是历史定级结果，改它会让用户的城区进度、
 * 每日卷轴抽取全部错位。`sc` 也保持原值（它是定级当时的分数，改它只会制造新的不一致）。
 *
 * 用法：node scripts/resync-sentences.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from './lib/prose.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DATA = path.join(ROOT, 'public/data');

const art = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8'));
const dry = process.argv.includes('--dry');

let changed = 0;
const samples = [];
let delta = 0;

for (const it of art.items) {
  const n = splitSentences(it.tx).length;
  if (n === it.st || n === 0) continue;
  delta += n - it.st;
  if (samples.length < 6) samples.push(`${it.id}: ${it.st}→${n}`);
  it.st = n;
  it.avg = Math.round((it.w / n) * 10) / 10;
  changed++;
}

console.log(`句数校正 ${changed} 篇（总句数 ${delta >= 0 ? '+' : ''}${delta}）`);
if (samples.length) console.log('  例：', samples.join('  '));

if (!dry && changed) {
  fs.writeFileSync(path.join(DATA, 'articles.json'), JSON.stringify(art));
  console.log('  写入 articles.json');
}
