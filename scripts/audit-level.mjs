/**
 * 场景等级体检。
 *
 * 这个脚本的第一版是想「用词频校准 lv」，跑完发现结论相反，值得记下来：
 *
 *   标注等级 vs 词汇难度   相关系数 r = 0.04
 *   标注等级 vs 平均句长   r = 0.38
 *
 * 也就是说，当初标 lv 时看的是**场合有多难**（签证面谈比点咖啡难），
 * 落到文字上唯一的痕迹是句子变长了一点；词汇层面 1097 场几乎全在同一档
 * （内容词平均档位 1.9–2.2，各级超纲率中位数都 2–3%）。
 * 所以这里**不按词频重排等级** —— 那会把「课堂演讲被打断」判成 L1，
 * 而它难在要临场解释数据来源，不是词难。
 *
 * 脚本改成守两件确实可以判定的事：
 *   1. 等级分布 —— 某一级被写空了（L7 允许空，对话用不到 C1），或者 L1 太少
 *   2. 词汇画像 —— 某一级的超纲率中位数突然变高，说明那批语料写难了
 *
 * 用法：node scripts/audit-level.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLexicon } from './lib/words.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEX = loadLexicon(ROOT);
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));

const rows = bank.scenes.map(s => {
  const tiers = [];
  let hard = 0;
  let words = 0;
  for (const line of s.lines) {
    for (const t of LEX.tokensOf(line.en)) {
      words++;
      if (LEX.isHard(t)) hard++;
      else tiers.push(t.tier || 1);
    }
  }
  return {
    id: s.id, lv: s.lv,
    mean: tiers.length ? tiers.reduce((a, b) => a + b, 0) / tiers.length : 0,
    hardRate: hard / Math.max(1, words),
    wpl: words / Math.max(1, s.lines.length),
  };
});

const med = a => {
  const b = [...a].sort((x, y) => x - y);
  return b.length ? b[Math.floor(b.length / 2)] : 0;
};
const corr = (xs, ys) => {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sx = 0, sy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sx += dx * dx; sy += dy * dy; sxy += dx * dy;
  }
  return sxy / Math.sqrt(sx * sy);
};

const byLv = new Map();
for (const r of rows) {
  const g = byLv.get(r.lv) ?? { n: 0, mean: [], hard: [], wpl: [] };
  g.n++; g.mean.push(r.mean); g.hard.push(r.hardRate); g.wpl.push(r.wpl);
  byLv.set(r.lv, g);
}

console.log(`场景 ${rows.length} 场 · 词库 ${LEX.size} 词`);
console.log('\n等级  场次   词频档位(中位)  超纲率(中位)  句长(中位)');
const lvs = [...byLv.keys()].sort((a, b) => a - b);
for (const lv of lvs) {
  const g = byLv.get(lv);
  console.log(
    `  L${lv}  ${String(g.n).padStart(4)}       ${med(g.mean).toFixed(2)}        `
    + `${(med(g.hard) * 100).toFixed(1).padStart(4)}%        ${med(g.wpl).toFixed(1)}`,
  );
}

const r = corr(rows.map(x => x.lv), rows.map(x => x.mean));
const rw = corr(rows.map(x => x.lv), rows.map(x => x.wpl));
console.log(`\n等级 vs 词汇难度 r=${r.toFixed(2)} · 等级 vs 句长 r=${rw.toFixed(2)}`);
console.log('等级表达的是场合难度，不是词汇难度 —— 这个词频训不出来，也不该用它重排。');

/* ---------------- 阈值 ---------------- */
const problems = [];

// 对话是口语场景，C1（L7）本来就少，允许空
for (const lv of [1, 2, 3, 4, 5, 6]) {
  const n = byLv.get(lv)?.n ?? 0;
  if (n < 10) problems.push(`L${lv} 只有 ${n} 场（下限 10）`);
}
// 入门级是新手的第一屏，太少的话 A1 学习者很快就没得练
if ((byLv.get(1)?.n ?? 0) < 20) problems.push(`L1 只有 ${byLv.get(1)?.n ?? 0} 场（下限 20）`);

for (const [lv, g] of byLv) {
  const m = med(g.hard);
  if (m > 0.1) problems.push(`L${lv} 超纲率中位数 ${(m * 100).toFixed(0)}%（上限 10%）`);
}

console.log('');
if (problems.length) {
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exitCode = 1;
} else {
  console.log('  ✓ 等级分布与词汇画像都在范围内');
}
