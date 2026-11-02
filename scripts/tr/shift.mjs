/**
 * 把一本书的已译内容整体平移，然后由人补上挪出来的那几句。
 *
 * 为什么需要它：`build.mjs` 判正文起点的规则是"第一段 ≥200 字符"，对对话体小说会判错
 * —— 小妇人开头四句短对白全被跳过，全书最有名的开场白没了；双城记、安妮也各丢了
 * 书名与第一章标题。修法是给 build.mjs 的 START_AT 钉住段落下标，重建底稿。
 *
 * 但重建会让后面所有编号前移。这时**不要去重译**：新底稿一定等于
 * 「新几句 + 旧底稿」，所以只要把 tr-work 的键整体加 K，旧译文一条都不用动。
 *
 * 这个脚本做三件事：
 *   1. 用旧底稿的首句在新底稿里定位，算出偏移 K
 *   2. 校验平移后每一条都对得上（逐句比对，不是抽查）
 *   3. 写回 tr-work，前 K 条留空，等 put.mjs 或人补
 *
 * 用法：
 *   node scripts/tr/shift.mjs <slug> --from=<旧底稿副本> [--dry]
 *
 * 旧底稿副本要在重建**之前**留好：
 *   cp data/tr-src/<slug>.jsonl /tmp/old.jsonl
 *   node scripts/tr/build.mjs --only=<slug>
 *   node scripts/tr/shift.mjs <slug> --from=/tmp/old.jsonl
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const WORK = path.join(ROOT, 'data/tr-work');

const slug = process.argv[2];
const fromArg = process.argv.find(a => a.startsWith('--from='));
const dry = process.argv.includes('--dry');

if (!slug || !fromArg) {
  console.error('用法：node scripts/tr/shift.mjs <slug> --from=<旧底稿.jsonl> [--dry]');
  process.exit(1);
}

const readSrc = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).en);

const oldSrc = readSrc(fromArg.slice(7));
const newSrc = readSrc(path.join(SRC, `${slug}.jsonl`));

// 用旧底稿首句定位。首句必须在新底稿里出现，否则说明不是"前面多了几句"这种情形。
const anchor = oldSrc[0].slice(0, 60);
const k = newSrc.findIndex(e => e.startsWith(anchor));
if (k < 0) {
  console.error(`✗ ${slug}：旧底稿首句在新底稿里找不到 —— 这不是平移能解决的，先人工看过`);
  process.exit(1);
}
if (newSrc.length - k !== oldSrc.length) {
  console.error(`✗ ${slug}：平移后长度对不上（新 ${newSrc.length} − ${k} ≠ 旧 ${oldSrc.length}），中止`);
  process.exit(1);
}

// 逐句比对，不是抽查 —— 错一条就会让整本书的译文和英文错位，而界面上看不出来
let bad = 0;
for (let i = 0; i < oldSrc.length; i++) {
  if (newSrc[i + k] !== oldSrc[i]) { bad++; if (bad <= 3) console.error(`  ✗ ${i} → ${i + k} 不一致`); }
}
if (bad) {
  console.error(`✗ ${slug}：${bad} 条对不上，中止（没有写任何文件）`);
  process.exit(1);
}

const wf = path.join(WORK, `${slug}.json`);
const work = JSON.parse(fs.readFileSync(wf, 'utf8'));
const out = {};
for (const [key, zh] of Object.entries(work)) out[Number(key) + k] = zh;

console.log(`✓ ${slug}：偏移 +${k}，已译 ${Object.keys(work).length} 条全部对得上`);
console.log(`  第 0–${k - 1} 句待译：`);
for (let i = 0; i < k; i++) console.log(`   ${i} | ${newSrc[i].replace(/\n/g, ' ').slice(0, 70)}`);

if (dry) {
  console.log('（--dry，没有写文件）');
} else {
  fs.writeFileSync(wf, JSON.stringify(out));
  console.log(`✓ 已写回 ${wf}`);
}
