/**
 * 场景对话语料的生成器。
 *
 * 为什么不是直接把 1000 个场景手写进一个大 JSON：
 * - 1000 场 × 10 句 = 一万句，手写会边写边忘前面的设定，质量必然塌；
 * - 同一个情境的「不同走法」（赶时间 / 想多坐会儿 / 带了孩子）本质是**同一段骨架换几处台词**，
 *   手抄一遍只会抄出不一致（前一句要外带，后一句又问「在这儿喝吗」）。
 *
 * 所以语料分两层：
 *   骨架（scripts/dlg/*.mjs 里手写）：一段完整对话 + 若干「变体」，
 *     每个变体给出自己的情境描述，并**按下标替换**骨架里的若干句。
 *   场景（这里生成）：骨架 × 变体 = 一个可练的具体场景，id 稳定（cafe / cafe-2 / cafe-3）。
 *
 * 「替换」而不是「随机抽取」是刻意的：随机拼句一定会拼出前后矛盾的对话，
 * 而且同一场每次刷新都不一样，用户的成绩就没法归因。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normSwap } from './dlg/_dsl.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts/dlg');
const OUT = path.join(ROOT, 'public/data/dialogues.json');

/* --------------------------- 载入源 --------------------------- */

const files = fs.existsSync(SRC)
  ? fs.readdirSync(SRC).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort()
  : [];

const packs = [];
for (const f of files) {
  const mod = await import(`file://${path.join(SRC, f).replace(/\\/g, '/')}`);
  const pack = mod.default;
  if (!pack?.cat || !Array.isArray(pack.items)) {
    console.error(`  ✗ ${f} 导出格式不对（需要 { cat, items: [...] }）`);
    process.exitCode = 1;
    continue;
  }
  packs.push({ file: f, ...pack });
}

/* --------------------------- 展开 --------------------------- */

const bad = [];
const warnings = [];
const say = (where, msg) => bad.push(`${where} ${msg}`);
const warn = msg => warnings.push(msg);

/** 校验一句台词（与 src/lib/dialogue.ts 的 validate 口径一致） */
function checkSay(where, s, needNote = false) {
  if (!s || typeof s !== 'object') return say(where, '不是对象');
  if (!s.en) return say(where, '缺英文');
  if (/[^\x20-\x7E]/.test(s.en)) say(where, `英文含非 ASCII：${s.en}`);
  if (!/[.!?]$/.test(s.en)) say(where, `英文没有句末标点：${s.en}`);
  if (s.en.split(/\s+/).length < 2) say(where, `英文太短：${s.en}`);
  if (!s.zh) say(where, '缺中文');
  else if (!/[\u4e00-\u9fa5]/.test(s.zh)) say(where, `中文不含汉字：${s.zh}`);
  if (needNote && !s.note) say(where, '缺 note');
}

/** 一个骨架 → 若干 scene */
function expand(item, cat, file) {
  const tag0 = `${file}:${item.id}`;
  const out = [];

  if (!item.id || !/^[a-z0-9-]+$/.test(item.id)) say(tag0, 'id 必须是小写字母/数字/连字符');
  if (!item.name) say(tag0, '缺名字');
  if (!(item.lv >= 1 && item.lv <= 7)) say(tag0, `难度越界：${item.lv}`);
  if (!/^[ABC][12]\+?$/.test(item.cefr ?? '')) say(tag0, `CEFR 不合法：${item.cefr}`);
  if (item.roles?.length !== 2) say(tag0, '角色必须是两个');
  if ((item.lines?.length ?? 0) < 6) say(tag0, '台词少于 6 句');

  const you = item.you ?? 0;
  const branches = Array.isArray(item.branches) ? item.branches
    : item.branch ? [item.branch] : [];

  // 骨架本身的台词先过一遍：变体会替换掉其中几句，但没被替换的必须是好的
  item.lines?.forEach((l, i) => checkSay(`${tag0}#${i}`, l));

  const mine = (item.lines ?? []).filter(l => l.r === you).length;
  if (mine < 3) say(tag0, `你的台词少于 3 句（${mine}）`);

  const vs = (item.variants?.length ? item.variants : [{ setting: item.setting }])
    .map(v => ({ ...v, swap: normSwap(v.swap) }));
  vs.forEach((v, vi) => {
    const tag = `${tag0}v${vi + 1}`;
    if (!v.setting) say(tag, '缺情境描述');
    else if (!/[\u4e00-\u9fa5]/.test(v.setting)) say(tag, '情境不含汉字');

    // 按下标替换
    const lines = (item.lines ?? []).map((l, i) => {
      const sw = v.swap?.[i];
      if (!sw) return { r: l.r, en: l.en, zh: l.zh, ...(l.note ? { note: l.note } : {}) };
      checkSay(`${tag}swap${i}`, sw);
      if (sw.r != null && sw.r !== l.r) say(`${tag}swap${i}`, '替换句不能改角色');
      return { r: l.r, en: sw.en, zh: sw.zh, ...(sw.note ?? l.note ? { note: sw.note ?? l.note } : {}) };
    });

    // 替换后重新检查「你的台词」数量（换掉的可能正好是你的句子）
    const mineAfter = lines.filter(l => l.r === you).length;
    if (mineAfter < 3) say(tag, `替换后你的台词只剩 ${mineAfter} 句`);

    let branch;
    const bi = v.br ?? 0;
    if (branches.length) {
      const b = branches[bi];
      if (!b) say(tag, `岔路下标越界：${bi}`);
      else {
        // 岔路必须接在「你的台词」之后。语料里偶尔会把 at 写到对方那一行上
        // （不同骨架的开头角色不一样），这里前移到最后一句你说的话，
        // 而不是整篇作废 —— 但会记一条警告，方便回头修语料。
        let at = b.at;
        if (lines[at] && lines[at].r !== you) {
          let k = at;
          while (k > 0 && lines[k].r !== you) k--;
          if (lines[k].r === you) {
            warn(`${tag} 岔路位置 ${at} 落在对方台词上，已前移到 ${k}`);
            at = k;
          }
        }
        if (!(at >= 0 && at < lines.length)) say(tag, `岔路位置越界：${b.at}`);
        else {
          if (lines[at].r !== you) say(tag, '岔路必须接在你的台词之后');
          const next = lines[at + 1];
          if (!next) say(tag, '岔路后没有可被顶替的台词');
          else if (next.r === you) say(tag, '岔路后面应该是对方的台词');
          const back = lines[at + 2];
          if (back && back.r !== you) say(tag, '岔路结束后应接回你的台词');
        }
        const KINDS = ['short', 'cost', 'change', 'probe', 'offer', 'other'];
        if (!KINDS.includes(b.kind)) say(tag, `岔路类型非法：${b.kind}`);
        if (!b.task) say(tag, '岔路缺目标说明');
        checkSay(`${tag}prompt`, b.prompt);
        if ((b.options?.length ?? 0) < 2) say(tag, '岔路少于两个选项');
        b.options?.forEach((o, k) => {
          checkSay(`${tag}opt${k}.say`, o.say);
          checkSay(`${tag}opt${k}.react`, o.react);
        });
        branch = {
          at, kind: b.kind, task: b.task,
          prompt: pick(b.prompt), options: b.options.map(o => ({ say: pick(o.say), react: pick(o.react) })),
        };
      }
    }

    const phrases = (item.phrases ?? []).map(p => ({ ...pick(p) }));
    if (phrases.length < 2) say(tag, `句型少于 2 条（${phrases.length}）`);
    phrases.forEach((p, i) => {
      if (!p.en || !p.zh) say(`${tag}phrase${i}`, '缺字段');
    });

    out.push({
      id: vi === 0 ? item.id : `${item.id}-${vi + 1}`,
      g: item.id,
      name: v.tag ? `${item.name} · ${v.tag}` : item.name,
      cat,
      lv: item.lv,
      cefr: item.cefr,
      setting: v.setting,
      roles: [...item.roles],
      you,
      lines,
      ...(branch ? { branch } : {}),
      phrases,
    });
  });

  return out;
}

