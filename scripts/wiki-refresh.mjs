/**
 * 换掉维基那批随机抓来的冷门条目。
 *
 * 现状：44 篇来自 `generator=random`，里面混进了足球运动员小传、印度情景喜剧、
 * 甚至 "Pubic hair removal" / "Abortion debate" / "Expulsion of Palestinians from Kuwait"
 * 这种不该出现在语言学习材料里的东西。
 *
 * 用法：
 *   node scripts/wiki-refresh.mjs --plan    抓取候选条目，切好段，写 data/wiki-candidates.json
 *   node scripts/wiki-refresh.mjs --apply   读回 data/wiki-candidates.json（补上译文后）替换旧条目
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'public/data/articles.json');
const TR = path.join(ROOT, 'public/data/tr.json');
const CAND = path.join(ROOT, 'data/wiki-candidates.json');

/* ---------- 要删的：冷门人物小传 / 流行文化琐事 / 敏感话题 ---------- */
const DROP = [
  'Pubic hair removal',                                    // 不适宜
  'Abortion debate',                                       // 敏感
  'Expulsion of Palestinians from Kuwait (1990–91)',       // 敏感
  'Anton Ondruš', 'Johann Studnicka', 'Jordi Gordillo Brunet',
  'Rainier I of Monaco, Lord of Cagnes', 'Mirian III of Iberia',
  'Jadoon', 'Heather McGregor',                            // 冷门人物/氏族，无阅读价值
  'Taarak Mehta Ka Ooltah Chashmah', 'Supernatural (American TV series)',
  'CBeebies', 'Request + Line',                            // 流行文化琐事
];

/* ---------- 要补的：知识性条目，长度和难度都适合 ---------------------------------- */
const TITLES = [
  'Water cycle', 'Volcano', 'Honey bee', 'Silk Road', 'Printing press',
  'Coral reef', 'Amazon River', 'Chess', 'Tea', 'Photosynthesis',
  'Great Wall of China', 'Origami', 'Antarctica', 'Steam engine', 'Moon',
  'Rainforest', 'Sahara', 'Wheel', 'Jazz', 'Solar System',
];

const stripHeadings = p => p.replace(/={2,}[^=]{1,60}={2,}/g, ' ').replace(/\s+/g, ' ').trim();

const normalize = p => stripHeadings(p)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2013\u2014/g, '-')
  .replace(/\u2026/g, '...')
  .replace(/\[[^\]]{0,40}\]/g, '')
  .replace(/[_*]+/g, '')
  .replace(/''/g, '')          // 维基的斜体号 ''melittology'' —— 留着会被当成引号
  .replace(/\s+/g, ' ')
  .trim();

const wordCount = s => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
// split.js 返回 {text,start,end}，这里只要文本
const split = t => splitSentences(t).map(x => x.text);

