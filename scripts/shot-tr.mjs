import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
const errs=[]; p.on('pageerror', e=>errs.push(e.message));
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{
  localStorage.setItem('typewake:theme','light');
  const raw = localStorage.getItem('typewake:v1');
  const j = raw ? JSON.parse(raw) : { p:{}, s:{} };
  j.s = { ...(j.s||{}), sentenceHelp: 'both' };
  localStorage.setItem('typewake:v1', JSON.stringify(j));
});
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list'); await sleep(500);
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(600);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text.slice(0, 130));
await sleep(700);
const has = await p.evaluate(()=>({
  tr: document.querySelector('.sx-tr')?.textContent || null,
  gloss: [...document.querySelectorAll('.sx-w')].map(x=>x.textContent).slice(0,4),
}));
console.log('译文:', has.tr);
console.log('生词:', has.gloss);
await p.screenshot({path:'shots/v4-both.png'});
console.log('errors:', errs.length?errs.slice(0,3):'none');
await b.close();
