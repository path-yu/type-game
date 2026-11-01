/**
 * 阅读填空端到端：出题、作答、判定、掌握度回写。
 * 用法：node scripts/test-cloze.mjs（预览服务需在 4173）
 */
import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 1000, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');

const openCloze = async () => {
  await page.evaluate(() => {
    [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('阅读填空'))?.click();
  });
  await page.waitForSelector('.cloze-body');
  await sleep(350);
};

await openCloze();

const info = await page.evaluate(() => {
  const ins = [...document.querySelectorAll('.cloze-input')];
  return {
    n: ins.length,
    slots: document.querySelectorAll('.cloze-slot').length,
    title: document.querySelector('.page-sub')?.textContent ?? '',
    placeholder: ins[0]?.placeholder ?? '',
    disabled: ins.some(i => i.disabled),
  };
});

check('渲染出填空文章', info.n > 0, info.title);
check('空格不少于 4 个', info.n >= 4, `${info.n} 个`);
check('空位与输入框一一对应', info.slots === info.n, `${info.slots} 槽 / ${info.n} 框`);
check('默认给首字母提示', info.placeholder.length > 0, JSON.stringify(info.placeholder));
check('作答前输入框可用', !info.disabled);

// 提示强度切换
await page.evaluate(() => {
  [...document.querySelectorAll('.cloze-tools .seg button')].find(x => x.textContent.includes('无提示'))?.click();
});
await sleep(250);
check('切到「无提示」后 placeholder 为空',
  await page.evaluate(() => document.querySelector('.cloze-input')?.placeholder === ''));
check('「无提示」档不显示整句译文',
  await page.evaluate(() => !document.querySelector('.cloze-sentence')));

await page.evaluate(() => {
  [...document.querySelectorAll('.cloze-tools .seg button')].find(x => x.textContent.includes('首字母+释义'))?.click();
});
await sleep(250);
const ph2 = await page.evaluate(() => document.querySelector('.cloze-input')?.placeholder ?? '');
check('「首字母+释义」带中文', /…（.+）/.test(ph2), ph2);

// 焦点随动的整句中文提示
const sent1 = await page.evaluate(() => {
  const el = document.querySelector('.cloze-sentence');
  const badge = el?.querySelector('span')?.textContent ?? '';
  return { text: el?.textContent ?? '', badge, hasCjk: /[\u4e00-\u9fff]/.test(el?.textContent ?? '') };
});
check('正文下方显示本句中文', sent1.hasCjk, sent1.text.slice(0, 40) + '…');
check('提示标注句号', /第 \d+ 句/.test(sent1.badge), sent1.badge);

const lastN = await page.evaluate(() => {
  const ins = [...document.querySelectorAll('.cloze-input')];
  ins[ins.length - 1].focus();
  return ins.length;
});
await sleep(200);
const sent2 = await page.evaluate(() => ({
  badge: document.querySelector('.cloze-sentence span')?.textContent ?? '',
  num: Number((document.querySelector('.cloze-sentence span')?.textContent ?? '').match(/\d+/)?.[0] ?? 0),
}));
const firstNum = Number(sent1.badge.match(/\d+/)?.[0] ?? 0);
check('句号随焦点推进', sent2.num >= firstNum && lastN > 0, `${firstNum} → ${sent2.num}`);

// 全部填错，用 Enter 跳转
const textBefore = await page.evaluate(() => document.querySelector('.cloze-body')?.textContent ?? '');
await page.click('.cloze-input');
for (let i = 0; i < info.n; i++) {
  await page.keyboard.type('zzz');
  await page.keyboard.press('Enter');
  await sleep(60);
}
await sleep(500);

const res = await page.evaluate(() => ({
  score: document.querySelector('.cr-score')?.textContent ?? '',
  answers: document.querySelectorAll('.cloze-answer').length,
  disable: [...document.querySelectorAll('.cloze-input')].every(i => i.disabled),
  right: document.querySelectorAll('.cloze-input.ok').length,
  bad: document.querySelectorAll('.cloze-input.bad').length,
  words: document.querySelectorAll('.cr-word').length,
}));

check('提交后出现结算', /\/ \d+/.test(res.score), res.score);
check('答错的空标红', res.bad === info.n, `${res.bad}/${info.n}`);
check('显示正确答案', res.answers === info.n, `${res.answers} 处`);
check('提交后锁定输入', res.disable);
check('列出错词', res.words > 0, `${res.words} 个`);

// 掌握度回写：错词应记 er 且排进今天
const saved = await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  const day = (() => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); })();
  const errs = Object.values(j.p.mastery).filter(s => (s.er ?? 0) > 0);
  return {
    errWords: errs.length,
    dueToday: errs.filter(s => s.due === day).length,
    total: Object.keys(j.p.mastery).length,
  };
});
check('错词已计入掌握度', saved.errWords > 0, `${saved.errWords} 个错词 / 共 ${saved.total}`);
check('错词排进夜巡（当天到期）', saved.dueToday === saved.errWords, `${saved.dueToday}/${saved.errWords}`);

// 再来一篇换文章
await page.evaluate(() => {
  [...document.querySelectorAll('.cr-actions .btn')].find(x => x.textContent.includes('再来一篇'))?.click();
});
await sleep(600);
const textAfter = await page.evaluate(() => document.querySelector('.cloze-body')?.textContent ?? '');
check('再来一篇会换文章', textAfter !== textBefore && textAfter.length > 0);
check('换篇后恢复可作答',
  await page.evaluate(() => [...document.querySelectorAll('.cloze-input')].every(i => !i.disabled)));

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
