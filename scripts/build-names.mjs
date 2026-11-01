/**
 * 从语料里统计「首字母大写、且不是句子开头」的词形，生成专名表。
 *
 * 判定逻辑：
 *  - 只在句中出现大写（mid）才计数；句首大写不算证据（每句首词都大写）
 *  - 同一词形的全小写形式出现次数记为 lower
 *  - mid >= 3 且 lower <= mid / 3  →  认为是人名地名（Matthew / Munchkin / Thornfield）
 *
 * 输出 public/data/names.json，运行时用来跳过「把 Matthew 当生词，注成马太福音」这类错。
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/data');
const articles = JSON.parse(fs.readFileSync(path.join(OUT, 'articles.json'), 'utf8')).items;

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./gi;
const TOKEN = /[A-Za-z][A-Za-z'-]*/g;

/** 返回每个 token 是否处于句首（用与运行时一致的切句规则） */
function tokenPositions(text) {
  const guarded = text.replace(ABBR, m => m.replace('.', '\u0001'));
  const bounds = [];
  const re = /[.!?]+["'\u201d)\]]?\s+/g;
  let m;
  while ((m = re.exec(guarded))) bounds.push(m.index + m[0].length);

  const out = [];
  TOKEN.lastIndex = 0;
  let t;
  while ((t = TOKEN.exec(text))) {
    const start = t.index;
    // 句首 = 前面没有别的 token，或前一个句界就在这个 token 之前
    const atStart = start === 0 || bounds.some(b => start >= b && start - b < 2);
    out.push({ surface: t[0], atStart });
  }
  return out;
}

const DETERMINER = /^(the|a|an|this|that|these|those|his|her|their|my|your|our|any|some|another|every|each|no|one|two|three)$/i;

const midCaps = new Map();
const lower = new Map();

for (const a of articles) {
  let prev = '';
  for (const { surface, atStart } of tokenPositions(a.tx)) {
    const isCap = /^[A-Z]/.test(surface);
    const isAllCap = /^[A-Z]{2,}$/.test(surface);
    if (isCap && !isAllCap) {
      // 句首大写不算证据；「the Fox」「a Lion」也不算 —— 那是寓言把普通名词当角色名，
      // 恰恰是学习者最该看到的词，不能当专名滤掉。
      if (!atStart && !DETERMINER.test(prev)) {
        midCaps.set(surface, (midCaps.get(surface) ?? 0) + 1);
      }
    } else if (/^[a-z]/.test(surface)) {
      lower.set(surface, (lower.get(surface) ?? 0) + 1);
    }
    prev = surface;
  }
}

const names = [];
for (const [w, mid] of midCaps) {
  if (mid < 3) continue;
  const low = lower.get(w.toLowerCase()) ?? 0;
  if (low > mid / 3) continue;            // 小写形式也常见 → 是普通词
  names.push(w);
}
names.sort();

fs.writeFileSync(path.join(OUT, 'names.json'), JSON.stringify({ v: 1, names }));
const kb = (fs.statSync(path.join(OUT, 'names.json')).size / 1024).toFixed(1);
console.log(`✅ names.json  ${names.length} 个专名  ${kb}KB`);
console.log('样例:', names.slice(0, 12).join(', '));
console.log('检查:', ['Matthew', 'Alice', 'Munchkin', 'Lorry', 'Sherlock'].map(w => `${w}=${names.includes(w)}`).join(' '));
