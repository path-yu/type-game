import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
const errs=[]; p.on('pageerror', e=>errs.push(e.message));
const URL='http://localhost:4173/';

await p.goto(URL,{waitUntil:'networkidle2'});
await p.evaluate(()=>{ localStorage.setItem('typewake:theme','light'); });
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list'); await sleep(600);

// 设置页
await p.evaluate(()=>{ [...document.querySelectorAll('.theme-btn')].find(x=>x.textContent.includes('设置'))?.click(); });
await sleep(700);
await p.screenshot({path:'shots/v3-settings.png'});

// 打一条，进夜巡
await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('城市'))?.click(); });
await sleep(400);
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(300);
const text = await p.evaluate(()=>[...document.querySelectorAll('.stage .ch')].map(e=>e.textContent).join(''));
await p.keyboard.type(text);
await sleep(1400);

// 打开词卡看速度菜单
await p.evaluate(()=>{ const b=[...document.querySelectorAll('.actions .btn')].find(x=>x.textContent.includes('回地图')); b?.click(); });
await sleep(600);
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(300);
await p.evaluate(()=>{ document.querySelectorAll('.stage .w')[5]?.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
await sleep(500);
await p.evaluate(()=>{ document.querySelector('.card .speed')?.click(); });
await sleep(400);
await p.screenshot({path:'shots/v3-speed.png'});
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await sleep(300);

// 夜巡
await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('夜巡'))?.click(); });
await sleep(900);
await p.screenshot({path:'shots/v3-review.png'});

console.log('errors:', errs.length?errs.slice(0,3):'none');
await b.close();
