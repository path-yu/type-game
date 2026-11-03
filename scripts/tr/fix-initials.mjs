/**
 * 修「Doctor T. J. Eckleburg」这类缩写被切句器拆碎的问题。
 *
 * 切句器把句点一律当断句符，`Doctor T. J. Eckleburg` 里的缩写点也算，
 * 于是一句话被切成 `…Doctor T.` / `J.` / `Eckleburg.` 三条，读者看到的是一行
 * "J（缩写）。" —— 这是能一眼看出来的排版事故。
 *
 * 规则：当某一条**整条就是一个大写字母加句点**时，把它连前后两条并成一条。
 * 只改指定这本书的底稿与译文，不碰全局切句器 —— 那会改变 1419 篇选段和
 * 21 本书的句索引，所有译文一起错位。
 *
 * 用法：node scripts/tr/fix-initials.mjs <slug>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const slug = process.argv[2];
if (!slug) { console.error('用法: node scripts/tr/fix-initials.mjs <slug>'); process.exit(1); }

const srcPath = path.join(ROOT, `data/tr-src/${slug}.jsonl`);
const workPath = path.join(ROOT, `data/tr-work/${slug}.json`);
const src = fs.readFileSync(srcPath, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const work = JSON.parse(fs.readFileSync(workPath, 'utf8'));

const isFrag = s => /^[A-Z]\.$/.test(String(s).trim());

const groups = [];
for (let i = 0; i < src.length;) {
  // 下一条是缩写碎片，就把 i / i+1 / i+2 并成一条
  if (i + 2 < src.length && isFrag(src[i + 1].en)) {
    groups.push([i, i + 1, i + 2]);
    i += 3;
  } else {
    groups.push([i]);
    i += 1;
  }
}

const merged = groups.filter(g => g.length > 1);
if (!merged.length) { console.log('没有需要合并的缩写碎片'); process.exit(0); }

const next = groups.map((g, idx) => ({
  i: idx,
  en: g.map(k => src[k].en).join(' ').replace(/\s+/g, ' '),
}));

/*
 * 译文：合并后的那句把三条旧译文接起来，但"J（缩写）。"这类占位要去掉，
 * 由人工再润一遍（脚本会把位置打出来）。
 */
const newWork = {};
groups.forEach((g, idx) => {
  newWork[idx] = g.map(k => work[k] ?? '').filter(z => z && !/（缩写）/.test(z)).join('');
});

fs.writeFileSync(srcPath, next.map(x => JSON.stringify(x)).join('\n') + '\n');
fs.writeFileSync(workPath, JSON.stringify(newWork));

console.log(`${src.length} → ${next.length} 句（合并 ${merged.length} 处）`);
merged.forEach(g => {
  const idx = groups.indexOf(g);
  console.log(`\n新 #${idx}（旧 ${g[0]}~${g[g.length - 1]}）`);
  console.log('  EN:', next[idx].en.slice(0, 90));
  console.log('  ZH:', newWork[idx]);
});
console.log('\n注意：后面所有句号都往前挪了，翻译进度按新编号重新对一次。');
