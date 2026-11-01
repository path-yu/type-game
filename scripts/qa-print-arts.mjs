import fs from 'node:fs';
import { splitSentences } from '../src/lib/split.js';
const A = JSON.parse(fs.readFileSync('public/data/articles.json', 'utf8')).items;
const T = JSON.parse(fs.readFileSync('public/data/tr.json', 'utf8')).map;
const from = Number(process.argv[2] || 0);
const to = Number(process.argv[3] || 8);
A.slice(from, to).forEach((a) => {
  const s = splitSentences(a.tx);
  console.log(`\n=== ${a.id} · L${a.lv} · ${a.s} ===`);
  s.forEach((x, i) => {
    console.log(`${i} EN ${x.text.replace(/\s+/g, ' ')}`);
    console.log(`  ZH ${(T[a.id] || [])[i] || '∅'}`);
  });
});
