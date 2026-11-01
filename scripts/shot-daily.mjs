import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
for (const theme of ['light','dark']) {
  await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
  await p.evaluate(t => { localStorage.clear(); localStorage.setItem('typewake:theme', t); }, theme);
  await p.reload({waitUntil:'networkidle2'});
  await p.waitForSelector('.daily-row'); await sleep(600);
  await p.screenshot({path:`shots/daily-${theme}.png`});
}
// 完成后状态
await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
await p.evaluate(() => localStorage.setItem('typewake:theme','light'));
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.daily-row'); await sleep(400);
await p.click('.daily-row');
await p.waitForSelector('.stage'); await sleep(400);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text);
await sleep(1800);
await p.screenshot({path:'shots/daily-result.png'});
await p.evaluate(()=>{ const b=[...document.querySelectorAll('.actions .btn')]; (b.find(x=>x.textContent.includes('回地图'))||b[0])?.click(); });
await sleep(800);
await p.screenshot({path:'shots/daily-done.png'});
await b.close();
