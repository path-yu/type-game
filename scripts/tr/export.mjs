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

/*
 * 导出时要丢掉的句子区间（半开区间 [from, to)）。
 *
 * 只用于"切句切进来的非正文"：目录、插图清单这类东西翻译了也是垃圾，
 * 留在全书里，读者翻到第 3 页会看见五页"狐狸和葡萄。／下金蛋的鹅。／……"。
 *
 * 不能去改 build.mjs —— 那会重排句子编号，已译的句子全部错位。
 * 这里按编号丢，译文与英文同进同退，对位不受影响。
 */
const DROP = {
  // 62 起是 CONTENTS，347 起是 LIST OF ILLUSTRATIONS，正文从 409 那一条的后半开始
  'the-aesop-for-children': [[62, 409]],
  // 5 起是 CONTENTS（每条还带着自己的罗马数字和页码），47 才是"PART ONE"与第一章标题
  'treasure-island': [[5, 47]],
  // 0–161 是献辞、圣茨伯里那篇长序、以及整份插图目录（末尾还粘着 "The End 476."），
  // 162 才是"凡是有钱的单身汉，总想娶位太太" —— 小说正文
  'pride-and-prejudice': [[0, 162]],
  // 3 起是 ETYMOLOGY 与 EXTRACTS 两大段引文（"U. S." / "Ex." 这种被切碎的卷次缩写也在里面），
  // 191 才是 "CHAPTER 1." —— 全书正文其实从"叫我以实玛利"开始
  'moby-dick': [[3, 191]],
};

const dropSet = (slug) => {
  const set = new Set();
  for (const [from, to] of DROP[slug] ?? []) for (let i = from; i < to; i++) set.add(i);
  return set;
};
const index = { v: 1, books: {} };
let exported = 0, skipped = [];

for (const [slug, m] of Object.entries(meta)) {
  const wf = path.join(WORK, `${slug}.json`);
  if (!fs.existsSync(wf)) { skipped.push(slug); continue; }
  const work = JSON.parse(fs.readFileSync(wf, 'utf8'));
  if (Object.keys(work).length < m.n) { skipped.push(slug); continue; }

  const src = fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
    .split('\n').filter(Boolean).map(l => JSON.parse(l).en);
  const skip = dropSet(slug);
  const keep = src.map((_, i) => i).filter(i => !skip.has(i));
  const srcKept = keep.map(i => src[i]);
  const trKept = keep.map(i => work[i]);
  if (trKept.some(t => !t || !/[\u4e00-\u9fa5]/.test(t))) {
    console.error(`✗ ${m.title}：有译文不合格，跳过导出`);
    skipped.push(slug);
    continue;
  }

  const file = path.join(OUT, `${slug}.json`);
  const body = JSON.stringify({ s: m.title, n: srcKept.length, src: srcKept, tr: trKept });
  fs.writeFileSync(file, body);
  index.books[slug] = { title: m.title, n: srcKept.length, kb: Math.round(Buffer.byteLength(body) / 1024) };
  exported++;
  const cut = skip.size ? `（略去 ${skip.size} 句目录/插图清单）` : '';
  console.log(`  ✓ ${m.title}  ${srcKept.length} 句  ${index.books[slug].kb} KB${cut}`);
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
console.log(`\n✓ 导出 ${exported} 本 · 未完成 ${skipped.length} 本 → public/data/full/`);
