// 推荐顺序回归：同一本书要能顺着读，而不是每次随机跳到半本书之外。
// 之前 build-data 在每个难度层内洗了牌，id 和原文顺序彻底脱钩，
// recommend() 又加了一层 Math.random —— 连着三篇 Alice 可能隔着全书。
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-rec.mjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/data.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent',
});
const { recommend } = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const dict = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words.map(w => [w.w, w]));
const lemma = new Map(Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lemma.json'), 'utf8')).map));

const byLevel = Array.from({ length: 8 }, () => []);
for (const it of items) byLevel[it.lv]?.push(it);
const corpus = { articles: items, byLevel, dict, lemma, detail: {}, tierOf: w => dict.get(w)?.t ?? 0, names: new Set() };

// 造一份"打到一半"的掌握度：高频词熟了，生僻词还没有。
// 全空的话每篇生词率都是 0.5，打分失去区分度，测不出顺序问题。
const mastery = {};
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (const [w, e] of dict) {
  if (e.t <= 2 || rnd() < 0.35) mastery[w] = { m: 80 };
}

let pass = 0;
const fails = [];
const ok = (name, cond, got = '') => cond ? pass++ : fails.push(`${name}${got ? ` → ${got}` : ''}`);

/* 1. 确定性：没有随机噪音，同样输入必须给同样结果 */
const first = recommend(corpus, mastery, 1, []);
const again = recommend(corpus, mastery, 1, []);
ok('同一输入两次结果一致', first.id === again.id, `${first.id} vs ${again.id}`);

/* 2. 续读：读过第 51 段，就该给同一本书后面的段，而不是随便一本 */
const last = items.find(a => a.id === 'moby-0087');
const nextOne = recommend(corpus, mastery, last.lv, [last.id]);
ok('续读留在同一本书', nextOne.s === last.s, `${nextOne.s} · ${nextOne.id}`);
ok('续读的段号在后面', (nextOne.ord ?? 0) > (last.ord ?? 0), `ord ${nextOne.ord} vs ${last.ord}`);

/* 3. 不应把刚打过的再推一次 */
ok('不重复推荐刚打完的', nextOne.id !== last.id, nextOne.id);

/* 4. 连着读完同难度里的这本书，不会回退到前面的段 */
let cur = last, back = 0, seen = new Set([last.id]);
for (let i = 0; i < 3; i++) {
  const n = recommend(corpus, mastery, last.lv, [cur.id, ...seen]);
  if (n.s !== last.s) break;
  if ((n.ord ?? 0) <= (cur.ord ?? 0)) back++;
  cur = n; seen.add(n.id);
}
ok('连读三段段号只增不减', back === 0, `回退 ${back} 次`);

/* 5. 每级都得能出结果，不能因为排序改动返回 undefined */
let empty = 0;
for (let lv = 1; lv <= 7; lv++) if (!recommend(corpus, mastery, lv, [])?.id) empty++;
ok('七个难度都有推荐结果', empty === 0, `${empty} 个空`);

try { fs.unlinkSync(TMP); } catch {}
console.log(`${fails.length ? '✗' : '✓'} 推荐顺序：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) { for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