/** 只挑 en/zh/note，别把源里的组装字段漏进产物 */
const pick = s => (s ? { en: s.en, zh: s.zh, ...(s.note ? { note: s.note } : {}) } : s);

/* --------------------------- 汇总 --------------------------- */

const scenes = [];
for (const p of packs) {
  // 允许条目自己带 cat：一个文件里可以混几类场景，不必为每个类别开一个文件
  for (const item of p.items) scenes.push(...expand(item, item.cat ?? p.cat, p.file));
}

// id 唯一
const seen = new Map();
for (const s of scenes) {
  if (seen.has(s.id)) bad.push(`id 重复：${s.id}（${seen.get(s.id)} 与当前）`);
  seen.set(s.id, s.id);
}

/* --------------------------- 报告 --------------------------- */

const byCat = new Map();
for (const s of scenes) byCat.set(s.cat, (byCat.get(s.cat) ?? 0) + 1);
const byLv = new Map();
for (const s of scenes) byLv.set(s.lv, (byLv.get(s.lv) ?? 0) + 1);
const groups = new Set(scenes.map(s => s.g));
const nLines = scenes.reduce((n, s) => n + s.lines.length, 0);
const nMine = scenes.reduce((n, s) => n + s.lines.filter(l => l.r === s.you).length, 0);
const nBranch = scenes.filter(s => s.branch).length;
const nPhrase = scenes.reduce((n, s) => n + s.phrases.length, 0);

console.log(`\n场景对话语料`);
console.log(`  骨架 ${groups.size} 个 × 变体 → 场景 ${scenes.length} 场`);
console.log(`  台词 ${nLines} 句（其中「你」的 ${nMine} 句）· 岔路 ${nBranch} 处 · 句型 ${nPhrase} 条`);
console.log(`  类别 ${[...byCat].map(([k, v]) => `${k} ${v}`).join(' / ')}`);
console.log(`  难度 ${[...byLv].sort((a, b) => a[0] - b[0]).map(([k, v]) => `L${k} ${v}`).join(' / ')}`);

if (warnings.length) {
  console.log(`\n  ⚠ ${warnings.length} 处岔路位置自动前移（不影响结果，语料可以再对齐）`);
  for (const w of warnings.slice(0, 6)) console.log(`    ${w}`);
}

if (bad.length) {
  console.error(`\n  ✗ ${bad.length} 处问题：`);
  for (const b of bad.slice(0, 40)) console.error(`    ${b}`);
  if (bad.length > 40) console.error(`    …还有 ${bad.length - 40} 处`);
  process.exitCode = 1;
} else {
  // 校验通过才写盘，避免把坏语料留在 public 里
  const bank = { v: 2, scenes };
  fs.writeFileSync(OUT, JSON.stringify(bank, null, 1) + '\n');
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`  ✓ 写入 public/data/dialogues.json（${kb} KB）\n`);
}
