import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{
  localStorage.setItem('typewake:theme','light');
  localStorage.setItem('typewake:v1', JSON.stringify({ p:{ unlocked:7 }, s:{ sentenceHelp:'both' } }));
});
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list'); await sleep(500);
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(500);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text.slice(0,120));
await sleep(700);
const r = await p.evaluate(()=>({
  tr: document.querySelector('.sx-tr')?.textContent || '(无译文)',
  title: document.querySelector('.tbar .ttl')?.textContent,
  gloss: [...document.querySelectorAll('.sx-w')].map(x=>x.textContent),
}));
console.log('文章:', r.title);
console.log('译文:', r.tr);
console.log('生词:', r.gloss.join(' | ') || '(本句无生词)');
await p.screenshot({path:'shots/v18-names.png'});
await b.close();
