/**
 * 给文库的每一本书准备一张封面。
 *
 * 两种来源：
 * 1. 长篇公版书 —— Gutenberg 的扫描封面（pg{id}.cover.medium.jpg）。那是真正的旧书封面，
 *    比任何合成图都更像"一本书"。
 * 2. 维基条目 / 没有封面的 —— 现画一张：按主题配色，中英文名压在版面上。
 *    这类条目本来没有"封面"这回事，但书架上一格空白比一张设计过的图更难看。
 *
 * 产物：
 *   public/covers/<slug>.jpg | .svg
 *   public/data/covers.json   —— 书名 → 文件名（界面按这个查，不去猜扩展名）
 *
 * 用法：node scripts/fetch-covers.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public/data');
const OUT = path.join(ROOT, 'public/covers');
const force = process.argv.includes('--force');
fs.mkdirSync(OUT, { recursive: true });

const arts = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8')).items;

/*
 * 中文书名从 src/lib/book-titles.ts 里读。
 * 那是唯一的定义处（界面也用它），这里再抄一份必然会分叉；
 * 文件是 TS，但那个对象是纯字面量，按行取出 `'英文': '中文',` 就够了。
 */
const ZH = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/book-titles.ts'), 'utf8');
  const out = {};
  for (const m of src.matchAll(/^\s*'([^']+)':\s*'([^']+)',/gm)) out[m[1]] = m[2];
  return out;
})();

/* 书名 → { 篇数, gutenberg id, 主题 } */
const books = new Map();
for (const a of arts) {
  const b = books.get(a.s) ?? { n: 0, gid: null, th: a.th ?? 'read' };
  b.n++;
  const m = /^gutenberg:(\d+)$/.exec(a.u ?? '');
  if (m) b.gid = +m[1];
  books.set(a.s, b);
}

const slugOf = title => title
  .toLowerCase()
  .replace(/['’.,:;!?()]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 48);

/*
 * 只有全书译文、没有选段的书（如《一九八四》）也要有脸。
 * 它们的书名不在 articles 里，得单独从 full/index.json 补上，
 * 否则书架那一格就是空白 —— 空白比一张设计过的图更难看。
 */
try {
  const idx = JSON.parse(fs.readFileSync(path.join(DATA, 'full/index.json'), 'utf8')).books ?? {};
  for (const info of Object.values(idx)) {
    if (!books.has(info.title)) {
      books.set(info.title, { n: info.n, gid: null, th: 'novel', unit: '句' });
    }
  }
} catch {
  /* 还没导出过全书就跳过 */
}

/**
 * 配色：同一主题一个色系，书架上看起来才像一套丛书。
 * 维基条目分在 history / science / culture / geo 四类里，各有各的底色。
 */
const THEME = {
  novel: ['#2f4858', '#e8dcc8'],
  mystery: ['#3a2f45', '#e6dcc4'],
  fable: ['#4a3f2a', '#f0e3c8'],
  history: ['#4a3028', '#ecdfcb'],
  science: ['#1f4247', '#dfe9de'],
  culture: ['#40314a', '#eadfe4'],
  geo: ['#2b3a2c', '#e3e6d6'],
  default: ['#33414d', '#e7dfd0'],
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 程序化封面：底色 + 细框 + 竖排中文书名 + 英文小字 */
function svgCover(zh, en, meta, th) {
  const [bg, ink] = THEME[th] ?? THEME.default;
  const zhChars = [...zh];
  // 竖排：中文书名沿右上角往下走，超过 8 字就折成两列
  const perCol = Math.min(8, zhChars.length);
  const cols = [];
  for (let i = 0; i < zhChars.length; i += perCol) cols.push(zhChars.slice(i, i + perCol));
  const lines = cols.slice(0, 2);
  const nameSize = zhChars.length <= 5 ? 46 : zhChars.length <= 8 ? 40 : 34;
  // 竖排从右往左排，第一列离右边距留 32px —— 起始就写 300 会让字的中心落在画布边缘上
  const nameSvg = lines.map((col, ci) => {
    const x = 300 - 32 - ci * (nameSize + 6);
    return `<text x="${x}" y="96" class="zh" font-size="${nameSize}">`
      + col.map((c, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : nameSize + 4}">${esc(c)}</tspan>`).join('')
      + '</text>';
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${shade(bg, -18)}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="420" fill="url(#g)"/>
  <rect x="14" y="14" width="272" height="392" fill="none" stroke="${ink}" stroke-opacity="0.34"/>
  <rect x="20" y="20" width="260" height="380" fill="none" stroke="${ink}" stroke-opacity="0.14"/>
  <g fill="${ink}" text-anchor="middle" font-family="Songti SC, SimSun, 'Noto Serif CJK SC', serif">${nameSvg}</g>
  <text x="24" y="352" fill="${ink}" fill-opacity="0.82" font-size="13"
        font-family="Georgia, 'Times New Roman', serif">${esc(en.slice(0, 30))}</text>
  <text x="24" y="374" fill="${ink}" fill-opacity="0.55" font-size="11"
        font-family="Georgia, serif">${esc(meta)}</text>
  <line x1="24" y1="332" x2="120" y2="332" stroke="${ink}" stroke-opacity="0.4"/>
</svg>`;
}

function shade(hex, d) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, v + d)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * 这几本书 Gutenberg 给的是"模板封面"——纯色底 + 几何图形 + 一条白标签，
 * 右下角还印着 Project Gutenberg 的水印。摆在书架上像占位图，不如自己画一张。
 * 判断依据是人眼看过一遍 20 张扫描封面（shots/contact.png 那种对照图）。
 */
const TEMPLATE_COVER = new Set(['The Aesop for Children', 'The Railway Children']);

const manifest = {};
let jpg = 0, svg = 0, skipped = 0;

for (const [title, b] of books) {
  const slug = slugOf(title);
  const zh = ZH[title] ?? title;
  let file = null;

  if (b.gid && !TEMPLATE_COVER.has(title)) {
    const dest = path.join(OUT, `${slug}.jpg`);
    if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
      file = `${slug}.jpg`;
    } else {
      const url = `https://www.gutenberg.org/cache/epub/${b.gid}/pg${b.gid}.cover.medium.jpg`;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'TypeWake/0.1 (edu demo)' } });
        const buf = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
        // 有的电子书封面是占位图（几 KB 的灰块），体积过小就当没有
        if (buf && buf.length > 4000) {
          fs.writeFileSync(dest, buf);
          file = `${slug}.jpg`;
          jpg++;
        }
      } catch (e) {
        console.warn('  下载失败', title, e.message);
      }
    }
  }

  if (!file) {
    const meta = `${b.n} ${b.unit ?? '篇'} · TypeWake 文库`;
    fs.writeFileSync(path.join(OUT, `${slug}.svg`), svgCover(zh, title, meta, b.th));
    file = `${slug}.svg`;
    svg++;
  }
  manifest[title] = file;
}

fs.writeFileSync(path.join(DATA, 'covers.json'), JSON.stringify(manifest, null, 0));
console.log(`✓ ${Object.keys(manifest).length} 本书 · 扫描封面 ${jpg} 张 · 生成封面 ${svg} 张`);
console.log(`  写入 public/data/covers.json`);
