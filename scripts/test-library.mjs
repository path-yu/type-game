// 文库页：书架（封面 + 书名）→ 目录（每段一行）→ 阅读页。
//
// 之前的断言集中在「1419 行全都渲染出来了」——那是旧版把全库摊平的做法。
// 现在文先是 52 个可以挑的书封，点进去才是目录，所以断言也跟着换成三层：
// 书架能看、目录能翻、点得进阅读页。
import puppeteer from 'puppeteer-core';

const PORT = process.env.PORT || 4173;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0;
const fails = [];
const check = (name, cond, got = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${got ? `  ${got}` : ''}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${got ? `  ${got}` : ''}`); }
};

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 2 },
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));

const clearSearch = () => p.evaluate(() => {
  const el = document.querySelector('.lib-search');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, '');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.hero');
  await sleep(500);

  const entry = await p.evaluate(() => document.querySelector('.ghost-btn')?.textContent ?? '');
  check('城市页有全库入口', /全部\s*\d+\s*篇/.test(entry), entry || '（无）');

  await p.click('.ghost-btn');
  await p.waitForSelector('.lib-shelf', { timeout: 6000 });
  await sleep(900);

  const head = await p.evaluate(() => document.querySelector('.page-sub')?.textContent ?? '');
  const total = +(/(\d+)\s*篇/.exec(head) || [])[1] || 0;
  check('顶部标出总篇数', total > 1000, head);
  check('页头说的是「书」', /(\d+)\s*本书/.test(head), head.trim());

  /* ---------------- 书架 ---------------- */
  const shelf = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.lib-book')];
    const imgs = cards.map(c => c.querySelector('.lib-cover img'));
    return {
      books: cards.length,
      covers: imgs.length,
      broken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
      loaded: imgs.filter(i => i.naturalWidth > 0).length,
      firstCover: imgs[0]?.getAttribute('src') ?? '',
      titles: cards.map(c => c.querySelector('.lib-book-title')?.textContent?.trim() ?? ''),
    };
  });
  check('书架按书渲染', shelf.books >= 50, `${shelf.books} 本`);
  check('每本都有封面图', shelf.covers === shelf.books, `${shelf.covers} 张`);
  // 封面是懒加载的：首屏只加载露出来的那几张，所以先看有没有坏图，再滚到底复核全部
  check('首屏封面能加载且无坏图', shelf.broken.length === 0 && shelf.loaded >= 6,
    shelf.broken.length ? `坏图 ${shelf.broken.slice(0, 2).join(',')}` : `${shelf.loaded}/${shelf.covers} 已加载`);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1200);
  const lazy = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('.lib-cover img')];
    return { n: imgs.length, ok: imgs.filter(i => i.naturalWidth > 0).length };
  });
  check('滚到底后全部封面都加载', lazy.ok === lazy.n, `${lazy.ok}/${lazy.n}`);
  await p.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  check('封面路径指向 covers/', /\/covers\/[a-z0-9-]+\.(jpg|svg)$/.test(shelf.firstCover), shelf.firstCover);

  const noZh = shelf.titles.filter(t => !/[\u4e00-\u9fa5]/.test(t));
  check('每本书都有中文名', noZh.length === 0, noZh.slice(0, 3).join(' / ') || `${shelf.titles.length} 本全有`);
  check('英文原名保留为副标', shelf.titles.some(t => /[A-Za-z]{4,}/.test(t)), shelf.titles[0]);

  /* ---------------- 搜索与筛选 ---------------- */
  await p.type('.lib-search', 'moby');
  await sleep(400);
  const afterSearch = await p.evaluate(() =>
    [...document.querySelectorAll('.lib-book-title')].map(x => x.textContent.trim()));
  check('搜英文书名只剩一本', afterSearch.length === 1 && /Moby Dick/.test(afterSearch[0]),
    afterSearch.join(' / '));

  await clearSearch();
  await sleep(300);
  await p.type('.lib-search', '绿野仙踪');
  await sleep(400);
  const zhHit = await p.evaluate(() => [...document.querySelectorAll('.lib-book-title')].map(x => x.textContent.trim()));
  check('搜中文书名能命中', zhHit.length === 1 && /绿野仙踪/.test(zhHit[0]), zhHit.join(' / '));

  await clearSearch();
  await sleep(300);
  await p.evaluate(() => [...document.querySelectorAll('.lib-chip')].find(x => /石阶巷/.test(x.textContent))?.click());
  await sleep(500);
  const lv1Books = await p.evaluate(() => document.querySelectorAll('.lib-book').length);
  check('按城区筛选后书架变少', lv1Books > 5 && lv1Books < shelf.books, `${lv1Books} 本（全库 ${shelf.books}）`);

  await p.evaluate(() => document.querySelector('.lib-chip')?.click());
  await sleep(400);

  /* ---------------- 目录 ---------------- */
  await p.evaluate(() => {
    [...document.querySelectorAll('.lib-book')].find(x => /三十九级台阶/.test(x.textContent))?.click();
  });
  await p.waitForSelector('.lib-toc', { timeout: 4000 });
  await sleep(300);

  const toc = await p.evaluate(() => {
    const ords = [...document.querySelectorAll('.lib-row .lib-ord')]
      .map(el => +((/(\d+)\//.exec(el.textContent || '') || [])[1] || 0));
    return {
      title: document.querySelector('.lib-toc-title')?.textContent?.trim() ?? '',
      cover: document.querySelector('.lib-toc-cover')?.getAttribute('src') ?? '',
      rows: document.querySelectorAll('.lib-row').length,
      ords,
      shelfGone: !document.querySelector('.lib-shelf'),
    };
  });
  check('点书进目录', /三十九级台阶/.test(toc.title) && toc.shelfGone, toc.title);
  check('目录里带小封面', /\/covers\//.test(toc.cover), toc.cover);
  check('目录列出这本书的全部段落', toc.rows === 30, `${toc.rows} 段`);
  check('同一本书的段号递增', toc.ords.every((n, i) => i === 0 || n >= toc.ords[i - 1]));

  /* ---------------- 阅读页 ---------------- */
  await p.click('.lib-row');
  await p.waitForSelector('.rd-page', { timeout: 6000 });
  await sleep(800);
  const rd = await p.evaluate(() => ({
    title: document.querySelector('.rd-title')?.textContent ?? '',
    pages: document.querySelector('.rd-pageno')?.textContent ?? '',
    body: !!document.querySelector('.rd-body'),
    run: document.querySelector('.rd-run')?.textContent ?? '',
  }));
  check('点条目进入阅读页', /第\s*\d+\/\d+\s*段/.test(rd.title) && rd.body, rd.title.trim().slice(0, 30));
  check('阅读页是分页的', /^\d+\s*\/\s*\d+$/.test(rd.pages.trim()), rd.pages);
  check('书眉带书名与段号', /三十九级台阶/.test(rd.run) && /段/.test(rd.run), rd.run.replace(/\s+/g, ' ').trim());

  await p.evaluate(() => {
    [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '开始打字')?.click();
  });
  await p.waitForSelector('.stage', { timeout: 6000 });
  const inPlay = await p.evaluate(() => document.querySelector('.tbar .ttl')?.textContent ?? '');
  check('阅读页能进打字界面', /第\s*\d+\/\d+\s*段/.test(inPlay), inPlay);

  check('没有运行时错误', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await b.close();
}

console.log(`\n通过 ${pass} · 失败 ${fails.length}`);
process.exit(fails.length ? 1 : 0);
