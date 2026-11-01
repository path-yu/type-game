import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:760,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('typewake:theme','light'); });
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.hero'); await sleep(600);
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(500);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text.slice(0, 90), {delay:0});
await sleep(500);
await p.screenshot({path:'shots/v5-play.png', clip:{x:0,y:0,width:1320,height:300}});
console.log('tbar:', await p.evaluate(()=>document.querySelector('.tbar')?.innerText.replace(/\n/g,' | ')));
await b.close();
