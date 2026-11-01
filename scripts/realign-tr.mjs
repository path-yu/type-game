/**
 * 切句规则从「区分大小写」改成「不分大小写」之后，
 * 少数文章（`MRS. Rachel Lynde lived...` 这类）的句数会少 1，
 * 已存译文数组就会错位。这个脚本把它们合并回去。
 *
 * 只处理「旧切法里那个碎片是纯大写缩写 + 句点」的情况，其余一律报错不动。
 */
import fs from 'node:fs';

const ABBR_OLD = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./g;
const ABBR_NEW = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./gi;

function split(text, abbr) {
  const guarded = text.replace(abbr, m => m.replace('.', '\u0001'));
  const out = [];
  const re = /[.!?]+["'\u201d)\]]?\s+/g;
  let start = 0, m;
  while ((m = re.exec(guarded))) {
    const end = m.index + m[0].length;
    if (end > start) out.push(text.slice(start, end).trim());
    start = end;
  }
  if (start < text.length) {
    const t = text.slice(start).trim();
    if (t) out.push(t);
  }
  return out;
}

const articles = JSON.parse(fs.readFileSync('public/data/articles.json', 'utf8')).items;
const trPath = 'public/data/tr.json';
const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));

let fixed = 0, skipped = 0;
for (const a of articles) {
  const oldS = split(a.tx, ABBR_OLD);
  const newS = split(a.tx, ABBR_NEW);
  const cur = tr.map[a.id];
  if (!cur) continue;
  if (cur.length === newS.length) continue;                 // 已经对上了

  if (cur.length !== oldS.length) {
    console.log(`⚠ ${a.id} 译文 ${cur.length} 句 / 旧 ${oldS.length} 句 / 新 ${newS.length} 句 —— 无法自动判定，跳过`);
    skipped++;
    continue;
  }

  // 旧数组里找纯大写缩写碎片，把它与下一句合并
  const merged = [];
  for (let i = 0; i < cur.length; i++) {
    // 碎片有两种：整句就是一个缩写（MRS.），或句子末尾停在缩写上（MY DEAR MR.）
    const endsWithAbbr = /(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\.$/i.test(oldS[i]);
    if (endsWithAbbr && i + 1 < cur.length) {
      merged.push((cur[i] ?? '') + (cur[i + 1] ?? ''));     // 中文直接拼接，不加空格
      i++;
    } else {
      merged.push(cur[i]);
    }
  }

  if (merged.length !== newS.length) {
    console.log(`⚠ ${a.id} 合并后 ${merged.length} 句 ≠ 新切法 ${newS.length} 句 —— 跳过`);
    skipped++;
    continue;
  }
  tr.map[a.id] = merged;
  fixed++;
  console.log(`✅ ${a.id}  ${cur.length} → ${merged.length} 句  「${merged.find(x => x.includes('雷切尔') || x.length > 20)?.slice(0, 28) ?? ''}…」`);
}

fs.writeFileSync(trPath, JSON.stringify(tr));
console.log(`\n修复 ${fixed} 篇，跳过 ${skipped} 篇，共 ${Object.keys(tr.map).length} 篇`);
