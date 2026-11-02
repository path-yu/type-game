/**
 * 场景对话语料体检。
 *
 * 一千场之后，靠眼睛已经看不出问题了 —— 需要机器回答几个具体问题：
 * 1. 有没有整句在多场重复（同一个骨架的变体之间共用是设计，跨骨架重复才是抄）
 * 2. 难度标注和实际句子长度是否匹配（标 A1 却写三十个词，就是标签失真）
 * 3. 岔路类型是否还覆盖五种意外
 * 4. 每场的「你的台词」数量是否够练
 *
 * 只读，不改数据。问题清单给人工判断。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));
const scenes = bank.scenes;

const words = s => s.split(/\s+/).filter(Boolean).length;
const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

/* ---------- 1. 跨骨架重复句 ---------- */

const seen = new Map();   // 归一化句子 → { g:Set, text, id }
for (const s of scenes) {
  const all = [
    ...s.lines.map(l => ({ en: l.en, kind: 'line' })),
    ...(s.branch ? [
      { en: s.branch.prompt.en, kind: 'branch' },
      ...s.branch.options.flatMap(o => [{ en: o.say.en, kind: 'branch' }, { en: o.react.en, kind: 'branch' }]),
    ] : []),
  ];
  for (const { en } of all) {
    const k = norm(en);
    if (!k) continue;
    const rec = seen.get(k) ?? { text: en, groups: new Set(), n: 0 };
    rec.groups.add(s.g ?? s.id);
    rec.n++;
    seen.set(k, rec);
  }
}

// 短套话（Yes. / Thanks.）重复是正常的，只看 6 个词以上的整句
const dup = [...seen.values()]
  .filter(r => r.groups.size > 1 && words(r.text) >= 6)
  .sort((a, b) => b.groups.size - a.groups.size);

console.log(`\n跨骨架重复的长句：${dup.length} 条`);
for (const d of dup.slice(0, 12)) {
  console.log(`  ×${d.groups.size}  ${d.text.slice(0, 66)}`);
}

/* ---------- 2. 难度与句子长度 ---------- */

const byLv = new Map();
for (const s of scenes) {
  const lens = s.lines.map(l => words(l.en));
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
  const push = x => {
    const a = byLv.get(s.lv) ?? [];
    a.push(x);
    byLv.set(s.lv, a);
  };
  push(avg);
}
console.log('\n难度 vs 平均句长（词）：');
for (const lv of [...byLv.keys()].sort((a, b) => a - b)) {
  const a = byLv.get(lv).sort((x, y) => x - y);
  const mid = a[Math.floor(a.length / 2)];
  console.log(`  L${lv}  ${a.length} 场  中位 ${mid.toFixed(1)} 词  范围 ${a[0].toFixed(1)}–${a[a.length - 1].toFixed(1)}`);
}

// 标注与长度明显错位的（A1 超过 11 词 / B2+ 不到 6 词）
const odd = scenes.filter(s => {
  const avg = s.lines.reduce((n, l) => n + words(l.en), 0) / s.lines.length;
  if (s.cefr === 'A1' && avg > 11) return true;
  if (s.cefr === 'A2' && avg > 16) return true;
  if (/^B2|^C/.test(s.cefr) && avg < 6) return true;
  return false;
});
console.log(`\n难度标注与句长明显不符：${odd.length} 场`);
for (const s of odd.slice(0, 8)) {
  const avg = s.lines.reduce((n, l) => n + words(l.en), 0) / s.lines.length;
  console.log(`  ${s.id}  ${s.cefr}  平均 ${avg.toFixed(1)} 词  ${s.name}`);
}

/* ---------- 3. 岔路类型 ---------- */

const kinds = {};
for (const s of scenes) if (s.branch) kinds[s.branch.kind] = (kinds[s.branch.kind] ?? 0) + 1;
console.log('\n岔路类型：', Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' / '));

/* ---------- 4. 每场可练量 ---------- */

const mine = scenes.map(s => s.lines.filter(l => l.r === s.you).length);
const hist = {};
for (const n of mine) hist[n] = (hist[n] ?? 0) + 1;
console.log('\n每场「你的台词」数量分布：', Object.entries(hist).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k} 句 ${v} 场`).join(' / '));

/* ---------- 5. 变体与句型 ---------- */

const perGroup = new Map();
for (const s of scenes) {
  const k = s.g ?? s.id;
  perGroup.set(k, (perGroup.get(k) ?? 0) + 1);
}
const counts = [...perGroup.values()];
console.log(`\n每个情境的变体数：最多 ${Math.max(...counts)}，最少 ${Math.min(...counts)}，平均 ${(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1)}`);

// 同一情境的变体共用句型是设计（去重后进复习池），跨情境重复才值得看
const ph = new Map();
for (const s of scenes) for (const p of s.phrases) {
  const k = norm(p.en);
  const rec = ph.get(k) ?? { groups: new Set() };
  rec.groups.add(s.g ?? s.id);
  ph.set(k, rec);
}
const crossPh = [...ph.values()].filter(r => r.groups.size > 1).length;
console.log(`句型：${ph.size} 条唯一，其中 ${crossPh} 条跨情境复用`);

/* ---------- 6. 中文与标点 ---------- */

const badZh = scenes.flatMap(s => s.lines.filter(l => !/[\u4e00-\u9fa5]/.test(l.zh ?? '')).map(l => `${s.id}: ${l.en}`));
const noStop = scenes.flatMap(s => s.lines.filter(l => !/[.!?]$/.test(l.en)).map(l => `${s.id}: ${l.en}`));
console.log(`\n缺中文：${badZh.length} 句；句末无标点：${noStop.length} 句`);
for (const b of badZh.slice(0, 5)) console.log('  ' + b);

/* ---------- 7. 数据体积 ---------- */

const bytes = fs.statSync(path.join(ROOT, 'public/data/dialogues.json')).size;
console.log(`\n数据体积：${(bytes / 1024 / 1024).toFixed(2)} MB`);
const perCat = {};
for (const s of scenes) perCat[s.cat] = (perCat[s.cat] ?? 0) + 1;
console.log('按类别：', Object.entries(perCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' / '));

/* ---------- 阈值：这几条一旦过线就说明语料退化了 ---------- */

const noBranch = scenes.filter(s => !s.branch).length;
const lines = [
  ['无岔路的场景', noBranch, 0],
  ['缺中文的句子', badZh.length, 0],
  ['句末无标点', noStop.length, 0],
  ['跨骨架重复长句', dup.length, 20],
  ['难度与句长不符', odd.length, 5],
];

const over = lines.filter(([, v, max]) => v > max);
console.log('');
if (over.length) {
  for (const [name, v, max] of over) console.log(`  ✗ ${name} ${v}（上限 ${max}）`);
  process.exitCode = 1;
} else {
  console.log('  ✓ 五项阈值全部达标');
}
