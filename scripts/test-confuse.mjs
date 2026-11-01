// 易混词：判定要准（别把 apple/orange 判成易混），错开要真的错开。
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-confuse.mjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/confuse.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const C = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

let pass = 0;
const fails = [];
const ok = (name, cond, got = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${got ? `  ${got}` : ''}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${got ? `  ${got}` : ''}`); }
};

/* 1. 编辑距离（Damerau：相邻换位算 1） */
ok('affect → effect 差一个字母', C.editDistance('affect', 'effect') === 1, String(C.editDistance('affect', 'effect')));
ok('quiet → quite 是换位，算 1', C.editDistance('quiet', 'quite') === 1, String(C.editDistance('quiet', 'quite')));
ok('apple / orange 超出阈值', C.editDistance('apple', 'orange', 2) > 2);
ok('同一个词距离 0', C.editDistance('same', 'same') === 0);

/* 2. 该判易混的 */
const yes = [
  ['affect', 'effect'], ['adapt', 'adopt'], ['quiet', 'quite'],
  ['desert', 'dessert'], ['through', 'though'], ['world', 'word'], ['tree', 'three'], ['water', 'waiter'],
];
for (const [a, b] of yes) ok(`${a} / ${b} 判为易混`, C.confusable(a, b));

/* 3. 不该判易混的：短词、无关词、四字母差两个的 */
const no = [['apple', 'orange'], ['have', 'make'], ['cat', 'car'], ['window', 'wonder'], ['affect', 'affect']];
for (const [a, b] of no) ok(`${a} / ${b} 不判易混`, !C.confusable(a, b));

/* 4. 错开：一组全是形近词，也要尽量打散 */
const cluster = ['affect', 'effect', 'affects', 'effected', 'affected', 'affection', 'effective'];
const spread = C.spreadConfusable(cluster, 3);
let clash = 0;
for (let i = 0; i < spread.length; i++)
  for (let j = i + 1; j < spread.length; j++)
    if (C.confusable(spread[i], spread[j])) clash++;
ok('同一批里没有易混对', clash === 0, spread.join(', '));

/* 5. 凑不满要回填，不能返回空 */
const tiny = C.spreadConfusable(['affect', 'effect'], 12);
ok('候选不够时照样给全', tiny.length === 2, `${tiny.length} 个`);

/* 6. 真实词库规模 */
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words;
const words = dict.map(w => w.w).filter(w => w.length >= 4);
const byLen = new Map();
for (const w of words) {
  const k = w.length;
  if (!byLen.has(k)) byLen.set(k, []);
  byLen.get(k).push(w);
}
let pairs = 0;
const samples = [];
for (const [len, list] of byLen) {
  const next = byLen.get(len + 1) || [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (C.confusable(list[i], list[j])) { pairs++; if (samples.length < 6) samples.push(`${list[i]}/${list[j]}`); }
    }
    for (const w of next) {
      if (C.confusable(list[i], w)) { pairs++; if (samples.length < 6) samples.push(`${list[i]}/${w}`); }
    }
  }
}
console.log(`  · 7200 词表里有 ${pairs} 对形近词，例：${samples.join('、')}`);
ok('形近词数量在合理区间', pairs > 500 && pairs < 20000, `${pairs} 对`);
ok('平均每个词不超过 3 个对手', pairs * 2 / words.length < 3.2, `${(pairs * 2 / words.length).toFixed(1)} 个/词`);

/* 7. 夜巡提示：能给出对手 */
const rivals = C.rivalsOf('effect', ['affect', 'apple', 'effort', 'effect']);
ok('rivalsOf 找得到 affect', rivals.length > 0 && rivals.includes('affect'), rivals.join(' / '));
ok('rivalsOf 不返回自己', !rivals.includes('effect'));

try { fs.unlinkSync(TMP); } catch {}
console.log(`\n${fails.length ? '✗' : '✓'} 易混词：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) process.exit(1);
