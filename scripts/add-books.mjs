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
    id: 558, key: 'steps', title: 'The Thirty-Nine Steps', theme: 'novel', lic: 'PD', cap: 30,
    // 前面是目录（"Chapter I  The Man Who Died" 带标题那行），正文那行只有一个句点
    after: /^Chapter I\.\s*$/m,
  },
  { id: 35, key: 'timemachine', title: 'The Time Machine', theme: 'novel', lic: 'PD', cap: 30 },
  {
    id: 514, key: 'littlewomen', title: 'Little Women', theme: 'novel', lic: 'PD', cap: 30,
    // 目录里是"CHAPTER ONE PLAYING PILGRIMS"，正文那行只有"CHAPTER ONE"
    after: /^CHAPTER ONE\s*$/m,
  },
  {
    /*
     * 《一九八四》：美国境内版权到 2044 年，Gutenberg 主站没有；
     * 走澳洲站（奥威尔 1950 年去世，中澳两地均已进入公有领域）。
     * 原文已存在 data/raw/books/1984.txt，不再联网。
     */
    id: 0, key: 'n1984', title: 'Nineteen Eighty-Four', theme: 'novel', lic: 'PD',
    cap: 40,
    file: 'data/raw/books/1984.txt',
    after: /^PART ONE/m,
    until: /^THE END/m,
    u: 'gutenberg.net.au/ebooks01/0100021',
  },
];

/**
 * 不入选的段落。
 *
 * 这些书写于一百年前，个别段子带着当年的种族偏见（《杜立德》里有一句催促狮子干活的话，
 * 《黑骏马》里也有一处）。留着不改是篡改原文，改了是伪造原文，所以整段不入库。
 *
 * 只挡真正的蔑称。"savage" 不在此列 —— 这些老书里它九成是在说野兽或"野蛮时代"，
 * 是形容词不是称呼；一律挡掉会把《时间机器》里好几段好文字误伤。
 */
const BLOCK = /\b(nigger|negro|heathens?)\b/i;

const dry = process.argv.includes('--dry');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;

async function fetchBook(id, file) {
  // 没有 Gutenberg 编号的书（比如《一九八四》，美国境内仍受版权，只能走澳洲站）
  // 直接读本地文件；文件由调用方事先放好
  if (file) {
    const f = path.join(ROOT, file);
    if (!fs.existsSync(f)) throw new Error(`本地原文不存在：${file}`);
    log('  读本地', file);
    return fs.readFileSync(f, 'utf8');
  }
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

  let raw = cleanGutenberg(await fetchBook(src.id, src.file));
  if (src.after) {
    const m = raw.match(src.after);
    if (!m) log(`  ⚠ ${src.title} 没找到章节起点，从全文取样`);
    else raw = raw.slice(m.index);
  }
  if (src.until) {
    // 版权页/尾声之后的出版方脚注不属于正文，切掉
    const m = raw.match(src.until);
    if (m) raw = raw.slice(0, m.index);
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
      u: src.u ?? `gutenberg:${src.id}`,
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
