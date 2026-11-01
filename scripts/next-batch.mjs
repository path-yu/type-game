/**
 * 拆批：把还没译的文章按优先级切出一批，导出成待译文件。
 * 用法：node scripts/next-batch.mjs --n 25 [--level 1] [--out data/tr-inbox/batch.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ART = path.join(ROOT, 'public/data/articles.json');
const TR = path.join(ROOT, 'public/data/tr.json');

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const N = Number(arg('n', 25));
const LEVEL = Number(arg('level', 0));
const OUT = path.join(ROOT, arg('out', 'data/tr-inbox/batch.json'));

// 切句规则与运行时共用一份（src/lib/split.js）。两边各写一套必然漂移，
// 届时「译文数组长度 === 句数」这道闸门校验的只是脚本自己的想法。

const articles = JSON.parse(fs.readFileSync(ART, 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(TR, 'utf8'));

const todo = articles
  .filter(a => !tr.map[a.id])
  .filter(a => (LEVEL ? a.lv === LEVEL : true))
  .slice(0, N)
  .map(a => ({ id: a.id, lv: a.lv, s: a.title, n: a.w, x: splitSentences(a.tx).map(x => x.text) }));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(todo, null, 1));

const left = articles.length - Object.keys(tr.map).length;
console.log(`已导出 ${todo.length} 篇 → ${path.relative(ROOT, OUT)}`);
console.log(`未译 ${left} 篇 · 本次覆盖 ${todo.reduce((s, a) => s + a.x.length, 0)} 句`);
console.log(`预计完成 ${((Object.keys(tr.map).length + todo.length) / articles.length * 100).toFixed(1)}%`);
