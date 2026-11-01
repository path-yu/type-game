/**
 * 合并译文：把批次写回 public/data/tr.json
 * 用法：node scripts/import-tr.mjs data/tr-inbox/batch-001.json
 * 文件格式：{ "文章id": ["句1译文", "句2译文", ...], ... }
 *
 * 闸门是**整批**的，不是逐篇的：任何一篇不合格 → 整批拒收、一个字节都不写。
 * 理由见 docs/04-long-task-pipeline.md §2 S4：
 * 「逐篇跳过」会让一批数据半生不熟地落地，而半生不熟是最难排查的状态。
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ART = path.join(ROOT, 'public/data/articles.json');
const TR = path.join(ROOT, 'public/data/tr.json');

const file = process.argv[2];
if (!file) { console.error('用法: node scripts/import-tr.mjs <译文文件.json>'); process.exit(1); }

const articles = new Map(JSON.parse(fs.readFileSync(ART, 'utf8')).items.map(a => [a.id, a]));
const tr = JSON.parse(fs.readFileSync(TR, 'utf8'));
const incoming = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));

/* ---------- 第一阶段：全量校验，只读不写 ---------- */

const errors = [];
const clean = {};

for (const [id, arr] of Object.entries(incoming)) {
  const a = articles.get(id);
  if (!a) { errors.push(`${id} 不存在于 articles.json（id 拼错会导致静默丢稿）`); continue; }

  const want = splitSentences(a.tx).length;
  if (!Array.isArray(arr)) { errors.push(`${id} 不是数组`); continue; }
  if (arr.length !== want) { errors.push(`${id} 句数不符（期望 ${want}，收到 ${arr.length}）`); continue; }

  const badIdx = [];
  const fixed = arr.map(x => (typeof x === 'string' ? x.trim() : ''));
  fixed.forEach((v, i) => { if (!v) badIdx.push(i + 1); });
  if (badIdx.length) { errors.push(`${id} 有 ${badIdx.length} 句为空（第 ${badIdx.slice(0, 5).join('/')} 句）`); continue; }

  clean[id] = fixed;
}

if (errors.length) {
  console.error(`✗ 整批拒收，未写入任何数据（${errors.length} 处问题）`);
  errors.slice(0, 12).forEach(e => console.error(`  · ${e}`));
  if (errors.length > 12) console.error(`  · …… 另有 ${errors.length - 12} 处`);
  process.exit(1);
}

/* ---------- 第二阶段：一次性落盘（临时文件 + rename） ---------- */

for (const [id, arr] of Object.entries(clean)) tr.map[id] = arr;

const tmp = `${TR}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(tr));
fs.renameSync(tmp, TR);

const total = articles.size;
const covered = Object.keys(tr.map).length;
console.log(`✅ 合并 ${Object.keys(clean).length} 篇（整批通过）`);
console.log(`总进度 ${covered} / ${total} = ${(covered / total * 100).toFixed(1)}%`);
