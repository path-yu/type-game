// 打印某本书待译的句子：node scripts/dump-book.mjs "Black Beauty"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const title = process.argv[2];
const rows = arts.filter(a => a.s === title);
if (!rows.length) { console.error('没有这本书:', title); process.exit(1); }
let total = 0;
for (const a of rows) {
  const sents = splitSentences(a.tx).map(x => x.text);
  total += sents.length;
  console.log(`\n@@ ${a.id}  L${a.lv}  ${sents.length}句`);
  sents.forEach((s, i) => console.log(`${i + 1}. ${s}`));
}
console.log(`\n== ${rows.length} 篇 / ${total} 句`);
