import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:1000,deviceScaleFactor:2}});
const p = await b.newPage();

async function open(theme) {
  await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
  await p.evaluate(t => { localStorage.clear(); localStorage.setItem('typewake:theme', t); }, theme);
  await p.reload({waitUntil:'networkidle2'});
  await p.waitForSelector('.side-item');
  await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('阅读填空'))?.click(); });
  await p.waitForSelector('.cloze-body');
  await sleep(300);
}

// 先全填错，把正确答案从 DOM 里读出来
await open('light');
const n = await p.evaluate(()=>document.querySelectorAll('.cloze-input').length);
await p.click('.cloze-input');
for (let i=0;i<n;i++){ await p.keyboard.type('zzz'); await p.keyboard.press('Enter'); await sleep(40); }
await sleep(400);
const answers = await p.evaluate(()=>[...document.querySelectorAll('.cloze-answer')].map(e=>e.textContent));

// 重新打开（同一篇），答对大半
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.side-item');
await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('阅读填空'))?.click(); });
await p.waitForSelector('.cloze-body'); await sleep(300);
for (let i=0;i<answers.length;i++){
  const val = i === 2 ? 'wrong' : answers[i];
  await p.evaluate((idx, v) => {
    const el = document.querySelectorAll('.cloze-input')[idx];
    el.focus();
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, i, val);
  await sleep(40);
}
// 切到「首字母+释义」档，展示焦点句译文
await p.evaluate(()=>{
  [...document.querySelectorAll('.cloze-tools .seg button')].find(x=>x.textContent.includes('首字母+释义'))?.click();
  document.querySelectorAll('.cloze-input')[1]?.focus();
});
await sleep(400);
await p.screenshot({path:'shots/cloze-fill.png'});

await p.evaluate(()=>{
  const b=[...document.querySelectorAll('.cloze-foot .btn')].find(x=>x.textContent.includes('提交'));
  b?.click();
});
await sleep(600);
await p.screenshot({path:'shots/cloze-result.png'});
await b.close();
