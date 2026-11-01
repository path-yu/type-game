import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport: { width: 1320, height: 860, deviceScaleFactor: 2 } });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));

for (const theme of ['light', 'dark']) {
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await p.evaluate(t => localStorage.setItem('typewake:theme', t), theme);
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.dist-list', { timeout: 15000 });
  await sleep(800);
  await p.screenshot({ path: `shots/ui-${theme}-map.png` });

  // 打字页
  await p.click('.hero .btn-primary');
  await p.waitForSelector('.stage');
  await sleep(400);
  const text = await p.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
  await p.keyboard.type(text.slice(0, 150));
  await sleep(500);
  await p.screenshot({ path: `shots/ui-${theme}-play.png` });

  // 点词出卡片
  await p.evaluate(() => {
    const w = document.querySelectorAll('.stage .w')[6];
    w?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(500);
  await p.screenshot({ path: `shots/ui-${theme}-card.png` });
  await p.keyboard.press('Escape');
  await sleep(200);

  // 打完看结算
  const rest = await p.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
  const done = await p.evaluate(() => document.querySelectorAll('.stage .ch.done').length);
  await p.keyboard.type(rest.slice(done));
  await sleep(1500);
  await p.screenshot({ path: `shots/ui-${theme}-result.png` });

  // 词汇册
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('藏书阁'));
    btn?.click();
  });
  await sleep(700);
  await p.screenshot({ path: `shots/ui-${theme}-lexicon.png` });

  // 夜巡
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('夜巡'));
    btn?.click();
  });
  await sleep(700);
  await p.screenshot({ path: `shots/ui-${theme}-review.png` });
}
console.log('errors:', errs.length ? errs.slice(0,3) : 'none');
await b.close();
