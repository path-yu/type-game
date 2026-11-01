import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
const errs=[]; p.on('pageerror', e=>errs.push(e.message));

await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{ localStorage.setItem('typewake:theme','light'); });
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list'); await sleep(600);

await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(400);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text.slice(0,90));
await sleep(600);
await p.screenshot({path:'shots/v4-gloss.png'});

// 找一个变形词（界面词 ≠ 原形）
const inflected = await p.evaluate(()=>{
  const el = [...document.querySelectorAll('.stage .w')].find(w =>
    w.dataset.word && w.dataset.word.toLowerCase().replace(/[^a-z']/g,'') !== w.dataset.key);
  if (!el) return null;
  el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  return { surface: el.dataset.word, key: el.dataset.key };
});
await sleep(600);
const card = await p.evaluate(()=>{
  const c = document.querySelector('.card');
  if(!c) return null;
  return { hw: c.querySelector('.hw')?.textContent, lemma: c.querySelector('.lemma')?.textContent || null };
});
console.log('词形对照:', JSON.stringify(inflected), '→ 卡片:', JSON.stringify(card));
await p.screenshot({path:'shots/v4-lemma.png'});

console.log('errors:', errs.length?errs.slice(0,3):'none');
await b.close();
