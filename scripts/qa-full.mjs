/**
 * 全书译文的体检。
 *
 * tr.json 那套质检（scripts/qa-tr.mjs）只管选段，管不到 data/tr-work —— 全书层
 * 一直没人查。这本 21 本、八万八千句的东西如果哪天混进一句空译文或整句英文，
 * 界面上只会显示成一行空白，谁也不会去翻。
 *
 * 判定分两级：
 *   硬错误 —— 空译文 / 整句没翻成中文 / 译文与原文完全一样。这些一定是错。
 *   提示   —— 同一句英文两种译法 / 中文里夹了长串英文。可能是有意的（拉丁文引语）。
 *
 * 引号不配对**不算问题**：一句对话常常在这句开引号、下句才收，
 * 逐句看必然一半对不上。真要查得跨句配对，得不偿失。
 *
 * 用法：node scripts/qa-full.mjs [--strict]
 *   --strict 时把提示也算失败（平时只报不拦）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/tr-work');
const SRC = path.join(ROOT, 'data/tr-src');
const strict = process.argv.includes('--strict');

const hasCJK = s => /[\u4e00-\u9fff]/.test(s);
const CN_NUM = /[一二三四五六七八九十百千万零〇两]/;

let files = 0, sents = 0;
const hard = [];
const soft = [];

for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.json'))) {
  const slug = f.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  let src = [];
  try {
    src = fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
      .split('\n').filter(Boolean).map(JSON.parse);
  } catch { /* 没有底稿就只查译文本身 */ }

  files++;
  const byZh = new Map();

  for (const k of Object.keys(work)) {
    sents++;
    const zh = String(work[k] ?? '');
    const en = src[+k]?.en ?? '';

    if (!zh.trim()) { hard.push(`${slug}#${k} 空译文`); continue; }
    if (!hasCJK(zh) && zh.length > 4) hard.push(`${slug}#${k} 没有中文: ${zh.slice(0, 40)}`);
    if (en && zh.trim() === en.trim()) hard.push(`${slug}#${k} 与原文相同`);

    // 长串英文：多半是漏翻，也可能是原文里的拉丁文/法语引语
    if (/[A-Za-z]+(?:[ ,.';-]+[A-Za-z]+){6,}/.test(zh)) {
      soft.push(`${slug}#${k} 中文里夹长串英文: ${zh.slice(0, 48)}`);
    }

    /*
     * 数字丢失：原文有多位数字，译文里却既没有阿拉伯数字也没有汉字数字
     * （"1843" → "一八四三" 是正常译法，所以两边都要看）。
     * 这是漏译里最能藏住的一种 —— 少一个年份，句子照样通顺。
     */
    const nums = (en.match(/\b\d{2,}\b/g) ?? []);
    if (nums.length && !/\d/.test(zh) && !CN_NUM.test(zh)) {
      soft.push(`${slug}#${k} 原文有数字 ${nums.join(',')}，译文里找不到: ${zh.slice(0, 40)}`);
    }

    const prev = byZh.get(zh);
    /*
     * 只报长句撞车。短句撞车是正常的 —— "是。"、"我不知道。" 全书出现几十次，
     * 硬拦会把它们全列出来，真正可能是复制粘贴错的长句反而被埋掉。
     */
    if (prev !== undefined && en && src[prev]?.en !== en && zh.length >= 12) {
      soft.push(`${slug}#${k} 与 #${prev} 译文相同但原文不同: ${zh.slice(0, 40)}`);
    } else if (prev === undefined) byZh.set(zh, +k);
  }
}

console.log(`全书 ${files} 本 · ${sents} 句`);
if (soft.length) {
  console.log(`\n提示 ${soft.length} 条（不影响使用，逐条看过再决定改不改）：`);
  soft.slice(0, 10).forEach(s => console.log('  ·', s));
  if (soft.length > 10) console.log(`  …另有 ${soft.length - 10} 条`);
}
if (hard.length) {
  console.error(`\n✗ 硬错误 ${hard.length} 条：`);
  hard.slice(0, 20).forEach(s => console.error('  ' + s));
  process.exit(1);
}
if (strict && soft.length) {
  console.error(`\n✗ --strict：${soft.length} 条提示也算失败`);
  process.exit(1);
}
console.log('\n✅ 全书译文无硬错误（空译文 / 非中文 / 照抄原文）');
