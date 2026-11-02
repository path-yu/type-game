/**
 * 把一批译文写回工作区。
 *
 * 这是流水线上唯一写数据的地方，所以校验都在这里做 —— 宁可这一批退回去重做，
 * 也不能让错位的译文混进全书：一本 9000 句的书，中间错一句，后面全部对不上，
 * 而界面上完全看不出来，只会觉得"翻译怪怪的"。
 *
 * 硬校验（任何一条不过就整批拒绝）：
 *   1. 必须是 JSON 字符串数组
 *   2. 条数必须等于这一段的句数（不许少、不许多）
 *   3. 不许空串
 *   4. 必须含汉字（纯英文 = 没译）
 *   5. 不许和原句一模一样
 *
 * 软提示（只警告不拒绝）：长度比异常、相邻两句译文完全相同。
 *
 * 用法：node scripts/tr/put.mjs <slug> <start> <file.json> [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const WORK = path.join(ROOT, 'data/tr-work');
fs.mkdirSync(WORK, { recursive: true });

const [slug, startArg, file] = process.argv.slice(2);
if (!slug || !startArg || !file) {
  console.error('用法：node scripts/tr/put.mjs <slug> <start> <file.json>');
  process.exit(1);
}
const start = +startArg;

const srcAll = fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));

let zh;
try {
  zh = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`✗ 读不了 JSON：${e.message}`);
  process.exit(1);
}

/* 允许两种写法：纯字符串数组，或 [{i, zh}] */
if (Array.isArray(zh) && zh.length && typeof zh[0] === 'object') {
  const byI = new Map(zh.map(x => [x.i, String(x.zh ?? '')]));
  const idx = [...byI.keys()].sort((a, b) => a - b);
  const want = srcAll.slice(start, start + idx.length).map(x => x.i);
  if (idx.join() !== want.join()) {
    console.error(`✗ 下标不连续：期望 ${want[0]}–${want[want.length - 1]}，给的是 ${idx[0]}–${idx[idx.length - 1]}`);
    process.exit(1);
  }
  zh = want.map(i => byI.get(i));
}

if (!Array.isArray(zh)) {
  console.error('✗ 必须是一个 JSON 数组');
  process.exit(1);
}

const rows = srcAll.slice(start, start + zh.length);
const hard = [];
zh.forEach((t, k) => {
  const en = rows[k]?.en ?? '';
  const s = typeof t === 'string' ? t.trim() : '';
  const tag = `#${start + k}`;
  if (!s) hard.push(`${tag} 空译文`);
  else if (!/[\u4e00-\u9fa5]/.test(s)) hard.push(`${tag} 不含汉字：${s.slice(0, 30)}`);
  else if (s === en) hard.push(`${tag} 与原句相同`);
});

if (zh.length !== rows.length) {
  hard.unshift(`条数不符：这一段有 ${rows.length} 句，给了 ${zh.length} 条`);
}

if (hard.length) {
  console.error('✗ 这一批不合格，没有写入：');
  hard.slice(0, 12).forEach(x => console.error('   ' + x));
  if (hard.length > 12) console.error(`   ……另外 ${hard.length - 12} 条`);
  process.exit(1);
}

/* 软提示 */
const soft = [];
zh.forEach((t, k) => {
  const en = rows[k].en;
  const s = t.trim();
  const ratio = s.length / Math.max(1, en.length);
  if (ratio < 0.18 || ratio > 1.5) soft.push(`#${start + k} 长度比 ${ratio.toFixed(2)}（${en.slice(0, 40)}）`);
  if (k > 0 && s === zh[k - 1].trim()) soft.push(`#${start + k} 与上一句译文完全相同`);
});
if (soft.length) {
  console.warn(`⚠ ${soft.length} 处可疑（不影响写入）：`);
  soft.slice(0, 6).forEach(x => console.warn('   ' + x));
}

const workFile = path.join(WORK, `${slug}.json`);
const work = fs.existsSync(workFile) ? JSON.parse(fs.readFileSync(workFile, 'utf8')) : {};
zh.forEach((t, k) => { work[start + k] = t.trim(); });

/* 原子写：先写临时文件再改名，中途被打断也不会留半截 JSON */
const tmp = `${workFile}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(work));
fs.renameSync(tmp, workFile);

const n = Object.keys(work).length;
const all = srcAll.length;
console.log(`✓ ${slug} 写入 ${zh.length} 句（第 ${start}–${start + zh.length - 1} 句）`);
console.log(`  进度 ${n} / ${all}（${((n / all) * 100).toFixed(1)}%）`);
