/**
 * 把《一九八四》的逐句译文，接到它的 40 段选段上。
 *
 * 背景：这本书先有了整本译文（data/tr-work/nineteen-eighty-four.json，按句对齐），
 * 后来才用 add-books.mjs 切出 40 段收进文库。选段和整本用的是同一把切句尺
 * （src/lib/split.js），所以段内的每一句都能在整本译文里找到对应的一句，
 * 按句拼回去即可 —— 不需要再翻一遍。
 *
 * 硬校验：每段拼出来的条数必须等于 splitSentences(tx) 的句数，且不许有空缺。
 * 少一句就整体错位，界面上看不出来，只会觉得"翻译怪怪的"。
 *
 * 用法：node scripts/attach-1984-tr.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from './lib/prose.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dry = process.argv.includes('--dry');
const SLUG = 'nineteen-eighty-four';
const PREFIX = 'n1984-';

/*
 * 句子对齐的键。
 * 段落是用 chunkParagraph 切出来的，它会把句首的引号/标点剥掉
 * （`‘You are thinking,’ he said` 进段落后变成 `You are thinking,’ he said`），
 * 而整本那份句子还留着引号。所以比对前要把两侧的引号和空白都抹平，
 * 否则会有几段"看起来一样却对不上"。
 */
const key = s => s
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[—–]+/g, '-')
  .replace(/-{2,}/g, '-')
  .replace(/\s+/g, ' ')
  .replace(/^[\s"'.,;:!?)\]]+/, '')
  .replace(/[\s"'(\[]+$/, '')
  .trim();

/* 整本：句子 → 译文 */
const src = fs.readFileSync(path.join(ROOT, `data/tr-src/${SLUG}.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map(JSON.parse);
const work = JSON.parse(fs.readFileSync(path.join(ROOT, `data/tr-work/${SLUG}.json`), 'utf8'));
const zhOf = new Map();
src.forEach((row, i) => { if (work[i]) zhOf.set(key(row.en), work[i]); });

/*
 * 只认「规范化后完全相等」。曾经试过按开头 30 字兜底，结果把更长的句子
 * 配到了短句上，译文比原文长出一大截 —— 质检一眼就看出来（too-long）。
 * 对不上的段宁可整段不入库：少一段选段读者不会察觉，错位才会。
 */
const lookup = (s) => zhOf.get(key(s)) ?? '';
console.log(`整本 ${src.length} 句，有译文 ${Object.keys(work).length}`);

const trPath = path.join(ROOT, 'public/data/tr.json');
const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items
  .filter(a => a.id.startsWith(PREFIX));

let ok = 0;
const bad = [];
for (const a of arts) {
  const sents = splitSentences(a.tx);
  const zh = sents.map(lookup);
  const gaps = zh.filter(z => !z).length;
  if (!gaps && zh.length === sents.length) {
    ok++;
    tr.map[a.id] = zh;
  } else {
    /*
     * 对不齐的段直接不入库，而不是留空。
     * 一段里少一句，界面上看不出来，只会觉得"这一段翻得怪"——
     * 这本书的整本译文还在，少 3 段选段不影响读，错位才会。
     */
    bad.push(a.id);
    console.warn(`  ⚠ ${a.id} 句数 ${sents.length} · 缺 ${gaps} → 不入库`);
    sents.forEach((s, i) => { if (!zh[i]) console.warn(`      对不上: ${s.slice(0, 70)}`); });
  }
}

console.log(`段落 ${arts.length} · 完整 ${ok} · 丢弃 ${bad.length}`);
if (dry) { console.log('--dry，不写盘'); process.exit(0); }

fs.writeFileSync(trPath, JSON.stringify(tr));

if (bad.length) {
  const artsPath = path.join(ROOT, 'public/data/articles.json');
  const all = JSON.parse(fs.readFileSync(artsPath, 'utf8'));
  const drop = new Set(bad);
  all.items = all.items.filter(x => !drop.has(x.id));
  const kept = all.items.filter(x => x.id.startsWith(PREFIX));
  kept.forEach((x, i) => { x.ord = i + 1; x.tot = kept.length; });
  fs.writeFileSync(artsPath, JSON.stringify(all));
  console.log(`已从 articles.json 移除 ${bad.length} 段，${PREFIX}* 现有 ${kept.length} 段`);
}

console.log('已写入 tr.json');
