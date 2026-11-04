/**
 * 阅读页：从文库点进去应该先能看文章，而不是直接开打。
 *
 * 这条改动的来由：文库原来点一行直接进打字页，想「先看看这篇讲什么」的人没路可走。
 * 所以这里的断言重点不是「有个新页面」，而是三件事：
 *   1. 进来是阅读页，不是打字页
 *   2. 译文渲染在对应英文句子的下方（不是堆在文末、不是浮在别处）
 *   3. 从这里还能进打字页 —— 阅读不是把练习的路堵死
 *
 * 用法：node scripts/test-reader.mjs（预览服务默认 4173，可用 PORT 覆盖）
 */
import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1280, height: 960, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto(`http://localhost:${process.env.PORT || 4173}/`, { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await sleep(700);

/*
 * 进文库后是书架，不是列表 —— 得先点一本书才能看到段落。
 * 统一从这里进：书架 → 第一本书 → 第一篇。
 */
const openLibrary = async () => {
  await page.evaluate(() => {
    [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('文库'))?.click();
  });
  await page.waitForSelector('.lib-shelf');
  await page.evaluate(() => document.querySelector('.lib-book')?.click());
  await page.waitForSelector('.lib-row');
  await sleep(400);
};

await openLibrary();

// —— 点一行，应该进阅读页 ——
const firstText = await page.evaluate(() => document.querySelector('.lib-row .lib-text')?.textContent ?? '');
await page.evaluate(() => document.querySelector('.lib-row')?.click());
await page.waitForSelector('.rd-body', { timeout: 6000 });
await sleep(600);

const entered = await page.evaluate(() => ({
  reader: !!document.querySelector('.rd-body'),
  typing: !!document.querySelector('.stage-area'),
  title: document.querySelector('.rd-title')?.textContent?.trim() ?? '',
  sub: document.querySelector('.page-sub')?.textContent?.trim() ?? '',
}));
check('从文库点进去是阅读页，不是打字页', entered.reader && !entered.typing, entered.title.slice(0, 28));
check('标题显示书名与段号', /第 \d+\/\d+ 段/.test(entered.title), entered.title);
check('标题里的书名是中文', /[\u4e00-\u9fa5]/.test(entered.title.split('·')[0]), entered.title.split('·')[0].trim());

// 全文：句数要和页头自报的一致
const body = await page.evaluate(() => ({
  sents: document.querySelectorAll('.rd-sent').length,
  en: document.querySelectorAll('.rd-en').length,
  claim: Number((/·\s*(\d+)\s*句/.exec(document.querySelector('.page-sub')?.textContent ?? '') ?? [])[1] ?? 0),
  words: document.querySelectorAll('.rd-w').length,
}));
check('正文渲染了全部句子', body.sents > 0 && body.sents === body.en && body.sents === body.claim,
  `${body.sents} 句 / 页头说 ${body.claim} 句`);
check('正文按词切分（可点词）', body.words > body.sents * 3, `${body.words} 个词`);

// —— 译文：在每句英文的下方，且贴着同一句 ——
await page.waitForSelector('.rd-zh', { timeout: 8000 });
const zh = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.rd-sent')];
  const geo = rows.map(s => {
    const en = s.querySelector('.rd-en')?.getBoundingClientRect();
    const zh = s.querySelector('.rd-zh')?.getBoundingClientRect();
    return en && zh ? { below: zh.top >= en.bottom - 1, sameCol: Math.abs(zh.left - en.left) < 24, gap: Math.round(zh.top - en.bottom) } : null;
  }).filter(Boolean);
  return {
    n: document.querySelectorAll('.rd-zh').length,
    all: geo.length,
    below: geo.every(g => g.below),
    sameCol: geo.every(g => g.sameCol),
    maxGap: Math.max(...geo.map(g => g.gap)),
    sample: document.querySelector('.rd-zh')?.textContent?.slice(0, 30) ?? '',
  };
});
check('每句都配了译文', zh.n === body.sents, `${zh.n} / ${body.sents}`);
check('译文在对应英文句子的下方', zh.below, `最大间距 ${zh.maxGap}px`);
check('译文与英文左对齐在同一栏', zh.sameCol, zh.sample);

