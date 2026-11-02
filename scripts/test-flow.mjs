/**
 * 打字手感的三个机制：连击段位、错字护盾、句末结算。
 *
 * 这三样都不是「多加一个数字」，而是补上原来缺的反馈：
 *   段位 —— 连击从「只会掉」变成「能涨出东西」
 *   护盾 —— 让 50 连击之后的人开始屏住呼吸
 *   句末 —— 一篇文章从三分钟的长镜头，变成每几秒一个反馈点
 *
 * 用法：node scripts/test-flow.mjs（预览服务默认 4173，可用 PORT 覆盖）
 */
import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto(`http://localhost:${process.env.PORT || 4173}/`, { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await sleep(700);

/** 进打字页，返回正文 */
const startTyping = async () => {
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始打字'))?.click();
  });
  await page.waitForSelector('.stage .inner', { timeout: 8000 });
  await sleep(900);
  // 预习卡会挡在前面
  const pre = await page.evaluate(() => !!document.querySelector('.pre-card'));
  if (pre) {
    await page.evaluate(() => {
      [...document.querySelectorAll('.pre-card button, .btn')].find(x => /跳过|开始|知道了/.test(x.textContent))?.click();
    });
    await sleep(700);
  }
  return page.evaluate(() => document.querySelector('.inner')?.textContent ?? '');
};

const read = () => page.evaluate(() => ({
  combo: Number(document.querySelector('.metrics .v')?.textContent?.trim() ?? 0),
  rail: document.querySelector('.rail')?.className ?? '',
  flow: document.querySelector('.flowtag')?.textContent ?? '',
  shields: [...document.querySelectorAll('.shields i')].filter(x => x.classList.contains('on')).length,
  pulse: document.querySelector('.pulse')?.textContent?.trim() ?? '',
}));

const text = await startTyping();
check('进入打字页', text.length > 60, `${text.length} 字符`);

/** 稳稳打 n 个字符（间隔 35ms，快过真人但不至于把 rAF 挤掉） */
const typeSlow = async (from, to) => {
  for (let i = from; i < to; i++) {
    await page.keyboard.type(text[i], { delay: 0 });
    await sleep(35);
  }
};

const seen = { s1: null, s2: null, s3: null };
const grab = async () => {
  const s = await read();
  if (s.rail.includes('s1') && !seen.s1) seen.s1 = s;
  if (s.rail.includes('s2') && !seen.s2) seen.s2 = s;
  if (s.rail.includes('s3') && !seen.s3) seen.s3 = s;
  return s;
};

for (let i = 0; i < Math.min(108, text.length); i++) {
  await page.keyboard.type(text[i], { delay: 0 });
  await sleep(35);
  if (i % 3 === 0) await grab();
}
await grab();
await sleep(200);
await grab();

check('30 连击进入「顺流」', !!seen.s1 && seen.s1.flow === '顺 流', seen.s1 ? seen.s1.rail : '未到');
check('60 连击进入「共鸣」', !!seen.s2 && seen.s2.flow === '共 鸣', seen.s2 ? seen.s2.rail : '未到');
check('100 连击进入「无我」', !!seen.s3 && seen.s3.flow === '无 我', seen.s3 ? seen.s3.rail : '未到');
check('段位越高，连击条越亮越粗',
  !!seen.s1 && !!seen.s3 && / s1$| s1 /.test(seen.s1.rail) && / s3/.test(seen.s3.rail),
  `${seen.s1?.rail} → ${seen.s3?.rail}`);

check('50 连击攒到第 1 颗护盾', (seen.s2?.shields ?? 0) >= 1, `护盾 ${seen.s2?.shields ?? 0}`);
check('100 连击攒满 2 颗', (seen.s3?.shields ?? 0) === 2, `护盾 ${seen.s3?.shields ?? 0}`);

const before = await read();
check('每打完一句给一次结算', before.pulse.includes('第') && /s$|处错/.test(before.pulse), before.pulse);

// —— 护盾挡错：连击不断，护盾少一颗 ——
const wrongChar = text[108] === 'q' ? 'w' : 'q';
await page.keyboard.type(wrongChar, { delay: 0 });
await sleep(260);
const saved = await read();
check('打错时护盾替死', saved.shields === Math.max(0, before.shields - 1), `${before.shields} → ${saved.shields}`);
check('护盾顶住时连击不减', saved.combo >= before.combo, `${before.combo} → ${saved.combo}`);

// —— 护盾耗尽后再错：连击真的掉 ——
if (saved.shields > 0) {
  await page.keyboard.type(wrongChar, { delay: 0 });
  await sleep(240);
}
const afterShield = await read();
if (afterShield.shields === 0) {
  await page.keyboard.type(wrongChar, { delay: 0 });
  await sleep(320);
}
const broken = await read();
check('护盾用完之后，错一下掉 30 连击', broken.combo <= afterShield.combo - 30,
  `${afterShield.combo} → ${broken.combo}`);

await page.screenshot({ path: 'shots/flow-play.png' });

// —— 结算页：完美句数 + 下一步目标 ——
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await sleep(800);
const text2 = await startTyping();
await page.keyboard.type(text2, { delay: 0 });
await page.waitForSelector('.wpm-big', { timeout: 15000 });
await sleep(500);

const result = await page.evaluate(() => ({
  goal: document.querySelector('.goal')?.textContent?.trim() ?? '',
  tag: document.querySelector('.goal-k')?.textContent?.trim() ?? '',
  stars: document.querySelectorAll('.star:not(.off)').length,
  wpm: Number(document.querySelector('.wpm-big')?.textContent?.replace(/\D/g, '') ?? 0),
}));
const m = /完美 (\d+)\/(\d+)/.exec(result.tag);
check('结算页给出完美句数', !!m && Number(m[1]) <= Number(m[2]), result.tag);
check('全对打完时每一句都是完美', !!m && m[1] === m[2], result.tag);
check('结算页给出下一步目标', result.goal.length > 8, result.goal.slice(0, 40));

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
