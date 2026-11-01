import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:900,deviceScaleFactor:2}});
const p = await b.newPage();
const errs=[]; p.on('pageerror', e=>errs.push(e.message));
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('typewake:theme','light'); });
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.hero'); await sleep(500);
await p.evaluate(()=>[...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('文库'))?.click());
await p.waitForSelector('.lib'); await sleep(900);
const info = await p.evaluate(()=>({
  sub: document.querySelector('.page-sub')?.textContent,
  books: document.querySelectorAll('.lib-book').length,
  rows: document.querySelectorAll('.lib-row').length,
  first: [...document.querySelectorAll('.lib-book')].slice(0,3).map(b=>b.querySelector('.lib-book-title')?.textContent+' · '+b.querySelectorAll('.lib-row').length+'篇'),
}));
console.log(JSON.stringify(info,null,1));
await p.screenshot({path:'shots/v6-library.png'});
console.log('errors:', errs.length?errs.slice(0,3):'none');
await b.close();
