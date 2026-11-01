/**
 * 译文质检：把 5364 句过一遍，按「可疑类型」分桶，产出可供人工复核的批次。
 *
 * 用法：
 *   node scripts/qa-tr.mjs --stats          只出分布（用于校准阈值）
 *   node scripts/qa-tr.mjs                  出报告 + 导出复核批次
 *
 * 它不能判断「译得好不好」，只能判断「这句大概率有问题」。
 * 目标是让 5364 句里真正需要人眼看的比例降到 5% 以内。
 */
import fs from 'node:fs';
import path from 'node:path';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

const STATS_ONLY = process.argv.includes('--stats');
const CHECK = process.argv.includes('--check');   // 供 npm test 调用：硬错误时退出码 1

const CJK = /[\u4e00-\u9fff]/;
const KANA = /[\u3040-\u30ff]/;
const HANGUL = /[\uac00-\ud7af]/;
const LATIN_RUN = /[A-Za-z]{12,}/;

/** 英文数词 → 数字，用于和译文里的阿拉伯数字比对 */
const NUM_WORD = {
  // 故意不含 one：这批文本里 "one" 绝大多数是代词（every one / little one / the one who），
  // 当成数字 1 会产生大量误报，而真正的 "one" 数量在中文里也常被省略。
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100, thousand: 1000,
};
const CN_D = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const CN_U = { 十: 10, 百: 100, 千: 1000 };

/** 中文数词（含复合）→ 阿拉伯数字 */
function cnNumeral(str) {
  let total = 0, num = 0;
  for (const ch of str) {
    if (ch in CN_D) num = CN_D[ch];
    else if (ch in CN_U) { total += (num || 1) * CN_U[ch]; num = 0; }
    else if (ch === '万') { total = (total + num) * 10000; num = 0; }
  }
  return total + num;
}

function numsIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/\d+/g)) out.add(Number(m[0]));
  for (const m of text.matchAll(/\b([a-z]+)\b(\s+[a-z]+)?/gi)) {
    const w = m[1].toLowerCase();
    const next = (m[2] || '').trim().toLowerCase();
    // 「one another」「no one」「one of them」里的 one 不是数量
    if (w === 'one' && (next === 'another' || next === 'of' || next === 'day' || next === 'side')) continue;
    if (w === 'one' && /(no|any|every|some)$/i.test(text.slice(Math.max(0, m.index - 5), m.index).trim())) continue;
    const n = NUM_WORD[w];
    if (n) out.add(n);
  }
  return out;
}

function cnNumsIn(text) {
  const out = new Set();
  for (const m of text.matchAll(/\d+/g)) out.add(Number(m[0]));
  for (const m of text.matchAll(/[零一二三四五六七八九十百千万]{2,}/g)) out.add(cnNumeral(m[0]));
  for (const ch of text) if (ch in CN_D && CN_D[ch] > 0) out.add(CN_D[ch]);
  return out;
}

const rows = [];
const seenZh = new Map();   // 译文 → [id#idx]，用于抓「同一句译文被复制到多处」
const artAgg = new Map();   // 整篇聚合：引号数量必须按篇比，句级比没有意义

let ratioSum = 0, ratioN = 0;
const ratioList = [];

