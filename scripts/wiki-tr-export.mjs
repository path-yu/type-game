// 导出待译句子：node scripts/wiki-tr-export.mjs wiki-4483-0 wiki-4483-1 ...
// 输出「id | 序号 | 英文」，方便逐句翻完写回 data/tr-inbox/wiki-*.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const ids = process.argv.slice(2);
let total = 0;

for (const id of ids) {
  const a = items.find(x => x.id === id);
  if (!a) { console.log(`✗ ${id} 不存在`); continue; }
  const sents = splitSentences(a.tx).map(s => s.text);
  total += sents.length;
  console.log(`\n## ${id} · ${a.s} · ${sents.length} 句`);
  sents.forEach((s, i) => console.log(`${i + 1}| ${s}`));
}
console.log(`\n合计 ${total} 句`);
