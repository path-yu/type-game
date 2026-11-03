/**
 * 把「一本本地原文」切成翻译底稿，登记进 tr-meta。
 *
 * tr/build.mjs 是从 articles.json 反推书目的 —— 只有已经切过选段、进了文库的书
 * 才走得通。整本翻译可以先于选段存在（比如《一九八四》《了不起的盖茨比》），
 * 所以单独留这个入口：给一个本地 txt，按同一把切句尺产出 tr-src/<slug>.jsonl。
 *
 * 用法：
 *   node scripts/tr/build-file.mjs <slug> "<书名>" <本地路径> [--after=正则] [--until=正则] [--gid=N]
 *
 * 例：
 *   node scripts/tr/build-file.mjs the-great-gatsby "The Great Gatsby" \
 *     data/raw/books/64317.txt --after="^CHAPTER 1" --gid=64317
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanGutenberg, normalize } from '../lib/prose.mjs';
import { splitSentences } from '../../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [slug, title, file] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const arg = (k) => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3);

if (!slug || !title || !file) {
  console.error('用法: node scripts/tr/build-file.mjs <slug> "<书名>" <路径> [--after=] [--until=] [--gid=N]');
  process.exit(1);
}

let raw = cleanGutenberg(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const afterRe = arg('after');
const untilRe = arg('until');
if (afterRe) {
  const m = raw.match(new RegExp(afterRe, 'm'));
  if (!m) { console.error('找不到起点:', afterRe); process.exit(1); }
  raw = raw.slice(m.index);
}
if (untilRe) {
  const m = raw.match(new RegExp(untilRe, 'm'));
  if (m) raw = raw.slice(0, m.index);
}

const paras = raw.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);

/*
 * 段落清一遍再切句（和 build.mjs 同一套规矩）：
 * 去掉纯星号分节线、把段内硬换行折成空格、给没句末标点的短标题补句号。
 */
const clean = paras.map(p => {
  const lines = p.split(/\n/).filter(l => !/^\s*\*([\s*]*)\s*$/.test(l));
  const t = normalize(lines.join(' ').replace(/\s+/g, ' ').trim());
  const isHeading = t.length <= 60
    && !/[.!?"”’]$/.test(t)
    && (/^(CHAPTER|Chapter|PART|Part|BOOK|Book)\b/.test(t) || /^[A-Z][^a-z]*$/.test(t));
  return isHeading ? `${t}.` : t;
}).filter(Boolean);

const sents = splitSentences(clean.join('\n\n'));
fs.writeFileSync(
  path.join(ROOT, `data/tr-src/${slug}.jsonl`),
  sents.map((x, i) => JSON.stringify({ i, en: x.text })).join('\n') + '\n',
);

const metaPath = path.join(ROOT, 'data/tr-meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta[slug] = {
  title,
  gid: Number(arg('gid') ?? 0),
  n: sents.length,
  src: file,
};
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1) + '\n');

console.log(`${slug} · ${sents.length} 句`);
console.log('前 3 句:', sents.slice(0, 3).map(x => x.text.slice(0, 60)));
