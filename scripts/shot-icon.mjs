import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox'], defaultViewport:{width:1200,height:460,deviceScaleFactor:2}});
const p = await b.newPage();
await p.goto('file:///D:/code/type-game/design/icon-candidates.html', {waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,400));
await p.screenshot({ path:'design/icon-candidates.png' });
await b.close();
