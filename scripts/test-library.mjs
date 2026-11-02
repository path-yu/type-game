// 文库页：库里 1179 篇必须能被看到。
// 之前城市页只有 7 行城区，每行写「0/8」，看着像总共 56 篇。
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

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.hero');
  await sleep(500);

  const entry = await p.evaluate(() => document.querySelector('.ghost-btn')?.textContent ?? '');
  check('城市页有全库入口', /全部\s*\d+\s*篇/.test(entry), entry || '（无）');

  await p.click('.ghost-btn');
  await p.waitForSelector('.lib', { timeout: 5000 });
  await sleep(800);

  const head = await p.evaluate(() => document.querySelector('.page-sub')?.textContent ?? '');
  const total = +(/(\d+)\s*篇/.exec(head) || [])[1] || 0;
  check('顶部标出总篇数', total > 1000, head);

  const rows = await p.evaluate(() => document.querySelectorAll('.lib-row').length);
  check('列表真的渲染了全部文章', rows === total, `${rows} 行 / 共 ${total} 篇`);

  const books = await p.evaluate(() => document.querySelectorAll('.lib-book').length);
  check('按来源分组', books > 30, `${books} 组`);

  // 书内按原文顺序：任意一本书的段号应当递增
  const sorted = await p.evaluate(() => {
    const nums = [...document.querySelector('.lib-book')?.querySelectorAll('.lib-ord') ?? []]
      .map(el => +((/(\d+)\//.exec(el.textContent || '') || [])[1] || 0));
    return nums.every((n, i) => i === 0 || n >= nums[i - 1]);
  });
  check('同一本书的段号递增', sorted, sorted ? '' : '出现回退');

  // 搜索
  await p.type('.lib-search', 'moby');
  await sleep(500);
  const afterSearch = await p.evaluate(() => ({
    books: [...document.querySelectorAll('.lib-book-title')].map(x => x.textContent),
    rows: document.querySelectorAll('.lib-row').length,
  }));
  check('搜书名只剩一本', afterSearch.books.length === 1 && /Moby Dick/.test(afterSearch.books[0]), afterSearch.books.join(' / '));
  check('搜索结果条数合理', afterSearch.rows > 50, `${afterSearch.rows} 行`);

  // 清空搜索 → 按城区筛选
  await p.evaluate(() => {
    const el = document.querySelector('.lib-search');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(400);
  await p.evaluate(() => [...document.querySelectorAll('.lib-chip')].find(x => /石阶巷/.test(x.textContent))?.click());
  await sleep(500);
  const lv1 = await p.evaluate(() => document.querySelectorAll('.lib-row').length);
  check('按城区筛选有效', lv1 > 100 && lv1 < total, `${lv1} 篇（全库 ${total}）`);

  const allL1 = await p.evaluate(() => {
    const badges = [...document.querySelectorAll('.lib-row .lib-meta em')].map(x => x.textContent);
    return badges.every(t => t === 'L1');
  });
  check('筛选结果全是一级', allL1);

  // —— 书名要能看懂：中文为主，英文原名做副标 ——
  // 回到「全部」：要在全库口径下检查 44 本都有中文名
  await p.evaluate(() => {
    const el = document.querySelector('.lib-search');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.lib-chip')?.click();
  });
  await sleep(600);
  const shelf = await p.evaluate(() => ({
    titles: [...document.querySelectorAll('.lib-book-title')].map(x => x.textContent.trim()),
    head: document.querySelector('.page-sub')?.textContent ?? '',
  }));
  const noZh = shelf.titles.filter(t => !/[\u4e00-\u9fa5]/.test(t));
  check('每本书都有中文名', noZh.length === 0, noZh.slice(0, 3).join(' / ') || `${shelf.titles.length} 本全有`);
  check('页头说的是「书」不是「来源」', /\d+ 本书/.test(shelf.head), shelf.head.trim());
  check('英文原名保留为副标',
    shelf.titles.some(t => /[A-Za-z]{4,}/.test(t)), shelf.titles[0]);

  // 中文书名也要搜得到
  await p.type('.lib-search', '绿野仙踪');
  await sleep(500);
  const zhHit = await p.evaluate(() => ({
    books: [...document.querySelectorAll('.lib-book-title')].map(x => x.textContent.trim()),
    rows: document.querySelectorAll('.lib-row').length,
  }));
  check('搜中文书名能命中', zhHit.books.length === 1 && /绿野仙踪/.test(zhHit.books[0]), `${zhHit.books[0]} · ${zhHit.rows} 行`);
  await p.evaluate(() => {
    const el = document.querySelector('.lib-search');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(400);

  // 点一篇先进阅读页（看全文与译文），再从那里进打字
  await p.click('.lib-row');
  await p.waitForSelector('.rd-body', { timeout: 6000 });
  const inRead = await p.evaluate(() => document.querySelector('.rd-title')?.textContent ?? '');
  check('点条目进入阅读页', /第\s*\d+\/\d+\s*段/.test(inRead) && !!await p.$('.rd-body'), inRead);

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
