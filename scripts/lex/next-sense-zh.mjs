/**
 * 挑出「义项还有英文」的词，供补中文释义。
 *
 * 两个阶段都用它：
 *   1. 699 个词表补全词（已全部译完）
 *   2. 语料词里义项没译全的 —— f≥20 的还有 1,300 多个，占词次不到 7%
 *      但都是读者真会点开的词，补完逐义项覆盖能到 99%
 *
 * 排序按语料频次降序，其次按「缺几条」升序：只缺一条的（mother 这类）
 * 先做，性价比最高。
 *
 * 输出会标 [已] / [空]：[已] 的那条附上现有中文，写批次时照抄即可 ——
 * put-gloss 要求条数等于义项数，整条重写才不会错位。
 *
 * 用法：node scripts/lex/next-sense-zh.mjs [--n=40] [--min-f=20] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');

const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? 40);
const minF = Number(process.argv.find(a => a.startsWith('--min-f='))?.slice(8) ?? 20);
const asJson = process.argv.includes('--json');

const idx = JSON.parse(fs.readFileSync(path.join(LEX, 'index.json'), 'utf8'));
const freq = new Map(idx.rows.map(([w, f]) => [w, f]));

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

const rows = [];
let noFreq = 0;
for (const [w, f] of idx.rows) {
  const e = shardOf(w[0])?.[w];
  if (!e?.senses?.length) continue;
  const miss = e.senses.filter(s => !s.zh).length;
  if (!miss) continue;
  if (f < minF) { noFreq++; continue; }
  rows.push([w, f, miss, e.senses.length]);
}
rows.sort((a, b) => b[1] - a[1] || a[2] - b[2] || a[0].localeCompare(b[0]));

const picked = rows.slice(0, n).map(([w, f, miss, total]) => {
  const e = shardOf(w[0])[w];
  return {
    w,
    f,
    miss,
    senses: e.senses.map(s => ({
      p: s.p,
      d: s.d,
      ...(s.zh ? { zh: s.zh } : {}),
    })),
    total,
  };
});

if (asJson) {
  console.log(JSON.stringify(picked, null, 1));
} else {
  console.log(`f≥${minF} 的词里还有 ${rows.length} 个义项没译全（本批 ${picked.length} 个）`);
  if (noFreq) console.log(`  另有 ${noFreq} 个 f<${minF} 的低频词未计入，用 --min-f=1 可以看`);
  console.log('');
  for (const p of picked) {
    console.log(`${p.w}  [${p.total}]  语料 ${p.f} · 缺 ${p.miss}`);
    p.senses.forEach((s, i) => {
      const tag = s.zh ? '[已]' : '[空]';
      console.log(`  ${i + 1}. ${tag} ${s.p}  ${s.zh ? s.zh + '   ⟵  ' : ''}${s.d.slice(0, 110)}`);
    });
  }
}
