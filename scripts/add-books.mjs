/**
 * 往文库增量加书。
 *
 * 为什么不做成「重跑 build-data」：那条路会重新随机拉维基条目、重排全库等级，
 * 现有 1179 篇的 id 会变、译文映射会断、用户的城区进度和每日卷轴也会错位。
 * 所以这里只做加法：下载新书 → 切段 → 按现有等级分位点落位 → 追加。
 *
 * 用法：node scripts/add-books.mjs [--dry] [--only=call,carol]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeItem, chunkParagraph, cleanGutenberg, isCleanParagraph, normalize,
} from './lib/prose.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DATA = path.join(ROOT, 'public/data');
const BOOKS_DIR = path.join(ROOT, 'data/raw/books');
fs.mkdirSync(BOOKS_DIR, { recursive: true });

const log = (...a) => console.log('[add]', ...a);

/** 新书单。cap 是入库段数，均匀取样，不是从头截一段 */
const NEW_BOOKS = [
  {
    id: 271, key: 'beauty', title: 'Black Beauty', theme: 'novel', lic: 'PD', cap: 30,
  },
  {
    id: 1874, key: 'railway', title: 'The Railway Children', theme: 'novel', lic: 'PD', cap: 30,
    // 从第一章正文切起，前面的目录与献词不入库
    after: /^Chapter\s+I\b/m,
  },
  {
    id: 501, key: 'dolittle', title: 'The Story of Doctor Dolittle', theme: 'novel', lic: 'PD', cap: 30,
    // Gutenberg 版前面有一篇 Hugh Walpole 的序，讲儿童文学，不是故事本身
    after: /^_THE FIRST CHAPTER_/m,
    // 布姆波王子这条线整个跳过。原著里他求医生把自己"变成白人"，才好去娶睡美人。
    // 这是 1920 年的情节，抽出来单独成页，就成了一则"黑皮肤被嫌弃"的童话 ——
    // 给孩子看的读物不必背这个包袱。每页都是独立选段，跳过不影响别的情节。
    block: /\bBumpo\b|turn (me|him) white/i,
  },
];

/**
 * 不入选的段落。
 *
 * 这些书写于一百年前，个别段子带着当年的种族偏见（《杜立德》里有一句催促狮子干活的话，
 * 《黑骏马》里也有一处）。留着不改是篡改原文，改了是伪造原文，所以整段不入库。
 */
const BLOCK = /\b(nigger|negro|savages?|heathens?)\b/i;

const dry = process.argv.includes('--dry');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;

async function fetchBook(id) {
  const f = path.join(BOOKS_DIR, `${id}.txt`);
  if (fs.existsSync(f) && fs.statSync(f).size > 20000) return fs.readFileSync(f, 'utf8');
  const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
  log('  下载', id);
  const res = await fetch(url, { headers: { 'User-Agent': 'TypeWake/0.1 (edu demo)' } });
  if (!res.ok) throw new Error(`${id} HTTP ${res.status}`);
  const t = await res.text();
  fs.writeFileSync(f, t);
  return t;
}

/** 等间隔取样：一本书从头取 30 段往往全在第一二章，均匀取能覆盖全书 */
function evenly(arr, n) {
  if (arr.length <= n) return arr.slice();
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * arr.length) / n)]);
  return out;
}

const data = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8'));
const dict = JSON.parse(fs.readFileSync(path.join(DATA, 'dict.json'), 'utf8'));
const tierOf = new Map(dict.words.map(w => [w.w, w.t]));

const before = data.items.length;

// 现有等级的分位点：新文章必须落进这些区间，而不是重新排名
const bound = [];
for (let lv = 1; lv <= 7; lv++) {
  const scs = data.items.filter(x => x.lv === lv).map(x => x.sc);
  bound[lv] = scs.length ? Math.max(...scs) : 1;
}
const levelOf = sc => {
  for (let lv = 1; lv <= 7; lv++) if (sc <= bound[lv]) return lv;
  return 7;
};
log('现有等级上界', bound.map(x => x.toFixed(3)).join(' '));

// 去重：和已有文章比对开头 60 字符
const seen = new Set(data.items.map(x => x.tx.slice(0, 60).toLowerCase()));

const added = [];
for (const src of NEW_BOOKS) {
  if (only && !only.has(src.key)) continue;
  if (data.items.some(x => x.s === src.title)) { log(`《${src.title}》已在库里，跳过`); continue; }

  let raw = cleanGutenberg(await fetchBook(src.id));
  if (src.after) {
    const m = raw.match(src.after);
    if (!m) log(`  ⚠ ${src.title} 没找到章节起点，从全文取样`);
    else raw = raw.slice(m.index);
  }
  const paras = raw.split(/\n\s*\n+/).map(normalize).filter(isCleanParagraph);

  const chunks = [];
  for (const p of paras) chunks.push(...chunkParagraph(p, 55, 190, 125));

  const usable = chunks.filter(tx => !BLOCK.test(tx) && !(src.block && src.block.test(tx)));
  const dropped = chunks.length - usable.length;
  const picked = evenly(usable, src.cap);
  log(`《${src.title}》 可用 ${paras.length} 段 → 切出 ${chunks.length} 段`
    + (dropped ? ` → 剔除 ${dropped} 段` : '') + ` → 取样 ${picked.length}`);

  let n = 0;
  for (const tx of picked) {
    const fp = tx.slice(0, 60).toLowerCase();
    if (seen.has(fp)) continue;
    seen.add(fp);

    const it = {
      id: `${src.key}-${String(n).padStart(4, '0')}`,
      tx,
      s: src.title,
      lv: 1,
      sc: 0,
      w: 0, st: 0, avg: 0, nw: 0,
      th: src.theme,
      lic: src.lic,
      u: `gutenberg:${src.id}`,
      ord: n + 1,
      tot: 0,
    };
    analyzeItem(it, tierOf);
    it.lv = levelOf(it.sc);
    added.push(it);
    n++;
  }
  for (const it of added) if (it.s === src.title) it.tot = n;
  log(`  入库 ${n} 段 · 难度分布 ${JSON.stringify(
    added.filter(x => x.s === src.title).reduce((a, x) => (a[x.lv] = (a[x.lv] || 0) + 1, a), {}),
  )}`);
}

if (!added.length) { log('没有新增'); process.exit(0); }

const next = { ...data, items: [...data.items, ...added] };
// 来源清单补上新书，详情页要显示许可
for (const src of NEW_BOOKS) {
  if (added.some(x => x.s === src.title) && !next.sources.some(s => s.title === src.title)) {
    next.sources.push({
      title: src.title,
      license: src.lic,
      url: `https://www.gutenberg.org/ebooks/${src.id}`,
    });
  }
}

log('总计', before, '→', next.items.length, `（+${added.length}）`);
if (dry) { log('--dry，不写盘'); process.exit(0); }

fs.writeFileSync(path.join(DATA, 'articles.json'), JSON.stringify(next));
log('写入 articles.json');
