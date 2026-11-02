/**
 * 取出「下一批待译句子」。
 *
 * 这是整条流水线的关键：每次只把 150~250 句喂给翻译的人（或模型），
 * 不把整本书塞进上下文 —— 一次给的越多，后面的句子越糊，漏句也越难发现。
 *
 * 用法：
 *   node scripts/tr/next.mjs <slug>               下一批（默认 200 句）
 *   node scripts/tr/next.mjs <slug> --n 120       指定句数
 *   node scripts/tr/next.mjs <slug> --from 1200   从某句开始（配合 --n 就是固定一段）
 *   node scripts/tr/next.mjs <slug> --json        输出 {"start":n,"items":[{i,en}]}
 *   node scripts/tr/next.mjs --all                所有书还剩多少
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const WORK = path.join(ROOT, 'data/tr-work');

const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr-meta.json'), 'utf8'));
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};

const readSrc = slug => fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));

const readWork = slug => {
  const f = path.join(WORK, `${slug}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
};

if (process.argv.includes('--all')) {
  let tot = 0, done = 0;
  for (const [slug, m] of Object.entries(meta)) {
    const w = readWork(slug);
    const d = Object.keys(w).length;
    tot += m.n; done += d;
    const pct = ((d / m.n) * 100).toFixed(1);
    console.log(`${slug.padEnd(28)} ${String(d).padStart(6)}/${String(m.n).padEnd(6)} ${pct.padStart(5)}%`);
  }
  console.log(`\n合计 ${done.toLocaleString()} / ${tot.toLocaleString()} 句（${((done / tot) * 100).toFixed(1)}%）`);
  process.exit(0);
}

const slug = process.argv[2];
if (!slug || !meta[slug]) {
  console.error('用法：node scripts/tr/next.mjs <slug> [--n 200] [--from 0] [--json]');
  console.error('可用：', Object.keys(meta).join(' '));
  process.exit(1);
}

const m = meta[slug];
const src = readSrc(slug);
const work = readWork(slug);
const n = +arg('--n', 200);

let start;
if (arg('--from') != null) start = +arg('--from');
else {
  start = 0;
  while (start < src.length && work[start] != null) start++;
}

const items = src.slice(start, start + n).filter(x => work[x.i] == null);
if (!items.length) {
  console.log(`${slug} 已全部翻完（${m.n} 句）。`);
  process.exit(0);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ slug, title: m.title, start, n: m.n, items }, null, 0));
} else {
  console.log(`# ${m.title} · ${m.n} 句 · 这次要译 ${items.length} 句（第 ${items[0].i}–${items[items.length - 1].i} 句）`);
  console.log(`# 译完请写成一个 JSON 数组，长度必须正好 ${items.length}，再执行：`);
  console.log(`#   node scripts/tr/put.mjs ${slug} ${start} <你的文件.json>`);
  console.log('');
  for (const it of items) console.log(`${it.i}\t${it.en}`);
}
