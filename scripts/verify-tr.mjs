/**
 * 译文完整性校验：每次改语料 / 改切句规则 / 合入批次后都该跑一遍。
 * 用法：node scripts/verify-tr.mjs   （npm run verify）
 *
 * 检查三件事：
 *  1. 每篇文章的译文数组长度 === 用「运行时同一套规则」切出的句数
 *  2. 没有缺失的文章（1156 篇全覆盖）
 *  3. 没有空串（空串说明那次翻译失败了，但被写成了 ''）
 *
 * 退出码非 0 表示有问题，可以直接接进 CI。
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

let missing = 0;
let misaligned = 0;
let emptyCells = 0;
let total = 0;

for (const a of articles) {
  const cur = tr[a.id];
  const want = splitSentences(a.tx).length;
  total += want;

  if (!cur) { missing++; continue; }
  if (cur.length !== want) {
    misaligned++;
    if (misaligned <= 5) console.log(`  ✗ ${a.id}  ${cur.length} 句译文 / 应为 ${want} 句`);
    continue;
  }
  for (let i = 0; i < cur.length; i++) {
    if (!cur[i] || !cur[i].trim()) {
      emptyCells++;
      if (emptyCells <= 8) console.log(`  ○ ${a.id} 第 ${i + 1} 句为空`);
    }
  }
}

const covered = articles.length - missing;
console.log(`文章 ${articles.length} 篇 · 有译文 ${covered} 篇 · 总句数 ${total}`);
console.log(`缺失 ${missing} · 句数不符 ${misaligned} · 含空句 ${emptyCells}`);

const ok = missing === 0 && misaligned === 0 && emptyCells === 0;
console.log(ok ? '✅ 译文与句数全部对齐' : '❌ 存在不一致');
process.exit(ok ? 0 : 1);
