import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const demoted = JSON.parse(fs.readFileSync('data/tmp-t1.json', 'utf8'));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:900,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
await p.evaluate((words) => {
  localStorage.clear();
  localStorage.setItem('typewake:theme','light');
  const mastery = {};
  for (const w of words) mastery[w] = { m: 62, s: 1, due: 0, seen: 2, ok: 1, er: 1 };
  mastery['thorough'] = { m: 100, s: 3, due: 0, seen: 4, ok: 4, er: 0 };
  mastery['murmur'] = { m: 100, s: 3, due: 0, seen: 4, ok: 4, er: 0 };
  localStorage.setItem('typewake:v1', JSON.stringify({ p: { mastery, unlocked: 2 }, s: {} }));
}, demoted);
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.side-item');
await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('藏书阁'))?.click(); });
await sleep(700);
const head = await p.evaluate(()=>({
  num: document.querySelector('.vocab-num, .big-num, h1')?.textContent ?? '',
  sub: document.querySelector('.vocab p, .page-head p')?.textContent ?? '',
}));
console.log('标题:', head.num.replace(/\s+/g,' ').trim());
console.log('副标题:', head.sub.replace(/\s+/g,' ').trim());
await p.screenshot({path:'shots/vocab-breakdown.png'});
await b.close();
