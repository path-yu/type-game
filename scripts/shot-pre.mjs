import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:860,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('http://localhost:4173/',{waitUntil:'networkidle2'});
await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('typewake:theme','light'); });
await p.reload({waitUntil:'networkidle2'});
await p.waitForSelector('.hero');
await p.click('.ghost-btn');
await p.waitForSelector('.lib');
await p.type('.lib-search','moby');
await sleep(400);
await p.click('.lib-row');
await p.waitForSelector('.pre', {timeout:6000});
await sleep(400);
await p.screenshot({path:'shots/v7-pretest.png'});
// 再截一张答错的状态
await p.type('.pre-input','zzzz');
await p.keyboard.press('Enter');
await sleep(350);
await p.screenshot({path:'shots/v7-pretest-wrong.png'});
console.log('ok');
await b.close();
