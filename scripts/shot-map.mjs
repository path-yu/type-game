import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{
  localStorage.setItem('typewake:theme','light');
  const played = {};
  // 假装前四个城区各完成 8 条，让进度条有内容
  for (let lv=1; lv<=4; lv++) for (let i=0;i<8;i++) played[`x${lv}-${i}`] = 3;
  localStorage.setItem('typewake:v1', JSON.stringify({ p:{ unlocked:5, lvDone:{1:8,2:8,3:8,4:8}, played } }));
});
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.dist-list'); await sleep(700);
await p.screenshot({path:'shots/v10-map.png'});
const rows = await p.evaluate(()=>[...document.querySelectorAll('.dist-row .dist-main')].map(x=>x.textContent.replace(/\s+/g,' ').slice(0,40)));
console.log(rows.join(' | '));
await b.close();