for (const a of articles) {
  const sents = splitSentences(a.tx);
  const arr = tr[a.id] || [];
  sents.forEach((s, i) => {
    const en = s.text;
    const zh = (arr[i] || '').trim();
    const enChars = en.replace(/\s+/g, '').length;
    const zhChars = zh.replace(/\s+/g, '').length;
    const ratio = enChars ? zhChars / enChars : 0;
    if (zhChars > 0) { ratioSum += ratio; ratioN++; ratioList.push(ratio); }

    rows.push({ id: a.id, lv: a.lv, i, en, zh, enChars, zhChars, ratio });

    // 整篇统计引号：英文直引号 2 个 = 一对，中文「」2 个 = 一对
    const g = artAgg.get(a.id) || { id: a.id, lv: a.lv, enQ: 0, zhQ: 0, open: 0, close: 0, n: 0 };
    g.enQ += (en.match(/"/g) || []).length;
    g.zhQ += (zh.match(/[\u300c\u300d\u201c\u201d]/g) || []).length;
    g.open += (zh.match(/[\u300c\u201c]/g) || []).length;
    g.close += (zh.match(/[\u300d\u201d]/g) || []).length;
    g.n++;
    artAgg.set(a.id, g);

    if (zhChars >= 6) {
      const k = zh;
      if (!seenZh.has(k)) seenZh.set(k, []);
      seenZh.get(k).push(`${a.id}#${i}`);
    }
  });
}

if (STATS_ONLY) {
  ratioList.sort((x, y) => x - y);
  const q = p => ratioList[Math.floor(ratioList.length * p)].toFixed(3);
  console.log(`样本 ${ratioN} 句 · 长度比（中文非空白字符 / 英文非空白字符）`);
  console.log(`  p01=${q(0.01)}  p05=${q(0.05)}  p25=${q(0.25)}  中位=${q(0.5)}  p75=${q(0.75)}  p95=${q(0.95)}  p99=${q(0.99)}`);
  const buckets = {};
  for (const r of ratioList) {
    const k = (Math.round(r * 10) / 10).toFixed(1);
    buckets[k] = (buckets[k] || 0) + 1;
  }
  console.log('分布（0.1 一档，只列 ≥30 的）:');
  Object.entries(buckets).sort((x, y) => Number(x[0]) - Number(y[0]))
    .filter(([, n]) => n >= 30)
    .forEach(([k, n]) => console.log(`  ${k}: ${n}`));
  process.exit(0);
}

/* ---------- 分桶 ---------- */

const rowOf = new Map(rows.map(r => [`${r.id}#${r.i}`, r]));

const flags = new Map();   // key `id#i` → Set(reason)
const add = (key, reason) => {
  if (!flags.has(key)) flags.set(key, new Set());
  flags.get(key).add(reason);
};

for (const r of rows) {
  const key = `${r.id}#${r.i}`;
  if (!r.zh) { add(key, 'empty'); continue; }

  const hasCjk = CJK.test(r.zh);
  if (!hasCjk) add(key, 'no-cjk');                                  // 完全没中文
  if (r.zh.replace(/\s+/g, '') === r.en.replace(/\s+/g, '')) add(key, 'same-as-en');

  if (KANA.test(r.zh)) add(key, 'kana');                            // 混入日文假名
  if (HANGUL.test(r.zh)) add(key, 'hangul');
  if (/[値経対実発関変覚薬戦読鉄裏從個們這說時會]/.test(r.zh)) add(key, 'jp-han');  // 日文/繁体字形
  if (/(.)\1{3,}/.test(r.zh)) add(key, 'repeat');                   // 「的的的的」
  if (/的的|。。|，，|。。/.test(r.zh)) add(key, 'dup-func');

  const latin = r.zh.match(LATIN_RUN);
  if (latin) add(key, 'latin-run');                                 // 长串英文残留

  // 数字不一致：原文有数字而译文完全没有，或双方数字集合对不上
  const enN = numsIn(r.en);
  const zhN = cnNumsIn(r.zh);
  // 只抓「原文有数字、译文一个数字都没有」——这条的误报率低。
  // 「数字对不上」不抓：中文习惯用汉字数字（十二 / 二十世纪三十年代），逐值比对全是噪声。
  const zhHasNumUnit = /[十百千万]/.test(r.zh);
  if (enN.size && zhN.size === 0 && !zhHasNumUnit) add(key, 'num-missing');

  // 长度比：实测 5364 句的中位数是 0.361（p05=0.272，p95=0.508）。
  // 只抓两端的离群值，正常区间内的短长都不判 —— 否则会淹没在误报里。
  // 短句的比值没有统计意义（"wolf!" → 「狼来了！」= 1.0），只在 20 字符以上判定
  if (r.enChars >= 20 && r.ratio < 0.15) add(key, 'too-short');
  if (r.enChars >= 20 && r.ratio > 0.60) add(key, 'too-long');

  // 译文里没有、原文里有的引号/问号：提示可能是漏译了从句
  const enQ = (r.en.match(/[?？]/g) || []).length;
  const zhQ = (r.zh.match(/[?？]/g) || []).length;
  if (enQ && !zhQ) add(key, 'question-lost');

  // 机翻痕迹：半角 -- 作破折号、直排引号、逗号后紧跟开引号（MT 的模板残留）
  if (/--|\u201c|\u201d|\uff0c\s*\u201c/.test(r.zh)) add(key, 'mt-artifact');

  // 中英标点混用：中文句子里出现半角逗号/句号夹在汉字之间
  if (/[\u4e00-\u9fff],[\u4e00-\u9fff]/.test(r.zh) || /[\u4e00-\u9fff]\.[\u4e00-\u9fff]/.test(r.zh)) {
    add(key, 'halfwidth-punct');
  }
}

// 同句译文复制到多处（跨文章或同文章不同句）
for (const [zh, locs] of seenZh) {
  if (locs.length >= 2) {
    // 极短的应答句重复是正常的（"No, no." 译成「不，不！」），长句重复才是问题
    const distinctIds = new Set(locs.map(x => x.split('#')[0]));
    // 原文本身就重复的（「Will you, won't you」这种副歌）译文重复是对的
    const ens = locs.map(l => (rowOf.get(l)?.en || '').replace(/\s+/g, ' ').toLowerCase());
    const enUnique = new Set(ens).size;
    if ((zh.length >= 14 || distinctIds.size >= 2) && enUnique > 1) {
      for (const loc of locs) add(loc, 'dup-zh');
    }
  }
}

/* ---------- 整篇引号体检 ---------- */

const quoteArticles = [];
for (const g of artAgg.values()) {
  const gap = g.enQ - g.zhQ;            // 英文引号多于中文 → 译文丢了引号
  const unbalanced = g.open !== g.close;
  if ((g.enQ >= 4 && gap >= 4) || unbalanced) {
    quoteArticles.push({ ...g, gap, unbalanced });
  }
}
quoteArticles.sort((a, b) => b.gap - a.gap);

if (quoteArticles.length) {
  console.log(`\n引号可疑的篇目 ${quoteArticles.length} 篇（英文引号显著多于译文，或中文引号不配对）：`);
  quoteArticles.slice(0, 10).forEach(a =>
    console.log(`  ${a.id}  英 ${a.enQ} / 中 ${a.zhQ}（差 ${a.gap}）${a.unbalanced ? ' 不配对' : ''}`)
  );
}

/* ---------- 汇总 ---------- */

const byReason = {};
for (const [, set] of flags) for (const r of set) byReason[r] = (byReason[r] || 0) + 1;

const items = [...flags.entries()]
  .map(([key, set]) => {
    const r = rowOf.get(key);
    return {
      key, id: r.id, lv: r.lv, i: r.i, en: r.en, zh: r.zh,
      ratio: Number(r.ratio.toFixed(2)),
      reasons: [...set],
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id) || a.i - b.i);

// 风险分：多个信号同时命中 > 单一信号
for (const it of items) {
  it.score = it.reasons.reduce((s, r) => s + ({ empty: 5, 'no-cjk': 5, 'same-as-en': 5, 'num-mismatch': 3, 'num-missing': 2, 'dup-zh': 2, 'jp-han': 3, kana: 3, hangul: 3 }[r] || 1), 0);
}
items.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

const total = rows.length;
console.log(`总句数 ${total} · 触发 ${flags.size} 句（${(flags.size / total * 100).toFixed(1)}%）`);
console.log('按类型：');
Object.entries(byReason).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k.padEnd(14)} ${n}`));

// 导出复核批次：每批 40 条
const OUT = path.join(ROOT, 'data/qa');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ total, byReason, items, quoteArticles }, null, 1));

const PER = 40;
const batches = Math.ceil(items.length / PER);
for (let b = 0; b < batches; b++) {
  fs.writeFileSync(
    path.join(OUT, `rev-${String(b + 1).padStart(3, '0')}.json`),
    JSON.stringify(items.slice(b * PER, (b + 1) * PER), null, 1)
  );
}
console.log(`复核批次：${batches} 个 → data/qa/rev-*.json（每批 ${PER} 条）`);

/*
 * --check：区分「硬错误」与「提示」。
 * 硬错误会让 npm test 失败；soft 规则（长度比、重复句）只提示，因为它们本身有误报。
 */
if (CHECK) {
  const HARD = new Set(['empty', 'mt-artifact', 'jp-han', 'kana', 'hangul', 'dup-func']);
  const hard = items.filter(it =>
    it.reasons.some(r => HARD.has(r))
    || (it.reasons.includes('no-cjk') && it.zh.length > 4)
    || (it.reasons.includes('same-as-en') && it.zh.length > 4)
  );
  if (hard.length) {
    console.error(`\n✗ 质检发现 ${hard.length} 处硬错误：`);
    hard.slice(0, 10).forEach(it => console.error(`  ${it.key}  ${it.reasons.join(',')}`));
    process.exit(1);
  }
  console.log('✅ 质检无硬错误（空句 / 机翻痕迹 / 非中文 / 病句）');
}
