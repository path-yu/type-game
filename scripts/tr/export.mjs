/**
 * 把翻完的书导出成 App 能读的单本文件。
 *
 * 只导出 100% 翻完的书 —— 半本书发出去，读到最后突然没有中文，
 * 比"这本书还没开放全书阅读"糟得多。没翻完的书仍走原来的选段阅读。
 *
 * 产物：
 *   public/data/full/<slug>.json    {s: 书名, n: 句数, src: [英文…], tr: [中文…]}
 *   public/data/full/index.json     {books: {slug: {title, n, kb}}}
 *
 * 用法：node scripts/tr/export.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const WORK = path.join(ROOT, 'data/tr-work');
const OUT = path.join(ROOT, 'public/data/full');
fs.mkdirSync(OUT, { recursive: true });

const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr-meta.json'), 'utf8'));
const index = { v: 1, books: {} };
let exported = 0, skipped = [];

for (const [slug, m] of Object.entries(meta)) {
  const wf = path.join(WORK, `${slug}.json`);
  if (!fs.existsSync(wf)) { skipped.push(slug); continue; }
  const work = JSON.parse(fs.readFileSync(wf, 'utf8'));
  if (Object.keys(work).length < m.n) { skipped.push(slug); continue; }

  const src = fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
    .split('\n').filter(Boolean).map(l => JSON.parse(l).en);
  const tr = src.map((_, i) => work[i]);
  if (tr.some(t => !t || !/[\u4e00-\u9fa5]/.test(t))) {
    console.error(`✗ ${m.title}：有译文不合格，跳过导出`);
    skipped.push(slug);
    continue;
  }

  const file = path.join(OUT, `${slug}.json`);
  const body = JSON.stringify({ s: m.title, n: m.n, src, tr });
  fs.writeFileSync(file, body);
  index.books[slug] = { title: m.title, n: m.n, kb: Math.round(Buffer.byteLength(body) / 1024) };
  exported++;
  console.log(`  ✓ ${m.title}  ${m.n} 句  ${index.books[slug].kb} KB`);
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
console.log(`\n✓ 导出 ${exported} 本 · 未完成 ${skipped.length} 本 → public/data/full/`);