// —— 切换中英 / 原文 ——
await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '中英')?.click();
});
await sleep(350);
const off = await page.evaluate(() => ({
  zh: document.querySelectorAll('.rd-zh').length,
  label: [...document.querySelectorAll('.rd-head-acts .btn')].map(x => x.textContent.trim()),
  sents: document.querySelectorAll('.rd-sent').length,
}));
check('关掉译文只留原文', off.zh === 0 && off.sents === body.sents, `${off.zh} 条译文 / ${off.sents} 句`);
check('按钮切到「原文」', off.label.includes('原文'), off.label.join(' '));

await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '原文')?.click();
});
await page.waitForSelector('.rd-zh', { timeout: 4000 });
check('再点能切回中英', (await page.evaluate(() => document.querySelectorAll('.rd-zh').length)) === body.sents);

// —— 生词标记与点词查义 ——
const hard = await page.evaluate(() => ({
  n: document.querySelectorAll('.rd-w.hard').length,
  words: [...document.querySelectorAll('.rd-w.hard')].slice(0, 4).map(x => x.textContent),
  underlined: (() => {
    const el = document.querySelector('.rd-w.hard');
    if (!el) return '';
    const cs = getComputedStyle(el);
    return `${cs.textDecorationLine} ${cs.textDecorationStyle}`;
  })(),
}));
check('生词带下划线标记', hard.n > 0 && /underline/.test(hard.underlined), `${hard.n} 个 · ${hard.words.join(' ')}`);

await page.evaluate(() => document.querySelector('.rd-w.hard')?.click());
await page.waitForSelector('.card', { timeout: 4000 });
const cardInfo = await page.evaluate(() => ({
  shown: !!document.querySelector('.card'),
  word: document.querySelector('.card .hw')?.textContent ?? '',
  gloss: document.querySelector('.card .zh')?.textContent?.slice(0, 20) ?? '',
}));
check('点生词弹出词卡', cardInfo.shown && cardInfo.word.length > 0, `${cardInfo.word} / ${cardInfo.gloss}`);
await page.keyboard.press('Escape');
await sleep(250);

// —— 分页：一屏一页，翻页而不是滚动 ——
const pager = await page.evaluate(() => {
  const pageEl = document.querySelector('.rd-page');
  const bodyEl = document.querySelector('.rd-body');
  return {
    label: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
    pageH: pageEl?.clientHeight ?? 0,
    bodyH: bodyEl?.clientHeight ?? 0,
    flowW: bodyEl?.scrollWidth ?? 0,
    viewW: pageEl?.clientWidth ?? 1,
    run: document.querySelector('.rd-run')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  };
});
check('阅读页带页码', /^\d+ \/ \d+$/.test(pager.label), pager.label);
check('正文高度等于书页高度（不靠滚动）', Math.abs(pager.bodyH - pager.pageH) <= 1, `${pager.bodyH} / ${pager.pageH}`);
check('正文按页宽分栏', pager.viewW > 0 && pager.flowW > 0 && pager.flowW % pager.viewW < pager.viewW * 0.2,
  `${pager.flowW}px 内容 / ${pager.viewW}px 页宽`);
check('书眉带书名', /[\u4e00-\u9fa5]/.test(pager.run), pager.run.slice(0, 26));

const beforeTurn = await page.evaluate(() => ({
  page: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
  title: document.querySelector('.rd-title')?.textContent?.trim() ?? '',
}));
await page.keyboard.press('ArrowRight');
await sleep(450);
const afterTurn = await page.evaluate(() => ({
  page: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
  title: document.querySelector('.rd-title')?.textContent?.trim() ?? '',
}));
check('→ 键能翻页（或翻到下一段）', afterTurn.page !== beforeTurn.page || afterTurn.title !== beforeTurn.title,
  `${beforeTurn.page} → ${afterTurn.page}`);

// 翻回第一页：同一篇按页退，换篇了按篇退
await page.keyboard.press('ArrowLeft');
await sleep(500);
const backToStart = await page.evaluate(() => ({
  page: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
  title: document.querySelector('.rd-title')?.textContent?.trim() ?? '',
}));
check('← 键能退回上一页', backToStart.page === beforeTurn.page || backToStart.title === beforeTurn.title,
  `${afterTurn.page} → ${backToStart.page}`);

