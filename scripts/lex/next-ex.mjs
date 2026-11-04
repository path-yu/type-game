/**
 * 挑出「语料里没出现、也还没补例句」的词，供下一批手写。
 *
 * 3.5 万里有 8 千多个是拿 WordNet 词表补足的。这些词怎么排优先级，
 * 试过三种信号，最后落到第三种才是对的：
 *
 *   1. 字母序        —— a 段翻下来发现，通用词基本都有语料例句，
 *                       剩下的是民族、语言、生物名，写了没人查。
 *   2. 义项数        —— 义项多是常用的代理，但 alto / bunt / congee 这种
 *                       多义术语词条会顶到最前面。
 *   3. 对话语料频次  —— 1157 场现代场景对话（email / refund / invoice /
 *                       debit / deferral），是唯一能反映"现代常用"的语料。
 *                       空缺词里有一百多个在对话里出现过，优先补这些。
 *
 * 输出会附上该词在对话里的原句，写例句时照着语境走，不容易写偏。
 *
 * 用法：node scripts/lex/next-ex.mjs [--n=40] [--from=a] [--modern] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const EX = path.join(ROOT, 'data/lex-zh/examples.json');
const DLG = path.join(ROOT, 'public/data/dialogues.json');

const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? 40);
const from = process.argv.find(a => a.startsWith('--from='))?.slice(7) ?? '';
const onlyModern = process.argv.includes('--modern');
const asJson = process.argv.includes('--json');

const idx = JSON.parse(fs.readFileSync(path.join(LEX, 'index.json'), 'utf8'));
const done = fs.existsSync(EX) ? JSON.parse(fs.readFileSync(EX, 'utf8')) : {};

/* 专名和术语的味儿：gloss 里几乎全是这种句式 */
const PROPER = /\b(a city|a town|a village|a state|a county|a river|a mountain|a lake|an island|a country|a port|a capital|a district|a province|a region|United States|genus|family|inhabitant|member of)\b/i;

/* 义项前面挂专业标签的，多半是术语：(law)、(geology)、(baseball)、(music) */
const DOMAIN = /\((law|geology|biology|botany|zoology|chemistry|physics|music|baseball|cricket|medicine|anatomy|architecture|nautical|military|heraldry|printing|typography|grammar|linguistics|computing|mathematics|finance|accounting|sports|hunting|fishing|agriculture|obsolete|archaic)\)/i;

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

const pending = idx.rows
  .filter(([w, f, , hasEx]) => f === 0 && hasEx === 0 && !done[w] && (!from || w.startsWith(from)))
  .map(([w, , pos]) => [w, pos.length, pos]);

/* 对话语料里的出现次数与用例 —— 现代常用度的唯一可信信号 */
const modern = new Map();
const samples = new Map();
if (fs.existsSync(DLG)) {
  const dlg = JSON.parse(fs.readFileSync(DLG, 'utf8'));
  const pendingSet = new Set(pending.map(p => p[0]));
  for (const sc of dlg.scenes ?? []) {
    for (const line of sc.lines ?? []) {
      for (const m of (line.en ?? '').toLowerCase().matchAll(/[a-z][a-z'-]*/g)) {
        const w = m[0];
        if (!pendingSet.has(w)) continue;
        modern.set(w, (modern.get(w) ?? 0) + 1);
        if (samples.has(w)) continue;
        if ((line.en ?? '').length > 140) continue;
        samples.set(w, { en: line.en, zh: line.zh ?? '', scene: sc.name ?? '' });
      }
    }
  }
}

/*
 * 英式 -ise 变体：词表里既然有 capitalise 也有 capitalize，两条都写就是白写一遍。
 * 有 -ize 主条的，-ise 一律跳过（organise / harmonise / immobilise 都是这种情况）。
 */
const allWords = new Set(idx.rows.map(r => r[0]));
const isBritishVariant = w =>
  /(ise|isation|ised|ising)$/.test(w) && allWords.has(w.replace(/ise/, 'ize').replace(/isation/, 'ization'));

const picked = [];
for (const [w, score, pos] of pending.sort(
  (a, b) =>
    (modern.get(b[0]) ?? 0) - (modern.get(a[0]) ?? 0) ||
    b[1] - a[1] ||
    a[0].localeCompare(b[0]),
)) {
  if (picked.length >= n) break;
  if (w.length <= 2) continue;
  if (onlyModern && !modern.has(w)) continue;
  const e = shardOf(w[0])[w];
  if (!e) continue;
  const glosses = (e.senses || []).map(s => s.d || '');
  // 专名：只要多数义项是「a city in …」这类句子就算，charles 这种半人半地名的也能拦住
  if (glosses.length && glosses.filter(g => PROPER.test(g)).length * 2 >= glosses.length) continue;
  if (glosses.length && glosses.filter(g => DOMAIN.test(g)).length * 2 >= glosses.length) continue;
  if (isBritishVariant(w)) continue;
  if (w.length > 10 || w.includes(' ') || w.includes('-')) continue;
  /*
   * 只收有动词或形容词义项的。纯名词那批基本都是术语和物件名
   * （anteater / bunt / congee / alto），义项再多也不值得编例句。
   * 但对话语料里出现过的纯名词是例外——那是 refund、invoice、payroll
   * 这种现代生活词，恰恰是公版书语料覆盖不到、最该补的一层。
   */
  if (!/[va]/.test(pos) && !modern.has(w)) continue;
  picked.push({
    w,
    modern: modern.get(w) ?? 0,
    senses: (e.senses || []).map(s => `${s.p} ${s.d}`),
    ...(samples.get(w) ? { sample: samples.get(w) } : {}),
  });
}

if (asJson) {
  console.log(JSON.stringify(picked, null, 1));
} else {
  const total = idx.rows.filter(([w, f, , hasEx]) => f === 0 && hasEx === 0 && !done[w]).length;
  console.log(`还差 ${total} 个词没有例句${from ? `（${from} 段）` : ''}，本批 ${picked.length} 个：\n`);
  for (const p of picked) {
    console.log(`${p.w}  [${p.senses.length}]${p.modern ? `  对话 ${p.modern} 次` : ''}`);
    for (const s of p.senses.slice(0, 4)) console.log(`    ${s.slice(0, 110)}`);
    if (p.sample) console.log(`    ▸ ${p.sample.en}\n      ${p.sample.zh}`);
  }
}
