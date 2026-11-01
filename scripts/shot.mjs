import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = 'shots';
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none', '--lang=zh-CN'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url()));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('.city', { timeout: 20000 });
await sleep(900);
await page.screenshot({ path: `${OUT}/01-map.png` });

// 进入打字
await page.click('.hero .btn-primary');
await page.waitForSelector('.stage', { timeout: 10000 });
await sleep(600);

// 打一段字，制造连击
const text = await page.$eval('.stage', el => el.innerText);
for (let i = 0; i < 120; i++) {
  const ch = text[i];
  if (!ch) break;
  await page.keyboard.press(ch === ' ' ? 'Space' : ch);
  if (i % 12 === 0) await sleep(6);
}
await sleep(500);
await page.screenshot({ path: `${OUT}/02-play.png` });

// 点词出卡片
const clicked = await page.evaluate(() => {
  const ws = document.querySelectorAll('.w');
  const w = ws[8];
  if (!w) return null;
  w.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return w.dataset.word;
});
console.log('clicked word:', clicked);
if (clicked) {
  await sleep(600);
  console.log('card open:', await page.evaluate(() => !!document.querySelector('.card')));
  await page.screenshot({ path: `${OUT}/03-card.png` });
  await page.keyboard.press('Escape');
  await sleep(300);
}

// 打完
const rest = await page.$eval('.stage', el => el.innerText);
const typedCount = 120;
for (let i = typedCount; i < rest.length; i++) {
  const ch = rest[i];
  if (!ch) break;
  await page.keyboard.press(ch === ' ' ? 'Space' : ch);
  if (i % 20 === 0) await sleep(4);
}
await sleep(1600);
await page.screenshot({ path: `${OUT}/04-result.png` });

// 藏书阁
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.btn-ghost')];
  const b = btns.find(x => x.textContent.includes('藏书阁'));
  b && b.click();
});
await sleep(700);
await page.screenshot({ path: `${OUT}/05-lexicon.png` });

// 夜巡
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('夜巡'));
  b && b.click();
});
await sleep(900);
await page.screenshot({ path: `${OUT}/06-review.png` });

console.log('ERRORS:', errors.length ? errors.slice(0, 8) : 'none');
await browser.close();