// —— 段间导航 ——
const beforeTitle = await page.evaluate(() => document.querySelector('.rd-title')?.textContent ?? '');
const jumped = await page.evaluate(() => {
  const next = document.querySelector('.rd-navbtn.next');
  if (!next || next.disabled) return false;
  next.click();
  return true;
});
await sleep(900);
const afterTitle = await page.evaluate(() => document.querySelector('.rd-title')?.textContent ?? '');
check('可以顺着一本书往下读', jumped && afterTitle !== beforeTitle, `${beforeTitle.slice(0, 20)} → ${afterTitle.slice(0, 20)}`);

// —— 从阅读页进打字 ——
await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '开始打字')?.click();
});
await page.waitForSelector('.stage-area', { timeout: 6000 });
const typing = await page.evaluate(() => ({
  stage: !!document.querySelector('.stage-area'),
  reader: !!document.querySelector('.rd-body'),
}));
check('阅读页能进打字页', typing.stage && !typing.reader);

// —— 返回：从阅读进来的，退出去应该回阅读页，不是回地图 ——
await page.evaluate(() => document.querySelector('.tbar .icon-btn')?.click());
await page.waitForSelector('.rd-body', { timeout: 6000 });
const back = await page.evaluate(() => ({
  reader: !!document.querySelector('.rd-body'),
  title: document.querySelector('.rd-title')?.textContent ?? '',
}));
check('从阅读页进打字，退出回到阅读页', back.reader && back.title === afterTitle.slice(0, back.title.length), back.title.slice(0, 24));

// 地图进来的仍然回地图
await page.evaluate(() => {
  [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('城市'))?.click();
});
await page.waitForSelector('.hero', { timeout: 6000 });
await sleep(400);
await page.evaluate(() => document.querySelector('.hero .btn-primary')?.click());
await page.waitForSelector('.stage-area', { timeout: 8000 });
await page.evaluate(() => document.querySelector('.tbar .icon-btn')?.click());
await page.waitForSelector('.hero', { timeout: 6000 });
check('从地图进的打字仍然回地图', await page.evaluate(() => !!document.querySelector('.hero')));

// —— 全书阅读：只对 100% 翻完的书开放 ——
await page.evaluate(() => {
  [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('文库'))?.click();
});
await page.waitForSelector('.lib-shelf', { timeout: 6000 });
await page.evaluate(() => {
  [...document.querySelectorAll('.lib-book')].find(x => /爱丽丝/.test(x.textContent))?.click();
});
await page.waitForSelector('.lib-row', { timeout: 4000 });
await page.evaluate(() => document.querySelector('.lib-row')?.click());
await page.waitForSelector('.rd-page', { timeout: 6000 });
await sleep(700);

const hasEntry = await page.evaluate(() =>
  [...document.querySelectorAll('.rd-head-acts .btn')].some(x => x.textContent.trim() === '读全书'));
check('翻完的书有「读全书」入口', hasEntry);

await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '读全书')?.click();
});
await page.waitForSelector('.rd-page', { timeout: 8000 });
await sleep(1200);

const full = await page.evaluate(() => ({
  title: document.querySelector('.rd-title')?.textContent?.trim() ?? '',
  run: document.querySelector('.rd-run')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  sents: document.querySelectorAll('.rd-sent').length,
  zh: document.querySelectorAll('.rd-zh').length,
  pages: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
  flowW: document.querySelector('.rd-body')?.scrollWidth ?? 0,
  viewW: document.querySelector('.rd-page')?.clientWidth ?? 1,
}));
const pageN = +(full.pages.match(/\/\s*(\d+)/)?.[1] ?? 0);
const total = +(full.title.match(/(\d+)\s*句/)?.[1] ?? 0);
/*
 * 全书阅读是分批挂载的：首屏只排前几百句，翻到接近末尾再接下一批。
 * 一次性把近万句流进一个多栏容器，排版要十几秒、内存四百多兆 ——
 * 所以这里断言的是"首屏轻、总数对、翻页会接着长"，不是"一次全渲染"。
 */