function isCleanParagraph(p) {
  if (p.length < 80 || p.length > 2400) return false;
  if (/https?:|\bwww\.|@|\.com\b/i.test(p)) return false;
  const caps = (p.match(/[A-Z]/g) || []).length / p.length;
  if (caps > 0.32) return false;
  const letters = (p.match(/[A-Za-z]/g) || []).length;
  if (letters / p.length < 0.72) return false;
  const strange = (p.match(/[^A-Za-z0-9\s.,;:'"!?()\-%$&/]/g) || []).length;
  if (strange / p.length > 0.012) return false;
  // 维基的列举段（Porcelain and pottery Foods Wine Spices Paper…）没有正常句子结构
  const sents = split(p).length;
  if (sents < 2 || wordCount(p) / sents > 45) return false;
  return true;
}

function chunkParagraph(p, minW, maxW, targetW) {
  const sents = split(p);
  const out = [];
  let buf = [], n = 0;
  for (const s of sents) {
    const sw = wordCount(s);
    if (sw === 0) continue;
    if (sw > maxW * 1.4) continue;
    buf.push(s); n += sw;
    if (n >= targetW) { out.push(buf.join(' ')); buf = []; n = 0; }
  }
  if (buf.length && n >= minW * 0.7) out.push(buf.join(' '));
  return out.map(t => t.replace(/^[\s.,;:!?)"'\]]+/, '')).filter(t => {
    const w = wordCount(t);
    const pieces = split(t);
    // 有「一句话只剩一两个词」的，多半是 A. mellifera 这类缩写被切断了，整段不要
    if (pieces.some(x => wordCount(x) < 4)) return false;
    // 一句 45 词以上，多半是 "Porcelain … Foods Wine Spices Paper …" 这种罗列
    if (pieces.some(x => wordCount(x) > 45)) return false;
    // 引号没配成对，说明句子在引文中间被切断了（"one of the most potent agents…｜of western…"）
    if ((t.match(/"/g) || []).length % 2 === 1) return false;
    // 四个以上首字母大写的词背靠背，是维基的罗列段（Foods Wine Spices Paper Metals and jewels…）
    if (/[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+/.test(t)) return false;
    return w >= minW && w <= maxW && /[.!?"']$/.test(t) && pieces.length >= 2;
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchPage(title, tries = 3) {
  const url = 'https://simple.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=' +
    encodeURIComponent(title);
  const res = await fetch(url, { headers: { 'User-Agent': 'TypeWake/0.1 (edu demo)' } });
  if (res.status === 429 && tries > 0) { await sleep(3000); return fetchPage(title, tries - 1); }
  if (!res.ok) throw new Error(`${title} HTTP ${res.status}`);
  const j = await res.json();
  const page = Object.values(j.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  return { title: page.title, pageid: page.pageid, extract: page.extract || '' };
}

/* ---------- plan ---------- */
if (process.argv.includes('--plan')) {
  const out = [];
  // 上一次已经抓成功的条目留着 —— 维基有速率限制，一次跑不全，反复跑会互相覆盖
  const prev = fs.existsSync(CAND) ? JSON.parse(fs.readFileSync(CAND, 'utf8')) : [];
  const pool = new Map(prev.map(x => [x.title, x]));
  const force = process.argv.includes('--force');
  for (const t of TITLES) {
    if (!force && pool.has(t)) { out.push(pool.get(t)); console.log(`  · ${t} 已有（${pool.get(t).paras.length} 段）`); continue; }
    await sleep(900);
    let page;
    try { page = await fetchPage(t); } catch (e) {
      const old = pool.get(t);
      if (old) { out.push(old); console.log(`  · ${t} 沿用上次（${old.paras.length} 段）`); }
      else console.log(`  ✗ ${t} ${e.message}`);
      continue;
    }
    if (!page) { console.log(`  ✗ ${t} 条目不存在`); continue; }
    const paras = [];
    for (const raw of page.extract.split(/\n\s*\n+/)) {
      const p = normalize(raw);
      if (!isCleanParagraph(p)) continue;
      for (const c of chunkParagraph(p, 55, 180, 120)) {
        paras.push(c);
        if (paras.length >= 3) break;
      }
      if (paras.length >= 3) break;        // 每条最多取 3 段，别让一篇维基霸占整个城区
    }
    if (!paras.length) { console.log(`  ✗ ${t} 切不出合格段落`); continue; }
    out.push({ title: page.title, pageid: page.pageid, paras });
    console.log(`  ✓ ${page.title.padEnd(24)} ${paras.length} 段  ${paras.map(x => wordCount(x)).join('/')} 词`);
  }
  fs.writeFileSync(CAND, JSON.stringify(out, null, 1));
  const total = out.reduce((s, x) => s + x.paras.length, 0);
  const sents = out.reduce((s, x) => s + x.paras.reduce((k, p) => k + split(p).length, 0), 0);
  console.log(`\n候选 ${out.length} 个条目 / ${total} 段 / ${sents} 句 → ${path.relative(ROOT, CAND)}`);
}

/* ---------- apply ---------- */
else if (process.argv.includes('--apply')) {
  const cand = JSON.parse(fs.readFileSync(CAND, 'utf8'));
  const data = JSON.parse(fs.readFileSync(ART, 'utf8'));
  const tr = JSON.parse(fs.readFileSync(TR, 'utf8'));

  const dropSet = new Set(DROP);
  const removed = data.items.filter(a => dropSet.has(a.s));
  data.items = data.items.filter(a => !dropSet.has(a.s));
  for (const a of removed) delete tr.map[a.id];

  // 难度阈值沿用现有分布：按 sc 排序后每 floor(n/7) 个一档
  const sorted = [...data.items].sort((x, y) => x.sc - y.sc);
  const per = Math.floor(sorted.length / 7);
  const bounds = [];
  for (let k = 1; k <= 6; k++) bounds.push(sorted[k * per].sc);
  const levelOf = sc => {
    let lv = 1;
    for (const b of bounds) if (sc > b) lv++;
    return Math.min(7, lv);
  };

  const dictWords = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words;
  const tierOf = new Map(dictWords.map(w => [w.w, w.t]));
  const TOK = /[A-Za-z][A-Za-z'-]*/g;

  let added = 0, needTr = {};
  for (const c of cand) {
    c.paras.forEach((tx, i) => {
      const toks = (tx.match(TOK) || []).map(t => t.toLowerCase().replace(/'s$/, ''));
      const n = toks.length || 1;
      let t1 = 0, t2 = 0, unknown = 0;
      for (const t of toks) {
        const k = tierOf.get(t);
        if (!k) unknown++;
        else if (k === 1) t1++;
        else if (k === 2) t2++;
      }
      const sents = split(tx);
      const avg = n / Math.max(1, sents.length);
      const diff = 0.55 * (1 - t1 / n) + 0.30 * (1 - (t1 + t2) / n) + 0.15 * Math.min(avg / 32, 1);
      const sc = Math.round(diff * 1000) / 1000;
      const id = `wiki-${c.pageid}-${i}`;
      data.items.push({
        id, tx, s: c.title, lv: levelOf(sc), sc, w: n, st: sents.length,
        avg: Math.round(avg * 10) / 10, nw: unknown + (n - t1 - t2 - unknown),
        th: 'science', lic: 'CC BY-SA 3.0', u: `simple.wikipedia:${c.pageid}`,
        ord: i + 1, tot: c.paras.length,
      });
      needTr[id] = sents.length;
      added++;
    });
  }

  fs.writeFileSync(ART, JSON.stringify(data));
  fs.writeFileSync(TR, JSON.stringify(tr));
  console.log(`✓ 删除 ${removed.length} 篇（${new Set(removed.map(a => a.s)).size} 个条目）`);
  console.log(`✓ 新增 ${added} 篇`);
  console.log(`· 待翻译 ${Object.values(needTr).reduce((a, b) => a + b, 0)} 句，见下`);
  for (const [id, n] of Object.entries(needTr)) console.log(`   ${id} ${n}`);
}
