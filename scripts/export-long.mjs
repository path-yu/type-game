// 按句长导出待重译句子：node scripts/export-long.mjs --min 60 --from 0 --to 30
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;
const wc = s => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? +process.argv[i + 1] : d;
};
const min = arg('--min', 60);
const max = arg('--max', 999);
const from = arg('--from', 0);
const to = arg('--to', 30);

const rows = [];
for (const a of arts) {
  const en = splitSentences(a.tx).map(x => x.text);
  en.forEach((s, i) => { if (wc(s) >= min && wc(s) <= max) rows.push({ id: a.id, i, s, n: wc(s), book: a.s }); });
}
rows.sort((x, y) => y.n - x.n);

const slice = rows.slice(from, to);
for (const r of slice) {
  console.log(`\n## ${r.id}#${r.i} · ${r.book} · ${r.n} 词`);
  console.log('EN ' + r.s);
  console.log('旧 ' + (tr[r.id]?.[r.i] ?? '（无）'));
}
console.log(`\n区间 ${from}-${to} / 共 ${rows.length} 句（≥${min} 词）`);
