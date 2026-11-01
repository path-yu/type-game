// 续读的端到端验证：打完一段回到城市页，主推荐应该是同一本书的下一段，而不是换一本。
// 单测（test-recommend.mjs）验的是函数，这里验的是"整条链路真的这么走"。
import puppeteer from 'puppeteer-core';

const PORT = process.env.PORT || 4173;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0;
const fails = [];
const check = (name, cond, got = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${got ? `  ${got}` : ''}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${got ? `  ${got}` : ''}`); }
};

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 2 },
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));

const hero = () => p.evaluate(() => {
  const el = document.querySelector('.hero');
  const title = el?.querySelector('.h-title')?.childNodes[0]?.textContent?.trim() ?? '';
  const part = el?.querySelector('.h-part')?.textContent ?? '';
  const m = /第\s*(\d+)\/(\d+)\s*段/.exec(part);
  return { title, ord: m ? +m[1] : 0, tot: m ? +m[2] : 0 };
});

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.hero');
  await sleep(500);

  const a = await hero();
  check('首页标出段号', a.ord > 0 && a.tot > 0, `${a.title} 第 ${a.ord}/${a.tot} 段`);

  await p.click('.hero .btn-primary');
  await p.waitForSelector('.stage');
  await sleep(400);

  const partInPlay = await p.evaluate(() => document.querySelector('.tbar .ttl-part')?.textContent ?? '');
  check('打字页同样标出段号', /第\s*\d+\/\d+\s*段/.test(partInPlay), partInPlay || '（无）');

  const text = await p.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
  await p.keyboard.type(text, { delay: 0 });
  await p.waitForSelector('.result, .res', { timeout: 15000 }).catch(() => {});
  await sleep(600);

  // 回城市页
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(x => /城市|地图|返回/.test(x.textContent || ''));
    btn?.click();
  });
  await sleep(900);
  if (!(await p.$('.hero'))) {
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
    await p.waitForSelector('.hero');
    await sleep(500);
  }

  const c = await hero();
  check('下一篇仍选同一本书', c.title === a.title, `${a.title} → ${c.title}`);
  check('段号往后走', c.ord > a.ord, `${a.ord} → ${c.ord}`);
  check('打完的不再推荐', !(c.ord === a.ord && c.title === a.title), `${c.title} 第 ${c.ord} 段`);
  check('没有运行时错误', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await b.close();
}

console.log(`\n通过 ${pass} · 失败 ${fails.length}`);
process.exit(fails.length ? 1 : 0);
