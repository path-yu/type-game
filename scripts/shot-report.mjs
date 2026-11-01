import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new',
  args:['--no-sandbox','--disable-gpu','--mute-audio'], defaultViewport:{width:1320,height:1400,deviceScaleFactor:2}});
const p = await b.newPage();

const seed = (theme) => `(() => {
  const hist = [
    [38,96.4,58],[41,97.1,62],[39,95.8,55],[44,98.2,71],[47,97.6,68],
    [45,96.9,60],[49,98.8,74],[52,98.4,77],[50,99.1,72],[55,98.6,79],
    [54,97.9,66],[58,99.2,81]
  ].map(([wpm,acc,cons],i) => ({
    d:'2026-10-' + String(20 + i).padStart(2,'0'), id:'aesop-0' + (100+i),
    wpm, acc, cons, sec: 62 + i * 3
  }));
  const keyErr = {
    'e\\u0000r': 9, 'i\\u0000e': 7, 't\\u0000r': 6, 'a\\u0000s': 5,
    'o\\u0000p': 4, 'n\\u0000m': 3, ' \\u0000x': 3, 'l\\u0000k': 2
  };
  const mastery = {
    thorough: { m: 34, s: 1, due: 0, seen: 6, ok: 4, er: 5 },
    ancient:  { m: 52, s: 2, due: 0, seen: 5, ok: 4, er: 3 },
    beneath:  { m: 61, s: 2, due: 0, seen: 7, ok: 6, er: 2 },
    murmur:   { m: 45, s: 1, due: 0, seen: 4, ok: 3, er: 2 }
  };
  localStorage.setItem('typewake:theme', '${theme}');
  localStorage.setItem('typewake:v1', JSON.stringify({
    p: { history: hist, keyErr, mastery, runs: 12, totalSeconds: 810, streak: 4,
         unlocked: 3, lvDone: {1:8,2:8}, bestWpm: {'aesop-0111': 58} },
    s: {}
  }));
})()`;

for (const theme of ['light','dark']) {
  await p.goto('http://localhost:4173/', {waitUntil:'networkidle2'});
  await p.evaluate(seed(theme));
  await p.reload({waitUntil:'networkidle2'});
  await p.waitForSelector('.side-item');
  await p.evaluate(()=>{ [...document.querySelectorAll('.side-item')].find(x=>x.textContent.includes('体检报告'))?.click(); });
  await p.waitForSelector('.rep-verdict');
  await sleep(600);
  await p.screenshot({path:`shots/report-${theme}.png`});
}
await b.close();
