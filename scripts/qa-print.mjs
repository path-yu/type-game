import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync('data/qa/sample.json', 'utf8'));
const from = Number(process.argv[2] || 0);
const to = Number(process.argv[3] || s.length);
s.slice(from, to).forEach((x, k) => {
  console.log(`${from + k + 1}. ${x.id}#${x.i} L${x.lv}`);
  console.log(`   E ${x.en.replace(/\s+/g, ' ').slice(0, 110)}`);
  console.log(`   Z ${x.zh}`);
});