check('全书首批只挂一部分（首屏要快）', full.sents >= 300 && full.sents <= 600, `${full.sents} 句`);
check('书眉报的是整本句数', total > 1000, `${total} 句`);
check('全书每句都配了译文', full.zh === full.sents, `${full.zh} / ${full.sents}`);
check('全书分成了很多屏', pageN > 20, full.pages);
check('书眉标出这是全书', /全书/.test(full.run), full.run.slice(0, 24));

await page.keyboard.press('ArrowRight');
await sleep(400);
const turned = await page.evaluate(() => document.querySelector('.rd-pageno')?.textContent?.trim() ?? '');
check('全书模式能翻页', turned !== full.pages, `${full.pages} → ${turned}`);

/* 翻到已挂载部分的末尾，应当自动接上下一批 */
await page.evaluate(async () => {
  const next = document.querySelector('.rd-turn.next');
  for (let i = 0; i < 120 && next && !next.disabled; i++) {
    next.click();
    await new Promise(r => setTimeout(r, 8));
  }
});
await sleep(1200);
const grown = await page.evaluate(() => ({
  sents: document.querySelectorAll('.rd-sent').length,
  pages: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
}));
check('翻到末尾会接着挂载后面的句子', grown.sents > full.sents, `${full.sents} → ${grown.sents} 句`);

/* ---------- 目录 / 滚动 / 刷新 ---------- */
await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(b => b.textContent.trim() === '目录')?.click();
});
await sleep(400);
const toc = await page.evaluate(() => ({
  open: !!document.querySelector('.rd-toc'),
  n: document.querySelectorAll('.rd-toc-item').length,
  first: document.querySelector('.rd-toc-label')?.textContent?.trim() ?? '',
}));
check('全书有目录', toc.open && toc.n > 0, `${toc.n} 章 · 首条 ${toc.first}`);

/* 点最后一章，应当翻到后面去（不是停在第一屏） */
const tocJump = await page.evaluate(async () => {
  const items = [...document.querySelectorAll('.rd-toc-item')];
  items[items.length - 1].click();
  await new Promise(r => setTimeout(r, 700));
  return document.querySelector('.rd-pageno')?.textContent?.trim() ?? '';
});
check('目录能跳章（跳到最后一章）', !tocJump.startsWith('1 /'), tocJump);

/* 切到滚动模式 */
await page.evaluate(() => {
  [...document.querySelectorAll('.rd-head-acts .btn')].find(b => ['翻页', '滚动'].includes(b.textContent.trim()))?.click();
});
await sleep(800);
const sc = await page.evaluate(() => ({
  has: !!document.querySelector('.rd-scroll'),
  sents: document.querySelectorAll('.rd-scroll .rd-sent').length,
  pct: document.querySelector('.rd-pageno')?.textContent?.trim() ?? '',
}));
check('能切到竖向滚动', sc.has && sc.sents > 0, `${sc.sents} 句 · ${sc.pct}`);

/* 滚到底会接下一批 */
const grew = await page.evaluate(async () => {
  const el = document.querySelector('.rd-scroll');
  const before = el.querySelectorAll('.rd-sent').length;
  el.scrollTop = el.scrollHeight;
  await new Promise(r => setTimeout(r, 1200));
  return [before, el.querySelectorAll('.rd-sent').length];
});
/* 这本书本来就不长时，跳到最后一章就已经全挂上了 —— 那种情况也算过 */
check('滚动到底会接着挂载', grew[1] > grew[0] || grew[1] === total, `${grew[0]} → ${grew[1]} 句（全书 ${total}）`);

/* 刷新停在原地：全书阅读是文库的子状态，地址要能恢复 */
const hashBefore = await page.evaluate(() => location.hash);
await page.reload({ waitUntil: 'networkidle2' });
await sleep(1500);
const afterReload = await page.evaluate(() => ({
  hash: location.hash,
  isFull: !!document.querySelector('.rd-scroll') || !!document.querySelector('.rd-page'),
}));
check('刷新后还在全书阅读里', afterReload.hash.startsWith('#/full/') && afterReload.isFull,
  `${hashBefore} → ${afterReload.hash}`);

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
