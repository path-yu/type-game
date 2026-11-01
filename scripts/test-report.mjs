/**
 * 体检报告：先打三次（故意打错若干键），再看报告是否给出有效结论。
 * 用法：node scripts/test-report.mjs（预览服务需在 4173）
 */
import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.hero');

/** 打一篇，每 17 个字符故意打错一次 */
async function playOnce() {
  await page.click('.hero .btn-primary');
  await page.waitForSelector('.stage');
  await sleep(250);
  const text = await page.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));

  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const wrong = ch.toLowerCase() === 'z' ? 'q' : 'z';
    if (i > 0 && i % 17 === 0) {
      if (buf) { await page.keyboard.type(buf); buf = ''; }
      await page.keyboard.press(wrong);   // 故意打错
    }
    buf += ch;
  }
  if (buf) await page.keyboard.type(buf);
  await sleep(1400);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.actions .btn')];
    (btns.find(x => x.textContent.includes('回地图')) || btns[0])?.click();
  });
  await sleep(600);
}

console.log('[打三次，制造错键数据]');
for (let i = 0; i < 3; i++) await playOnce();

const saved = await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  return {
    history: j.p.history?.length ?? 0,
    keyErr: Object.keys(j.p.keyErr ?? {}).length,
    totalKeys: Object.values(j.p.keyErr ?? {}).reduce((a, b) => a + b, 0),
  };
});
check('成绩历史已记录', saved.history === 3, `${saved.history} 条`);
check('易错键已累计', saved.keyErr > 0 && saved.totalKeys > 0, `${saved.keyErr} 种 / ${saved.totalKeys} 次`);

console.log('\n[体检报告]');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('体检报告'));
  b?.click();
});
await sleep(700);

const rep = await page.evaluate(() => ({
  verdict: document.querySelector('.rep-verdict .rv-title')?.textContent ?? '',
  detail: document.querySelector('.rep-verdict .rv-detail')?.textContent ?? '',
  cards: document.querySelectorAll('.rep-card').length,
  avgs: [...document.querySelectorAll('.rep-big')].map(x => x.textContent),
  sparkLen: (document.querySelector('.spark-line')?.getAttribute('d') ?? '').length,
  keys: document.querySelectorAll('.key-row').length,
  firstKey: document.querySelector('.key-row .key-pair')?.textContent ?? '',
  weak: document.querySelectorAll('.weak-item').length,
  tips: document.querySelectorAll('.rep-tips li').length,
}));

check('给出诊断结论', rep.verdict.length > 2, rep.verdict);
check('结论有解释细节', rep.detail.length > 10, rep.detail.slice(0, 40) + '…');
check('三项核心指标', rep.cards === 3, rep.avgs.join(' / '));
check('WPM 趋势折线有数据', rep.sparkLen > 20, `${rep.sparkLen} 字符路径`);
check('列出易错键', rep.keys > 0, `${rep.keys} 行 · ${rep.firstKey}`);
check('列出反复打错的词', rep.weak > 0, `${rep.weak} 个`);
check('给出练习建议', rep.tips >= 2, `${rep.tips} 条`);

// 刷新后仍在
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('体检报告'));
  b?.click();
});
const reopened = await page.waitForSelector('.rep-verdict', { timeout: 5000 }).then(() => true).catch(() => false);
check('刷新后报告仍可打开', reopened);

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
