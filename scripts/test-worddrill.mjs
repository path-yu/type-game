/**
 * 背单词：跟读 / 默写 / 听写。
 *
 * 断言的落点是「这三种练法真的能练」，不是「页面上有几个按钮」：
 *   默写 —— 只给中文，写对写错都要当场给答案，并且写进 FSRS
 *   听写 —— 只给声音，答完才露词
 *   跟读 —— 词、音标、中文同时在，无识别环境要老实降级而不是假装打分
 *
 * 用法：node scripts/test-worddrill.mjs（预览服务默认 4173，可用 PORT 覆盖）
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8'));
const DICT = new Map(dict.words.map(w => [w.w, w]));
const WORDS = ['apple', 'mountain', 'river', 'window', 'doctor'];
const ZH = new Map(WORDS.map(w => [(DICT.get(w).z || '').split('\n')[0], w]));

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto(`http://localhost:${process.env.PORT || 4173}/`, { waitUntil: 'networkidle2' });
await page.evaluate(ws => {
  localStorage.clear();
  localStorage.setItem('typewake:theme', 'light');
  const mastery = {};
  for (const w of ws) mastery[w] = { m: 52, seen: 2, ok: 1, er: 0 };
  localStorage.setItem('typewake:v1', JSON.stringify({ p: { mastery }, s: {} }));
}, WORDS);
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await sleep(700);

const openLexicon = async () => {
  await page.evaluate(() => {
    [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('藏书阁'))?.click();
  });
  await page.waitForSelector('.v-tools', { timeout: 6000 });
  await sleep(400);
};

await openLexicon();

const entry = await page.evaluate(() => ({
  btn: document.querySelector('.v-tools .btn')?.textContent?.trim() ?? '',
  note: document.querySelector('.v-tools-note')?.textContent?.trim() ?? '',
  cards: document.querySelectorAll('.wcard').length,
}));
check('藏书阁有背单词入口', entry.btn === '背单词', entry.btn);
check('入口说明词池来自当前筛选', /5 个词/.test(entry.note) && entry.cards === 5, entry.note);

await page.click('.v-tools .btn');
await page.waitForSelector('.wd-setup', { timeout: 5000 });
await sleep(300);

// —— 设置屏 ——
const setup = await page.evaluate(() => ({
  modes: [...document.querySelectorAll('.wd-mode b')].map(x => x.textContent.trim()),
  sizes: [...document.querySelectorAll('.wd-size')].map(x => x.textContent.trim()),
  rows: [...document.querySelectorAll('.wd-row-val')].map(x => x.textContent.trim()),
  warn: document.querySelector('.wd-warn')?.textContent?.trim() ?? '',
  defaultMode: document.querySelector('.wd-mode.on b')?.textContent?.trim() ?? '',
}));
check('三种练法都在', setup.modes.join('') === '跟读默写听写', setup.modes.join(' / '));
check('默写是默认（最常用）', setup.defaultMode === '默写', setup.defaultMode);
check('一局词数可选，且不超过词池', setup.sizes.length === 3 && /5 个词/.test(setup.rows.join(' ')), setup.rows.join(' | '));

// —— 默写：只给中文 ——
await page.evaluate(() => {
  [...document.querySelectorAll('.wd-size')].find(x => x.textContent.trim() === '全部 5')?.click();
  [...document.querySelectorAll('.wd-go')][0]?.click();
});
await page.waitForSelector('.wd-word, .wd-zh-big', { timeout: 5000 });
await sleep(500);

const q1 = await page.evaluate(() => ({
  zh: document.querySelector('.wd-zh-big')?.textContent?.trim() ?? '',
  word: document.querySelector('.wd-word')?.textContent?.trim() ?? '',
  blank: document.querySelector('.wd-blank')?.textContent?.trim() ?? '',
  hasInput: !!document.querySelector('.wd-input'),
  total: document.querySelector('.wd-top-note')?.textContent?.trim() ?? '',
  dots: document.querySelectorAll('.wd-dots i').length,
}));
check('默写题不露英文，只给中文', !!q1.zh && !q1.word, q1.zh.slice(0, 20));
check('默写给的是空格占位而不是整词', /_/.test(q1.blank) && q1.blank.replace(/[\s_]/g, '').length === 0, q1.blank);
check('题量与词池一致', /1 \/ 5/.test(q1.total) && q1.dots === 5, q1.total);

// 答错一次：要当场给正确答案，并记进 FSRS
const w1 = ZH.get(q1.zh) ?? WORDS[0];
const before = await page.evaluate(w => JSON.parse(localStorage.getItem('typewake:v1')).p.mastery[w], w1);
await page.type('.wd-input', 'zzzz');
await page.keyboard.press('Enter');
await sleep(400);
const wrong = await page.evaluate(() => ({
  answer: document.querySelector('.wd-word.done')?.textContent?.trim() ?? '',
  fix: document.querySelector('.wd-fix')?.textContent?.trim() ?? '',
  cls: document.querySelector('.wd-input')?.className ?? '',
}));
check('写错时给出正确答案', wrong.answer === w1, `${wrong.answer} / 期望 ${w1}`);
check('写错时显示自己写了什么', /zzzz/.test(wrong.fix), wrong.fix);
check('写错的输入框标红', /no/.test(wrong.cls), wrong.cls);

const afterWrong = await page.evaluate(w => JSON.parse(localStorage.getItem('typewake:v1')).p.mastery[w], w1);
check('答错写回掌握度', afterWrong.m < before.m, `${before.m} → ${afterWrong.m}`);

// 下一题：写对
await page.keyboard.press('Enter');
await sleep(450);
const q2 = await page.evaluate(() => document.querySelector('.wd-zh-big')?.textContent?.trim() ?? '');
const w2 = ZH.get(q2) ?? WORDS[1];
await page.type('.wd-input', w2);
await page.keyboard.press('Enter');
await sleep(400);
const right = await page.evaluate(() => ({
  answer: document.querySelector('.wd-word.done')?.textContent?.trim() ?? '',
  cls: document.querySelector('.wd-input')?.className ?? '',
  dots: [...document.querySelectorAll('.wd-dots i')].map(x => x.className.trim()),
}));
check('写对时亮出这个词', right.answer === w2, `${right.answer} / 期望 ${w2}`);
check('写对时输入框转绿', /ok/.test(right.cls), right.cls);
check('进度点区分对错', right.dots[0] === 'no' && right.dots[1] === 'ok', right.dots.join(','));

// 剩下的都空着提交，一直按到结算（每一轮是「提交 → 下一题」两下）
for (let k = 0; k < 24; k++) {
  if (await page.$('.wd-done')) break;
  await page.keyboard.press('Enter');
  await sleep(180);
}
await page.waitForSelector('.wd-done', { timeout: 6000 });
const done = await page.evaluate(() => ({
  score: document.querySelector('.wd-score')?.textContent?.trim() ?? '',
  line: document.querySelector('.wd-done-line')?.textContent?.trim() ?? '',
  bads: document.querySelectorAll('.wd-bad').length,
  acts: [...document.querySelectorAll('.wd-done-acts .btn')].map(x => x.textContent.trim()),
}));
check('结算给出正确率', /%/.test(done.score), done.score);
check('结算说明对了几个、错了几个', /记住 1 个/.test(done.line) && /4 个没写对/.test(done.line), done.line);
check('结算列出写错的词', done.bads === 4, `${done.bads} 个`);
check('错词列表有说明', /没写对/.test(await page.evaluate(() => document.querySelector('.wd-bads-title')?.textContent ?? '')), 'ok');
check('结算能换练法 / 再来一局 / 回藏书阁',
  done.acts.length === 3 && done.acts.includes('再来一局'), done.acts.join(' / '));

// —— 听写：只给声音，答完才露词 ——
await page.evaluate(() => [...document.querySelectorAll('.wd-done-acts .btn')].find(x => x.textContent.includes('换一种'))?.click());
await page.waitForSelector('.wd-setup', { timeout: 5000 });
await page.evaluate(() => {
  [...document.querySelectorAll('.wd-mode')].find(x => /听写/.test(x.textContent))?.click();
});
await sleep(250);
await page.evaluate(() => document.querySelector('.wd-go')?.click());
await page.waitForSelector('.wd-big-speak', { timeout: 5000 });
await sleep(400);
const listen = await page.evaluate(() => ({
  speaker: !!document.querySelector('.wd-big-speak'),
  word: document.querySelector('.wd-word')?.textContent?.trim() ?? '',
  sub: document.querySelector('.wd-sub')?.textContent?.trim() ?? '',
  hasInput: !!document.querySelector('.wd-input'),
}));
check('听写题只放声音，不给词', listen.speaker && !listen.word && listen.hasInput, listen.sub);

// 空提交看答案
await page.keyboard.press('Enter');
await sleep(350);
const revealed = await page.evaluate(() => ({
  word: document.querySelector('.wd-word.done')?.textContent?.trim() ?? '',
  zh: document.querySelector('.wd-zh')?.textContent?.trim() ?? '',
}));
check('听写答完才露出单词与释义', revealed.word.length > 0 && revealed.zh.length > 0, `${revealed.word} / ${revealed.zh.slice(0, 16)}`);

// —— 跟读：词 + 音标 + 中文同时在 ——
await page.evaluate(() => [...document.querySelectorAll('.icon-btn')].find(x => x.getAttribute('aria-label') === '退出背单词')?.click());
await page.waitForSelector('.v-tools', { timeout: 5000 });
await page.click('.v-tools .btn');
await page.waitForSelector('.wd-setup', { timeout: 5000 });
await page.evaluate(() => {
  [...document.querySelectorAll('.wd-mode')].find(x => /跟读/.test(x.textContent))?.click();
});
await sleep(250);
await page.evaluate(() => document.querySelector('.wd-go')?.click());
await page.waitForSelector('.wd-word', { timeout: 5000 });
await sleep(500);
const say = await page.evaluate(() => ({
  word: document.querySelector('.wd-word')?.textContent?.trim() ?? '',
  ipa: document.querySelector('.wd-ipa')?.textContent?.trim() ?? '',
  zh: document.querySelector('.wd-zh')?.textContent?.trim() ?? '',
  mic: document.querySelector('.wd-mic')?.textContent?.trim() ?? '',
  hasWarn: !!document.querySelector('.wd-warn'),
}));
check('跟读题同时给出词、音标、中文',
  WORDS.includes(say.word) && /^\/.+\/$/.test(say.ipa) && say.zh.length > 0, `${say.word} ${say.ipa}`);
check('跟读有明确的操作按钮', say.mic.length > 0, say.mic);

// —— 跟读判定：用注入的识别结果跑两种结局 ——
const curWord = await page.evaluate(() => document.querySelector('.wd-word')?.textContent?.trim() ?? '');
await page.evaluate(w => {
  window.__TYPEWAKE_ASR__ = () => w;          // 假装听清了
}, curWord);
await page.click('.wd-mic');
await sleep(600);
const saidOk = await page.evaluate(() => ({
  say: document.querySelector('.wd-say')?.textContent?.trim() ?? '',
  cls: document.querySelector('.wd-say')?.className ?? '',
  dots: [...document.querySelectorAll('.wd-dots i')].map(x => x.className.trim()),
}));
check('念对了立刻判过', /ok/.test(saidOk.cls) && /听清了/.test(saidOk.say), saidOk.say);
check('跟读判对记进进度点', saidOk.dots[0] === 'ok', saidOk.dots.join(','));

// 第二题念错
await sleep(1400);
const cur2 = await page.evaluate(() => document.querySelector('.wd-word')?.textContent?.trim() ?? '');
await page.evaluate(() => { window.__TYPEWAKE_ASR__ = () => 'banana'; });
await page.click('.wd-mic');
await sleep(600);
const saidNo = await page.evaluate(() => ({
  say: document.querySelector('.wd-say')?.textContent?.trim() ?? '',
  cls: document.querySelector('.wd-say')?.className ?? '',
}));
check('念错了判不过并说清听到了什么',
  /no/.test(saidNo.cls) && /没听清/.test(saidNo.say) && /banana/.test(saidNo.say), saidNo.say);
check('第二题确实是另一个词', cur2 !== curWord, `${curWord} → ${cur2}`);

// —— 桌面端（无语音识别）要老实降级，不能假装打分 ——
const p2 = await b.newPage();
await p2.evaluateOnNewDocument(() => {
  Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
  Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
});
await p2.goto(`http://localhost:${process.env.PORT || 4173}/`, { waitUntil: 'networkidle2' });
await p2.waitForSelector('.side-item');
await sleep(600);
await p2.evaluate(() => {
  [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('藏书阁'))?.click();
});
await p2.waitForSelector('.v-tools', { timeout: 6000 });
await p2.click('.v-tools .btn');
await p2.waitForSelector('.wd-setup', { timeout: 5000 });
await p2.evaluate(() => {
  [...document.querySelectorAll('.wd-mode')].find(x => /跟读/.test(x.textContent))?.click();
});
await sleep(250);
const degraded = await p2.evaluate(() => ({
  warn: document.querySelector('.wd-warn')?.textContent?.trim() ?? '',
}));
check('没有语音识别时先说明限制', /不能给发音评分/.test(degraded.warn), degraded.warn.slice(0, 30));

await p2.evaluate(() => document.querySelector('.wd-go')?.click());
await p2.waitForSelector('.wd-word', { timeout: 5000 });
await sleep(400);
const degBtn = await p2.evaluate(() => ({
  mic: document.querySelector('.wd-mic')?.textContent?.trim() ?? '',
  word: document.querySelector('.wd-word')?.textContent?.trim() ?? '',
}));
check('降级后仍能跟读，按钮变成「念过了」', /念过了/.test(degBtn.mic), `${degBtn.word} · ${degBtn.mic}`);
await p2.close();

await page.screenshot({ path: 'shots/worddrill.png' });

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
