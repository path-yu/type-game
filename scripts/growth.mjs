import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1440,height:900}});
const p = await b.newPage();
await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list');
await p.evaluate(() => localStorage.clear());
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list');
await sleep(600);

const readVocab = () => p.evaluate(() => {
  const t = document.querySelector('.page-sub')?.textContent || '';
  const m = t.match(/掌握\s*([\d,]+)\s*词/);
  return m ? Number(m[1].replace(/,/g,'')) : -1;
});
const readWpm = () => p.evaluate(() => document.querySelector('.nav-stats')?.textContent || '');

console.log('起始:', await readVocab(), '词');
for (let round = 1; round <= 6; round++) {
  await p.evaluate(() => document.querySelector('.hero .btn-primary')?.click());
  await p.waitForSelector('.stage');
  await sleep(250);
  const text = await p.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
  await p.keyboard.type(text);
  await sleep(1200);
  const r = await p.evaluate(() => ({
    wpm: document.querySelector('.wpm-big')?.textContent?.replace('WPM','') || '',
    stars: document.querySelectorAll('.star:not(.off)').length,
  }));
  await p.evaluate(() => { const btns=[...document.querySelectorAll('.actions .btn')]; (btns.find(x=>x.textContent.includes('回地图'))||btns[0])?.click(); });
  await sleep(700);
  console.log(`第 ${round} 轮: ${r.wpm} WPM · ${r.stars}星 · 掌握 ${await readVocab()} 词`);
}
console.log('顶栏:', (await readWpm()).replace(/\s+/g,' ').trim());
const detail = await p.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  const ms = Object.entries(j.p.mastery);
  const known = ms.filter(([,s]) => s.m >= 70).length;
  const crossed = ms.filter(([,s]) => s.m > 40 && s.seen > 0);
  return { tracked: ms.length, known, sample: crossed.slice(0,5).map(([w,s]) => `${w}:${s.m}`) };
});
console.log('追踪词数:', detail.tracked, '| 已跨过 40 分线:', detail.known, '|', detail.sample.join(' '));
await b.close();
