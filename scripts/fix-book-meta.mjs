/**
 * 修正书内的段号（ord / tot）。
 *
 * 背景：wiki 条目里有一批当初被筛掉了几段，但 ord/tot 还按筛之前的篇数写着 ——
 * 结果 2 篇的条目在书架上显示"1/3""2/3"，读者翻到最后一篇还以为是中间一节。
 * 另外有些单篇条目 ord/tot 是 0，界面会自己降级成"—"，那种不动（1/1 反而是噪音）。
 *
 * 只改 ord 不连续或 tot 不对、且篇数 ≥2 的书；顺序按现有 ord 排，不动内容、不动等级。
 *
 * 用法：node scripts/fix-book-meta.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public/data');
const dry = process.argv.includes('--dry');

const data = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8'));

const by = new Map();
for (const it of data.items) {
  if (!by.has(it.s)) by.set(it.s, []);
  by.get(it.s).push(it);
}

let fixed = 0;
for (const [title, group] of by) {
  if (group.length < 2) continue;
  const want = group.length;
  // 数组里的顺序是入库顺序，不一定等于 ord 顺序（老库按别的键排过），所以先按 ord 排再判断
  const sorted = [...group].sort((a, b) => (a.ord || 999) - (b.ord || 999));
  const okOrd = sorted.every((x, i) => x.ord === i + 1);
  const okTot = group.every(x => x.tot === want);
  if (okOrd && okTot) continue;

  sorted.forEach((x, i) => { x.ord = i + 1; x.tot = want; });
  console.log(`  ${title}  ${group.length} 篇 → ord 1..${want} / tot ${want}`);
  fixed++;
}

console.log(fixed ? `共修正 ${fixed} 本书` : '无需修正');
if (fixed && !dry) {
  fs.writeFileSync(path.join(DATA, 'articles.json'), JSON.stringify(data));
  console.log('  写入 articles.json');
}
