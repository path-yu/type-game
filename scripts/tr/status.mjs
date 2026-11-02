/**
 * 全书翻译的进度表 + 缺口清单。
 *
 * 用法：
 *   node scripts/tr/status.mjs           按书列出进度，缺的书标出来
 *   node scripts/tr/status.mjs --gaps    列出每本还缺哪些句段（压缩成区间）
 *   node scripts/tr/status.mjs --strict  有书没翻完就以退出码 1 结束（给 CI 用）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const WORK = path.join(ROOT, 'data/tr-work');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr-meta.json'), 'utf8'));

const gaps = process.argv.includes('--gaps');
const strict = process.argv.includes('--strict');

/** [0,1,2,5,6,9] → "0–2, 5–6, 9" */
const ranges = nums => {
  const out = [];
  let i = 0;
  while (i < nums.length) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(i === j ? `${nums[i]}` : `${nums[i]}–${nums[j]}`);
    i = j + 1;
  }
  return out.join(', ');
};

let totAll = 0, doneAll = 0;
const incomplete = [];

for (const [slug, m] of Object.entries(meta).sort((a, b) => b[1].n - a[1].n)) {
  const f = path.join(WORK, `${slug}.json`);
  const work = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  const done = Object.keys(work).length;
  totAll += m.n; doneAll += done;
  const pct = (done / m.n) * 100;
  const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '·');
  console.log(`${m.title.padEnd(30)} ${bar} ${String(done).padStart(5)}/${String(m.n).padEnd(5)} ${pct.toFixed(1).padStart(5)}%`);
  if (done < m.n) {
    incomplete.push(slug);
    if (gaps) {
      const miss = [];
      for (let i = 0; i < m.n; i++) if (work[i] == null) miss.push(i);
      console.log(`   缺：${ranges(miss)}`);
    }
  }
}

console.log(`\n合计 ${doneAll.toLocaleString()} / ${totAll.toLocaleString()} 句 · ${((doneAll / totAll) * 100).toFixed(1)}% · 未完成 ${incomplete.length} 本`);
if (strict && incomplete.length) process.exit(1);
