/**
 * 把每本书拆成「一句一行」的翻译底稿。
 *
 * 为什么按句拆：全书 8.1 万句，任何一次都要在一小段里完成才有质量。
 * 按句存、按句编号，就能断点续做 —— 翻到第 1200 句停了，下次从 1201 接着来，
 * 也不必把整本书塞进上下文。
 *
 * 产物：
 *   data/tr-src/<slug>.jsonl   {"i":0,"en":"一句英文"}
 *   data/tr-meta.json          slug → {title, gid, n}   （n 是总句数）
 *
 * 切句用 src/lib/split.js —— 全项目唯一定义处，和阅读页、打字页、译文对齐用同一把尺。
 *
 * 用法：node scripts/tr/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanGutenberg } from '../lib/prose.mjs';
import { splitSentences } from '../../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const RAW = path.join(ROOT, 'data/raw/books');
fs.mkdirSync(SRC, { recursive: true });

const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;

/** 书名 → gutenberg id（一篇文章的 u 字段就是来源） */
const gidOf = new Map();
for (const a of articles) {
  const m = /^gutenberg:(\d+)$/.exec(a.u ?? '');
  if (m && !gidOf.has(a.s)) gidOf.set(a.s, +m[1]);
}

export const slugOf = title => title
  .toLowerCase()
  .replace(/['’.,:;!?()]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 48);

/*
 * 手动指定正文起点（段落下标）。
 *
 * 自动判定用的是"第一段 ≥200 字符"，对《小妇人》这种开头连着几句短对白的书会判错：
 * 前面 0–6 段是书名、目录、"PART 1"、章题，第 7 段才是那句
 * "Christmas won't be Christmas without any presents"，只有 83 字符 ——
 * 于是"感谢火光映亮四张年轻的脸"成了第 0 句，全书最有名的那句开场白被切掉了。
 *
 * 这里按书钉住起点。改这个值会重排该书编号，已译内容必须跟着整体平移（见下面的偏移脚本）。
 */
const START_AT = {
  'little-women': 7,
  // 安妮：4 段是书名重复、5 段是 "CHAPTER I. Mrs. Rachel Lynde Is Surprised"（41 字符，被跳过）
  'anne-of-green-gables': 4,
  // 双城记：10 段是 "Book the First--Recalled to Life"，11 段是 "CHAPTER I. / The Period."，
  // 两段都不到 200 字符，被自动判据跳过 —— 全书第一章的标题就这么没了
  'a-tale-of-two-cities': 10,
};

/** --only=<slug>：只重建一本，别动其他 19 本的编号 */
const ONLY = (process.argv.find(a => a.startsWith('--only=')) ?? '').slice(7);

const meta = {};
let made = 0;

for (const [title, gid] of gidOf) {
  const slug = slugOf(title);
  if (ONLY && slug !== ONLY) {
    // 非目标书：沿用旧 meta，避免把整份 meta 写丢
    if (fs.existsSync(path.join(ROOT, 'data/tr-meta.json'))) {
      const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr-meta.json'), 'utf8'));
      if (old[slug]) meta[slug] = old[slug];
    }
    continue;
  }

  const rawFile = path.join(RAW, `${gid}.txt`);
  if (!fs.existsSync(rawFile)) {
    console.log(`  ⚠ ${title}: 原文没下载（${gid}.txt），跳过`);
    continue;
  }
  // Gutenberg 用 _斜体_ 标书名和人名，正文里不该留这些下划线
  const raw = cleanGutenberg(fs.readFileSync(rawFile, 'utf8')).replace(/_([^_]{1,400})_/gs, '$1').replace(/_/g, '');

  /*
   * 从正文起切，别把封面页和目录当成第一句。
   *
   * 目录在 cleanGutenberg 之后往往被压成"一段"（行尾换行被折叠），于是
   * "Introduction Chapter I. The Cyclone Chapter II. …" 会变成第 0 句 ——
   * 翻译它毫无意义，还会让整本书的编号从垃圾开始。
   *
   * 判定：一段里出现三次以上 Chapter/STAVE 视作目录；再跳过 Gutenberg 的版本说明。
   * 然后从第一段"像正文"的段落（≥200 字符）开始。
   */
  const paras = raw.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  /*
   * 目录的两种长相：
   *   a) 带 CHAPTER / STAVE 字样（Oz、双城记这类）
   *   b) 只有罗马数字 + 标题，没有句点（福尔摩斯、时间机器这类）
   * b 的判断要看"大写词占比"——正文字母大小写混杂，目录几乎全是首字母大写。
   */
  const isToc = p => {
    if ((p.match(/\b(CHAPTER|Chapter|STAVE|Stave)\b/g) ?? []).length >= 3) return true;
    if (p.length < 150) return false;
    const roman = (p.match(/(^|\s)[IVXLC]+\.?\s+[A-Z]/g) ?? []).length;
    // 还有一种目录只写数字：Chapter 01 My Early Home 02 The Hunt …
    if ((p.match(/(^|\s)\d{1,2}\s+[A-Z]/g) ?? []).length >= 4) return true;
    const words = p.split(/\s+/).filter(Boolean);
    const cap = words.filter(w => /^[A-Z]/.test(w)).length / Math.max(1, words.length);
    return roman >= 3 && cap > 0.35;
  };
  const isBoiler = p => /^(A Millennium Fulcrum Edition|Transcriber|Produced by|E-?text prepared|First Printing|Second Printing|Copyright|Published|This text is a combination)/i.test(p);
  let cut = paras.findIndex(p => !isToc(p) && !isBoiler(p) && p.length >= 200);
  if (cut < 0) cut = 0;
  if (START_AT[slug] !== undefined) cut = START_AT[slug];

  /*
   * 段落清一遍再切句。三件事：
   * 1. 去掉只有星号的分节线（*  *  *）—— 它们在 Gutenberg 里是装饰，
   *    不清理就会被切成"…吃完了蛋糕。*** *** ***"这种句子。
   * 2. 把段内的硬换行折成空格。原文每 70 字断一行，不折的话句子中间全是换行，
   *    翻译时容易把一行当一句，阅读页上也会莫名其妙地换行。
   * 3. 给没有句末标点的短标题补一个句号（"The Pool of Tears" → "The Pool of Tears."）,
   *    否则标题会和后面第一句连成一句，译出来是"泪水池 越来越奇怪了……"。
   */
  const clean = paras.slice(cut).map(p => {
    const lines = p.split(/\n/).filter(l => !/^\s*\*([\s*]*)\s*$/.test(l));
    const t = lines.join(' ').replace(/[ \t]+/g, ' ').trim();
    const isHeading = t.length <= 60
      && !/[.!?"”’]$/.test(t)
      && (/^(CHAPTER|Chapter|STAVE|Stave|BOOK|Book|PART|Part)\b/.test(t) || /^[A-Z][^a-z]*$/.test(t) || /^[A-Z]/.test(t));
    return isHeading ? `${t}.` : t;
  }).filter(Boolean);

  const body = clean.join('\n\n');
  const sents = splitSentences(body);
  const lines = sents.map((s, i) => JSON.stringify({ i, en: s.text }));
  fs.writeFileSync(path.join(SRC, `${slug}.jsonl`), lines.join('\n') + '\n');
  meta[slug] = { title, gid, n: sents.length };
  made++;
}

fs.writeFileSync(path.join(ROOT, 'data/tr-meta.json'), JSON.stringify(meta, null, 1) + '\n');
const total = Object.values(meta).reduce((s, m) => s + m.n, 0);
console.log(`✓ ${made} 本 · ${total.toLocaleString()} 句 → data/tr-src/`);
