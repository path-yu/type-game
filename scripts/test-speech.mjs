import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d='') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new', args:['--no-sandbox','--disable-gpu'], defaultViewport:{width:1320,height:860} });
const p = await b.newPage();

// 用桩替换 speechSynthesis，记录 speak / cancel 调用
await p.evaluateOnNewDocument(() => {
  const st = { speak: 0, cancel: 0, lastText: '' };
  window.__sp = st;
  const fake = {
    speaking: false, pending: false,
    speak(u) { st.speak++; st.lastText = u.text || ''; },
    cancel() { st.cancel++; },
    getVoices() { return []; },
    addEventListener() {}, removeEventListener() {},
    onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
});

await p.goto('http://localhost:4173/', { waitUntil:'networkidle2' });
await p.waitForSelector('.dist-list'); await sleep(500);

console.log('[朗读全文]');
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(300);

// 点朗读全文
await p.evaluate(() => {
  const btns = [...document.querySelectorAll('.tbar .icon-btn')];
  btns.find(b => b.title === '朗读全文')?.click();
});
await sleep(400);
let st = await p.evaluate(() => window.__sp);
check('点击后触发朗读', st.speak >= 1, `speak=${st.speak}`);
check('读出的是全文而非单词', st.lastText.length > 100, `${st.lastText.length} 字符`);
const btnState = await p.evaluate(() => {
  const b = [...document.querySelectorAll('.tbar .icon-btn')].find(x => x.title === '停止朗读');
  return b ? b.textContent.trim() : null;
});
check('按钮变为「停止朗读」', btnState === '⏹', String(btnState));

// 再点一次应停止
await p.evaluate(() => {
  [...document.querySelectorAll('.tbar .icon-btn')].find(b => b.title === '停止朗读')?.click();
});
await sleep(300);
st = await p.evaluate(() => window.__sp);
check('再次点击调用 cancel', st.cancel >= 1, `cancel=${st.cancel}`);

// 重新朗读，然后退出页面
await p.evaluate(() => {
  [...document.querySelectorAll('.tbar .icon-btn')].find(b => b.title === '朗读全文')?.click();
});
await sleep(300);
const beforeCancel = (await p.evaluate(() => window.__sp)).cancel;

console.log('[退出打字界面]');
await p.evaluate(() => {
  document.querySelector('.tbar .icon-btn')?.click();  // ← 返回
});
await sleep(700);
const after = await p.evaluate(() => ({
  sp: window.__sp,
  screen: !!document.querySelector('.dist-list'),
}));
check('退出后仍停留在朗读中', !(after.sp.cancel > beforeCancel) ? false : true, `cancel ${beforeCancel} → ${after.sp.cancel}`);
check('已回到城市页', after.screen);

// 词卡发音也应随页面退出停止
console.log('[词卡发音]');
await p.click('.hero .btn-primary');
await p.waitForSelector('.stage'); await sleep(300);
await p.evaluate(() => document.querySelectorAll('.stage .w')[3]?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
await sleep(400);
await p.evaluate(() => document.querySelector('.card .spk > button')?.click());
await sleep(300);
const c1 = (await p.evaluate(() => window.__sp)).cancel;
await p.keyboard.press('Escape');
await sleep(300);
await p.evaluate(() => document.querySelector('.tbar .icon-btn')?.click());
await sleep(600);
const c2 = (await p.evaluate(() => window.__sp)).cancel;
check('离开页面时取消词卡发音', c2 > c1, `cancel ${c1} → ${c2}`);

console.log(`\n通过 ${pass} · 失败 ${fail}`);
await b.close();
process.exit(fail ? 1 : 0);
