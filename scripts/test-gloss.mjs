// 释义贴合度回归：同一个词往往有"两本账"——
//   stranger 既是 strange 的比较级，也是一张自己的 n. 陌生人；
//   saw 既是 see 的过去式，也是 n. 锯子；born 既是 bear 的过去分词，也是 a. 天生的。
// 这里守住"按上下文挑义项"这条线，防止再弹出 born=熊、tired=轮胎 这种。
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-gloss.mjs');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/lib/sentences.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: TMP,
    define: { 'import.meta.env.BASE_URL': '"/"' },
    logLevel: 'silent',
  });
  return import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);
}

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words;
const D = new Map(dict.map(w => [w.w, w]));
const lemmaMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lemma.json'), 'utf8')).map;

const corpus = {
  articles: [], byLevel: [], dict: D, lemma: new Map(Object.entries(lemmaMap)), detail: {},
  tierOf: w => D.get(w)?.t ?? 0,
  names: new Set(),
};

const { pickZh, glossOf } = await build();

let pass = 0;
const fails = [];
function ok(name, cond, got = '') {
  if (cond) { pass++; return; }
  fails.push(`${name}${got ? `\n     得到: ${got}` : ''}`);
}

/* ---------- 1. pickZh：两本账该翻哪一本 ---------- */
const cases = [
  // [词, 前词, 后词, 后词是名词, 必须包含, 不能包含]
  ['stranger', 'unknown', '', false, ['陌生'], ['奇怪']],
  ['stranger', 'a', 'harpooneer', true, ['陌生'], ['奇怪']],
  ['stranger', 'than', 'me', false, ['陌'], []],
  ['saw', 'I', 'him', false, ['看见'], ['锯子']],
  ['saw', 'a', 'on', false, ['锯'], []],
  ['evening', 'the', 'came', false, ['傍晚'], ['平坦']],
  ['means', 'it', 'nothing', false, ['意谓', '意味', '表示'], ['方法', '低劣']],
  ['means', 'the', 'of', false, ['方法', '手段'], ['低劣']],
  ['born', 'was', 'in', false, ['天生'], ['熊']],
  ['tired', 'was', 'after', false, ['疲', '累'], ['轮胎']],
  ['united', 'was', 'under', false, ['联合'], ['接合']],
  ['unknown', 'an', 'stranger', true, ['不知道', '未知'], []],
];
for (const [word, prev, next, nextNoun, must, mustNot] of cases) {
  const e = D.get(word);
  const key = lemmaMap[word] || word;
  const base = D.get(key);
  if (!base?.z) { fails.push(`${word}: 词库无条目`); continue; }
  const ownZ = key !== word ? e?.z : '';
  const zh = pickZh(base.z, word, prev, false, ownZ, next, nextNoun);
  const hit = must.some(m => zh.includes(m));
  const bad = mustNot.some(m => zh.includes(m));
  ok(`pickZh(${word} | "${prev} _ ${next}") → ${zh}`, hit && !bad, zh);
}

/* ---------- 2. glossOf：整句跑一遍，chips 不能张冠李戴 ---------- */
const SENTS = [
  ['And when it comes to sleeping with an unknown stranger, in a strange inn, in a strange town, and that stranger a harpooneer, then your objections indefinitely multiply.', 'stranger', ['陌生'], ['奇怪']],
  ['The little packet for Nantucket had already sailed.', 'packet', [], []],
];

for (const [sentence, word, must, mustNot] of SENTS) {
  if (!must.length) continue;
  const chips = glossOf(corpus, sentence, {}, 20);
  const c = chips.find(x => x.surface.toLowerCase() === word);
  if (!c) { fails.push(`${word}: 这句没出 chip（可能被档位过滤）`); continue; }
  const hit = must.some(m => c.zh.includes(m));
  const bad = mustNot.some(m => c.zh.includes(m));
  ok(`glossOf ${word} → ${c.zh}`, hit && !bad, c.zh);
}

/* ---------- 3. 全库哨兵：不能把 A 的义项安到 B 头上 ---------- */
const SENTINEL = [
  ['born', '熊'], ['tired', '轮胎'], ['evening', '平坦'], ['means', '低劣'],
  ['stranger', '奇怪'], ['united', '接合'], ['could', '装罐'], ['thought', '想象'],
];
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
let scanned = 0;
const bad = [];
for (const a of arts) {
  const sents = (a.tx.match(/[^.!?]+[.!?]*/g) || []).slice(0, 4);
  for (const s of sents) {
    scanned++;
    for (const c of glossOf(corpus, s, {})) {
      const rule = SENTINEL.find(([w]) => w === c.key.toLowerCase());
      if (rule && c.zh.includes(rule[1])) bad.push(`${a.id}: ${c.surface} → ${c.zh}`);
    }
  }
}
ok(`全库哨兵（扫 ${scanned} 句）${bad.length ? ' 命中 ' + bad.length : ''}`, bad.length === 0, bad.slice(0, 6).join('\n     '));

/* ---------- 4. 抽样看看现在长什么样 ---------- */
const sample = glossOf(corpus, SENTS[0][0], {}, 8);
console.log('\n截图那一句的 chips：');
for (const c of sample) console.log(`   ${c.surface.padEnd(12)} ${c.zh}`);

try { fs.unlinkSync(TMP); } catch {}
console.log(`\n${fails.length ? '✗' : '✓'} 释义测试：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) {
  for (const f of fails) console.log('  ✗ ' + f);
  process.exit(1);
}
