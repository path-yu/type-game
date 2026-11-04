import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--mute-audio', '--no-sandbox', '--disable-gpu'], defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => console.log('console.' + m.type(), m.text().slice(0, 200)));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.waitForSelector('.city');
await page.click('.cont-card .btn-primary');
await page.waitForSelector('.stage');
await sleep(500);

const info = await page.evaluate(() => {
  const w = document.querySelectorAll('.w')[6];
  if (!w) return 'no .w';
  const r = w.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return { word: w.dataset.word, rect: [r.x, r.y, r.width, r.height], topEl: el?.className, tag: el?.tagName };
});
console.log('target:', info);

await page.evaluate(() => {
  const w = document.querySelectorAll('.w')[6];
  w.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await sleep(400);
console.log('card after synthetic click:', await page.evaluate(() => !!document.querySelector('.card')));

await page.keyboard.press('Escape');
await sleep(200);

const w = await page.$$('.w');
await w[6].click();
await sleep(400);
console.log('card after real click:', await page.evaluate(() => !!document.querySelector('.card')));
await browser.close();
