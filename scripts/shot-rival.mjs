import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{
  // 造一批到期的形近词，让夜巡有词可复习
  const streak = (w) => ({ m: 20, s: 1, d: 5, due: 0, last: 0, reps: 1, lapses: 1, seen: 1, ok: 0, er: 1, lex: false });
  localStorage.clear();
  localStorage.setItem('typewake:theme','light');
  localStorage.setItem('typewake:v1', JSON.stringify({
    p: { mastery: { effect: streak('effect'), affect: streak('affect'), effort: streak('effort') } },
    s: { pretest: false },
  }));
});
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.side-item');
await sleep(500);
await p.evaluate(()=>[...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('夜巡'))?.click());
await p.waitForSelector('.rv-card', {timeout:6000});
await sleep(600);
const len = await p.evaluate(()=>document.querySelector('.rv-slots')?.children.length ?? 6);
// 夜巡是「打满长度就自动判」，没有手动提交
await p.keyboard.type('z'.repeat(len), { delay: 30 });
await sleep(700);
const info = await p.evaluate(()=>({
  mode: document.querySelector('.rv-mode')?.textContent,
  answer: document.querySelector('.rv-answer')?.textContent,
  rival: document.querySelector('.rv-rival')?.textContent,
}));
console.log(JSON.stringify(info));
await p.screenshot({path:'shots/v8-rival.png'});
await b.close();
