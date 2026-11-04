/**
 * TypeWake 端到端测试
 * 覆盖：地图 → 打字判定 → 错误处理 → 退格 → 查词暂停 → 结算 → 幽灵 → 夜巡 → 持久化
 */
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.URL || `http://localhost:${process.env.PORT || 4173}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; results.push(`  ✓ ${name}${detail ? '  ' + detail : ''}`); }
  else { fail++; results.push(`  ✗ ${name}${detail ? '  ' + detail : ''}`); }
}
const section = t => results.push(`\n[${t}]`);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push('CONSOLE ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  // 预习卡会盖住打字区，端到端只关心打字判定与结算，先关掉；它有专属测试
  const raw = localStorage.getItem('typewake:v1');
  const j = raw ? JSON.parse(raw) : { p: {}, s: {} };
  j.s = { ...(j.s || {}), pretest: false };
  localStorage.setItem('typewake:v1', JSON.stringify(j));
});
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.dist-list', { timeout: 20000 });
await sleep(600);

/* ---------------- 1. 地图 ---------------- */
section('地图 / 数据加载');
const mapInfo = await page.evaluate(() => ({
  districts: document.querySelectorAll('.dist-row').length,
  chips: document.querySelectorAll('.dist-row').length,
  locked: document.querySelectorAll('.dist-row.locked').length,
  title: document.querySelector('.hero .h-title')?.textContent || '',
  meta: document.querySelector('.hero .h-meta')?.textContent || '',
  head: document.querySelector('.page-sub')?.textContent || '',
}));
check('7 个城区渲染', mapInfo.districts === 7, `${mapInfo.districts} 行`);
check('城区列表 7 行', mapInfo.chips === 7);
check('初始仅 1 区解锁（6 区锁定）', mapInfo.locked === 6, `${mapInfo.locked} 锁定`);
check('推荐卡片有内容', mapInfo.title.length > 3, mapInfo.title);
check('卡片显示生词与目标 WPM', /生词\s*\d+/.test(mapInfo.meta) && /WPM/.test(mapInfo.meta), mapInfo.meta.trim().replace(/\s+/g, ' '));

/* ---------------- 2. 进入打字 ---------------- */
section('打字判定');
await page.click('.hero .btn-primary');
await page.waitForSelector('.stage');
  // 预习卡会盖住打字区：测试里统一跳过（它有自己的专项测试）
  await sleep(350);
  if (await page.$('.pre')) {
    await page.evaluate(() => document.querySelector('.pre-skip')?.click());
    await sleep(300);
  }

await sleep(400);

const text = await page.evaluate(() =>
  [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join('')
);
check('文本已渲染', text.length > 200, `${text.length} 字符`);

const stateNow = () => page.evaluate(() => ({
  done: document.querySelectorAll('.stage .ch.done').length,
  err: document.querySelectorAll('.stage .ch.err').length,
  combo: Number(document.querySelector('.metrics .v')?.textContent || 0),
  prog: document.querySelector('.progress i')?.style.width || '0%',
  caret: document.querySelector('.caret')?.style.transform || '',
  // 光带按段位分 s1/s2/s3（顺流/共鸣/无我），不再是单一的 on —— 30+ 时至少是 s1
  rail: /\bs[123]\b/.test(document.querySelector('.rail')?.className ?? ''),
  clock: document.querySelector('.clock')?.textContent || '',
}));

// 正确打 8 个字符
await page.keyboard.type(text.slice(0, 8));
await sleep(80);
let st = await stateNow();
check('正确输入 → 字符变暗', st.done === 8, `done=${st.done}`);

/*
 * 连击的记账比"字符变暗"晚一拍：done 是逐键直改 DOM，combo 走的是 React 那边。
 * 机器忙的时候（比如整套测试连着跑）80ms 不够，会读到少一个的中间值。
 * 这不是功能问题 —— 单独跑永远是 8 —— 所以等它落定，而不是把断言放宽。
 */
if (st.combo !== 8) {
  for (let i = 0; i < 10 && st.combo !== 8; i++) {
    await sleep(50);
    st = await stateNow();
  }
}
check('连击累加', st.combo === 8, `combo=${st.combo}`);

// 故意打错
const wrongChar = text[8] === 'x' ? 'q' : 'x';
await page.keyboard.type(wrongChar);
await sleep(120);
const afterErr = await stateNow();
check('打错 → 出现红色错误标记', afterErr.err === 1, `err=${afterErr.err}`);
check('打错不推进（已打字符数不变）', afterErr.done === 8, `done=${afterErr.done}`);
check('打错 → 连击掉层不清零', afterErr.combo === 0, `combo=${afterErr.combo}（8-30 归零，符合规则）`);

// 改对
await page.keyboard.type(text[8]);
await sleep(120);
const afterFix = await stateNow();
check('改对 → 错误标记消失并推进', afterFix.err === 0 && afterFix.done === 9, `done=${afterFix.done}, err=${afterFix.err}`);

// 退格
await page.keyboard.press('Backspace');
await page.keyboard.press('Backspace');
await sleep(120);
const afterBack = await stateNow();
check('退格 → 字符回退', afterBack.done === 7, `done=${afterBack.done}`);

// 继续打，制造连击
await page.keyboard.type(text.slice(7, 120));
await sleep(150);
st = await stateNow();
check('连击达到 30+ 触发光带', st.combo >= 30 && st.rail === true, `combo=${st.combo}, rail=${st.rail}`);
check('进度条随输入增长', parseFloat(st.prog) > 5, st.prog);

/* ---------------- 3. 查词 ---------------- */
section('查词卡片 / 计时暂停');
const clockBefore = (await stateNow()).clock;
await page.evaluate(() => {
  const w = document.querySelectorAll('.stage .w')[3];
  w.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(500);
const cardOpen = await page.evaluate(() => {
  const c = document.querySelector('.card');
  if (!c) return null;
  return {
    word: c.querySelector('.hw')?.textContent || '',
    ipa: c.querySelector('.ipa')?.textContent || '',
    zh: c.querySelector('.zh')?.textContent || '',
    hasSpeak: !!c.querySelector('.spk button'),
    btns: [...c.querySelectorAll('.ft button')].map(b => b.textContent),
  };
});
check('点击词 → 弹出词卡', !!cardOpen, cardOpen ? cardOpen.word : '');
check('词卡含音标', !!cardOpen && cardOpen.ipa.includes('/'), cardOpen?.ipa);
check('词卡含中文释义', !!cardOpen && cardOpen.zh.length > 1, cardOpen?.zh.split('\n')[0]);
check('词卡有发音按钮', !!cardOpen && cardOpen.hasSpeak);
check('词卡有收藏按钮', !!cardOpen && cardOpen.btns.some(t => t.includes('收藏')));

const clockPaused = await page.evaluate(() => document.querySelector('.clock')?.textContent);
await sleep(1600);
const clockStill = await page.evaluate(() => document.querySelector('.clock')?.textContent);
check('查词时计时暂停', clockPaused === clockStill, `${clockBefore} → ${clockPaused} → ${clockStill}`);

// 打字被拦截
const before = (await stateNow()).done;
await page.keyboard.type('abc');
await sleep(120);
const duringCard = (await stateNow()).done;
check('词卡打开时打字被拦截', duringCard === before, `done=${duringCard}`);

await page.keyboard.press('Escape');
await sleep(250);
const cardClosed = await page.evaluate(() => !document.querySelector('.card'));
check('Esc 关闭词卡', cardClosed);
const resumeClock = await page.evaluate(() => document.querySelector('.clock')?.textContent);
await sleep(1200);
const resumeClock2 = await page.evaluate(() => document.querySelector('.clock')?.textContent);
check('关闭后计时恢复', resumeClock2 !== resumeClock, `${resumeClock} → ${resumeClock2}`);

// 点外部关闭
await page.evaluate(() => {
  document.querySelectorAll('.stage .w')[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(350);
const openedAgain = await page.evaluate(() => !!document.querySelector('.card'));
await page.evaluate(() => {
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
});
await sleep(300);
const closedByOutside = await page.evaluate(() => !document.querySelector('.card'));
check('点外部关闭词卡', openedAgain && closedByOutside);

// 点到另一个词：应换词而不是关掉
await page.evaluate(() => {
  const ws = document.querySelectorAll('.stage .w');
  const first = ws[3];
  first.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(320);
const wordBefore = await page.evaluate(() => document.querySelector('.card .hw')?.textContent || '');
await page.evaluate(() => {
  const w = document.querySelectorAll('.stage .w')[9];
  w.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  w.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(350);
const afterSwitch = await page.evaluate(() => {
  const c = document.querySelector('.card');
  return { open: !!c, word: c?.querySelector('.hw')?.textContent || '' };
});
check('点另一个词直接换词', afterSwitch.open && afterSwitch.word !== wordBefore, `${wordBefore} → ${afterSwitch.word}`);

await page.keyboard.press('Escape');
await sleep(250);

/* ---------------- 4. 打完 → 结算 ---------------- */
section('结算');
const typedSoFar = await page.evaluate(() => document.querySelectorAll('.stage .ch.done').length);
await page.keyboard.type(text.slice(typedSoFar));
await sleep(1400);

const result = await page.evaluate(() => {
  if (!document.querySelector('.result')) return null;
  const chips = [...document.querySelectorAll('.chip')].map(c => c.textContent.trim());
  return {
    wpm: document.querySelector('.wpm-big')?.textContent || '',
    sub: document.querySelector('.sub')?.textContent || '',
    starsOn: document.querySelectorAll('.star:not(.off)').length,
    panels: [...document.querySelectorAll('.panel .ph')].map(x => x.textContent),
    chips: chips.slice(0, 4),
    district: document.querySelector('.district-line')?.textContent || '',
    actions: [...document.querySelectorAll('.actions .btn')].map(b => b.textContent.replace('Enter', '')),
  };
});
check('完成全文 → 进入结算页', !!result);
if (result) {
  check('WPM 已计算', /[1-9]/.test(result.wpm), result.wpm.replace('WPM', ''));
  check('显示准确率与一致性', result.sub.includes('准确率') && result.sub.includes('一致性'), result.sub.replace(/\s+/g, ' ').trim());
  check('星级 1-3', result.starsOn >= 1 && result.starsOn <= 3, `${result.starsOn} 星`);
  check('本局新词面板', result.panels.some(p => p.includes('本局新词')), result.panels.join(' / '));
  check('新词可点击发音', result.chips.length > 0, result.chips.join(' · '));
  check('城区进度更新', /已点亮\s*[1-9]/.test(result.district), result.district.replace(/\s+/g, ' ').trim());
  check('三个出口按钮', result.actions.length === 3, result.actions.join(' / '));
}

/* ---------------- 5. 持久化 ---------------- */
section('持久化');
const saved = await page.evaluate(() => {
  const raw = localStorage.getItem('typewake:v1');
  if (!raw) return null;
  const j = JSON.parse(raw);
  return { mastery: Object.keys(j.p.mastery || {}).length, played: Object.keys(j.p.played || {}).length, runs: j.p.runs, wpm: j.p.totalSeconds };
});
check('进度写入本地存储', !!saved);
check('掌握度已记录单词', saved && saved.mastery >= 5, `${saved?.mastery} 个词`);
check('已玩条目计数', saved && saved.played >= 1, `${saved?.played} 条`);
check('累计时长记录', saved && saved.wpm > 0, `${saved?.wpm} 秒`);

/* ---------------- 6. 幽灵竞速 ---------------- */
section('幽灵竞速');
const lastId = await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  const g = j.p.ghost;
  return g ? Object.keys(g)[0] : null;
});
check('幽灵时间轴已保存', !!lastId, lastId || '');

/* ---------------- 7. 夜巡 ---------------- */
section('夜巡复习');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('夜巡'));
  b && b.click();
});
await sleep(900);
const rv = await page.evaluate(() => ({
  hasCard: !!document.querySelector('.rv-card'),
  empty: !!document.querySelector('.empty'),
  hasPlay: !!document.querySelector('.rv-play'),
  slots: document.querySelectorAll('.rv-slot').length,
  counter: document.querySelector('.rv-top span')?.textContent || '',
}));
check('夜巡渲染（听写模式）', rv.hasCard || rv.empty, rv.counter);
check('听写有播放键与字母槽', rv.hasPlay && rv.slots > 0, `${rv.slots} 槽`);

if (rv.slots > 0) {
  // 故意打错
  await page.keyboard.type('zzz');
  await sleep(200);
  const wrongState = await page.evaluate(() => ({
    errSlots: document.querySelectorAll('.rv-slot.e').length,
    typed: [...document.querySelectorAll('.rv-slot')].map(s => s.textContent).join(''),
  }));
  check('夜巡输入逐字回显', wrongState.typed.length > 0, `"${wrongState.typed}"`);
  check('夜巡错字标红', wrongState.errSlots > 0, `${wrongState.errSlots} 个错误槽`);
}

/* ---------------- 8. 藏书阁 ---------------- */
section('藏书阁');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('藏书阁'));
  b && b.click();
});
await sleep(700);
const lex = await page.evaluate(() => ({
  count: document.querySelectorAll('.wcard').length,
  big: document.querySelector('.bignum')?.textContent || '',
  filters: document.querySelectorAll('.filter-btn').length,
  tiers: document.querySelectorAll('.stack i').length,
}));
check('词汇卡片渲染', lex.count > 0, `${lex.count} 张`);
check('词汇量数字显示', /[0-9]/.test(lex.big), lex.big);
check('四个筛选标签', lex.filters === 4);
check('Tier 分层条 5 段', lex.tiers === 5);

/* ---------------- 9. 刷新后保持 ---------------- */
section('刷新后状态');
/*
 * 现在有路由了：刷新停在原屏，不再一律弹回首页。
 * 所以这里分两步验 —— 先确认"刷新没把人踢走"，再回地图看进度。
 */
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.lex', { timeout: 8000 }).catch(() => {});
await sleep(500);
const stayed = await page.evaluate(() => ({
  hash: location.hash,
  title: document.querySelector('.page-title')?.textContent?.trim() ?? '',
  side: document.querySelectorAll('.side-item').length,
}));
check('刷新后停在原来那一屏', stayed.hash === '#/lexicon' && stayed.side > 0,
  `${stayed.hash} · ${stayed.title || '藏书阁'} · 侧栏 ${stayed.side}`);

await page.evaluate(() => { location.hash = '#/map'; });
await page.waitForSelector('.dist-list');
await sleep(700);
const after = await page.evaluate(() => ({
  head: document.querySelector('.page-sub')?.textContent || '',
  nav: document.querySelector('.side-foot')?.textContent || '',
}));
check('刷新后进度不丢', /完成\s*[1-9]/.test(after.head), after.head.replace(/\s+/g, ' ').trim());
check('顶栏统计更新', /[1-9]/.test(after.nav), after.nav.replace(/\s+/g, ' ').trim());

/* ---------------- 结果 ---------------- */
console.log(results.join('\n'));
console.log(`\n${'='.repeat(52)}`);
console.log(`通过 ${pass} · 失败 ${fail}`);
if (errors.length) {
  console.log('\n运行时错误:');
  [...new Set(errors)].slice(0, 6).forEach(e => console.log('  ! ' + e.slice(0, 160)));
} else {
  console.log('运行时错误: 0');
}
await browser.close();
process.exit(fail > 0 ? 1 : 0);
