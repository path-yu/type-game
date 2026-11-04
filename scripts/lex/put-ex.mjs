/**
 * 把手写的补充例句并进 examples.json。
 *
 * 硬规则（一条不合格，整条拒收）：
 *   - 词必须在词表里，且当前没有语料例句（有语料例句的词轮不到自撰例句）
 *   - 1-3 句例句，英文句子里必须真的出现这个词（含屈折变化）
 *   - 每句都要有中文，英文里不许混中文
 *   - 至少有一句中文简释或一段解析
 *
 * 为什么要查"英文里有没有这个词"：例句写得太顺，很容易写着写着
 * 就换成了同义词（给 adhere 写一句关于 stick 的话），读起来没问题，
 * 但作为这个词的例句就是错的。
 *
 * 用法：node scripts/lex/put-ex.mjs data/lex-zh/in/ex-40.json [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const OUT = path.join(ROOT, 'data/lex-zh/examples.json');

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) { console.error('用法: node scripts/lex/put-ex.mjs <batch.json> [--dry]'); process.exit(1); }

const incoming = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));
const cur = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

const shards = new Map();
const shardOf = ch => {
  if (!shards.has(ch)) shards.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return shards.get(ch);
};

/*
 * 屈折比对。词表里的词和句子里的形不一定长得一样：
 *   allow → allowed / allowing    drape → draping（去 e）
 *   ferry → ferried（y→i）        instil → instils（l 归一）
 *   override → overrode（不规则）
 * 所以拿原词、去尾 e/y 的干、l 归一的干各跑一遍「允许后缀」的正则；
 * 长词再兜一层「前五字符 + 至多四字母」，专给不规则变化留口子。
 * 用词边界锚定，con 不会匹配到 concern。
 */
const hit = (word, en) => {
  const s = en.toLowerCase();
  const base = word.toLowerCase();
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const forms = w =>
    new RegExp(
      `\\b${esc(w)}(s|es|ed|d|ing|er|est|ly|ies|ied|y|ise|ised|ising|isation|ize|ized|izing|ization)?\\b`,
    );
  const stems = new Set([base, base.replace(/(e|y)$/, ''), base.replace(/l{1,2}$/, 'l')]);
  // 双写末辅音：con→conned、gag→gagged、pedal→pedalled、remit→remitted
  for (const st of [...stems]) stems.add(st.replace(/([bdglmnprtz])$/, '$1$1'));
  if ([...stems].some(st => st.length >= 2 && forms(st).test(s))) return true;
  return base.length >= 6 && new RegExp(`\\b${esc(base.slice(0, 5))}[a-z]{0,4}\\b`).test(s);
};

const ok = {};
const bad = [];
for (const [w, v] of Object.entries(incoming)) {
  const why = [];
  if (!shardOf(w[0])[w]) why.push('词表里没有');
  if (shardOf(w[0])[w]?.ex?.length) why.push('已有语料例句');
  if (!v || !Array.isArray(v.ex) || !v.ex.length) why.push('没有例句');
  else if (v.ex.length > 3) why.push(`例句 ${v.ex.length} 条，最多 3 条`);
  for (const e of v.ex ?? []) {
    if (!e.en || !e.zh) why.push('例句缺 en 或 zh');
    else {
      if (!hit(w, e.en)) why.push(`例句里没有「${w}」：${e.en.slice(0, 40)}`);
      if (/[\u4e00-\u9fa5]/.test(e.en)) why.push('英文句里混了中文');
      if (!/[\u4e00-\u9fa5]/.test(e.zh)) why.push('中文译文里没有中文');
    }
  }
  if (!v?.zh && !v?.note) why.push('既没有简释也没有解析');
  if (v?.note && v.note.length > 160) why.push(`解析 ${v.note.length} 字，太长了（≤160）`);
  if (why.length) bad.push([w, why]);
  else ok[w] = v;
}

if (bad.length) {
  console.error(`✗ ${bad.length} 条不合格：`);
  for (const [w, why] of bad) console.error(`  ${w}: ${why.join('；')}`);
}
if (!Object.keys(ok).length) {
  console.error('没有可入库的条目');
  process.exit(1);
}

const next = { ...cur, ...ok };
const sorted = Object.fromEntries(Object.keys(next).sort().map(k => [k, next[k]]));
if (!dry) fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');

console.log(`${dry ? '[dry] ' : ''}✓ 收下 ${Object.keys(ok).length} 词 · examples.json 共 ${Object.keys(sorted).length} 词`);
