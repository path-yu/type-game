/**
 * 引号规范化：原文这一段是引语（以 " 开头/结尾），译文却完全没用引号时，
 * 按位置补上「 或 」。
 *
 * 为什么需要：1156 篇的译文是分 52 批做的，不同批次对「独立成句的引语」处理不一致——
 * 有的用了「」，有的直接裸着。玩家读中文时靠引号判断「这句是谁在说话」，
 * 缺了引号会让对话段落糊成一片。
 *
 * 用法：
 *   node scripts/qa-quotes.mjs            干跑，只统计 + 抽样
 *   node scripts/qa-quotes.mjs --apply    生成 data/tr-inbox/fix-quotes.json（仍需 import-tr 合入）
 *
 * 只处理「译文完全没有引号」这一种情况。已经有引号但位置不对的，不做猜测。
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

const APPLY = process.argv.includes('--apply');
const HAS_QUOTE = /[\u300c\u300d\u201c\u201d]/;

const changes = [];
const byArticle = new Map();

for (const a of articles) {
  const sents = splitSentences(a.tx);
  const arr = tr[a.id] || [];
  sents.forEach((s, i) => {
    const en = s.text.trim();
    const zh = (arr[i] || '').trim();
    if (!zh) return;

    // 只处理一种情况：原文这一句自成一对引语（同时以引号开头和结尾），而译文完全没用引号。
    // 只有半边引号的属于「切句把对话切开」，它的另一半在相邻句里——此时补或不补都可能破坏配对，
    // 所以一律不动（第一版贪心地补半边，结果留下一堆孤立的 」，已经回滚）。
    const starts = /^["\u201c]/.test(en);
    const ends = /["\u201d]$/.test(en);
    if (!starts || !ends) return;
    if (HAS_QUOTE.test(zh)) return;

    const target = `\u300c${zh}\u300d`;

    changes.push({ id: a.id, i, en, from: zh, to: target });
    if (!byArticle.has(a.id)) byArticle.set(a.id, [...arr]);
    byArticle.get(a.id)[i] = target;
  });
}

console.log(`可补引号的句子：${changes.length} 句，涉及 ${byArticle.size} 篇`);
byArticle.forEach((_, id) => {
  const list = changes.filter(c => c.id === id);
  if (list.length) {
    // 只打印前 8 篇的前 2 条，用于人工确认规则没问题
    if ([...byArticle.keys()].indexOf(id) < 8) {
      list.slice(0, 2).forEach(c => {
        console.log(`  ${c.id}#${c.i}`);
        console.log(`    EN ${c.en.replace(/\s+/g, ' ').slice(0, 70)}`);
        console.log(`    ${JSON.stringify(c.from.slice(0, 40))} → ${JSON.stringify(c.to.slice(0, 46))}`);
      });
    }
  }
});

if (!APPLY) {
  console.log('\n（干跑。确认无误后加 --apply 生成 fix-quotes.json）');
} else {
  const out = {};
  byArticle.forEach((arr, id) => { out[id] = arr; });
  const p = path.join(ROOT, 'data/tr-inbox/fix-quotes.json');
  fs.writeFileSync(p, JSON.stringify(out, null, 1));
  console.log(`\n已写出 ${p}（${Object.keys(out).length} 篇），合入请执行：`);
  console.log('  node scripts/import-tr.mjs data/tr-inbox/fix-quotes.json');
}
