// 预习卡（先测后学）：进正文前必须真的弹出来，答错要亮答案，答完要消失。
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

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.hero');
  await sleep(400);

  // 首页推荐的那篇可能只有一两个生词；从文库挑 Moby Dick（生词密度高）更稳
  await p.click('.ghost-btn');
  await p.waitForSelector('.lib-shelf');
  await p.type('.lib-search', 'moby');
  await sleep(400);
  // 文库现在是「书架 → 目录 → 阅读页」，搜索过滤的是书，段落要点进书里才看得到
  await p.evaluate(() => document.querySelector('.lib-book')?.click());
  await p.waitForSelector('.lib-row');
  const rows = await p.evaluate(() => document.querySelectorAll('.lib-row').length);
  if (rows === 0) throw new Error('文库搜不到 Moby Dick');
  // 文库点条目现在先进阅读页，要从那里按「开始打字」才到打字页
  await p.click('.lib-row');
  await p.waitForSelector('.rd-body');
  await p.evaluate(() => {
    [...document.querySelectorAll('.rd-head-acts .btn')].find(x => x.textContent.trim() === '开始打字')?.click();
  });
  await p.waitForSelector('.stage');
  await p.waitForSelector('.pre', { timeout: 5000 });
  await sleep(300);

  const head = await p.evaluate(() => ({
    label: document.querySelector('.pre-label')?.textContent ?? '',
    count: document.querySelector('.pre-count')?.textContent ?? '',
    zh: document.querySelector('.pre-zh')?.textContent ?? '',
    mask: document.querySelector('.pre-mask')?.textContent ?? '',
  }));
  check('进正文前弹出预习卡', /认一认/.test(head.label), head.label);
  check('标出进度', /1 \/ \d+/.test(head.count), head.count);
  check('给出中文释义', head.zh.length >= 2 && !/词库未收录/.test(head.zh), head.zh.slice(0, 24));
  check('只露首字母与长度', /^[a-z] (_ )+/.test(head.mask.trim()), head.mask);

  // 先从词库反查第一题的答案（mask 给首字母与长度，释义给中文）
  const truth = await p.evaluate(async () => {
    const res = await fetch('./data/dict.json');
    const { words } = await res.json();
    const mask = (document.querySelector('.pre-mask')?.textContent ?? '').trim();
    const first = mask[0];
    const len = (mask.match(/_/g) || []).length + 1;
    const zh = (document.querySelector('.pre-zh')?.textContent ?? '').trim();
    const frag = zh.replace(/^[a-z]+\.\s*/i, '').split(',')[0].trim();
    if (!first || !frag) return null;
    const hit = words.find(w =>
      w.w[0] === first && w.w.length === len && (w.z || '').includes(frag)
    );
    return hit ? hit.w : null;
  });

  // ① 答对
  if (truth) {
    await p.type('.pre-input', truth);
    await p.keyboard.press('Enter');
    await sleep(200);
    const right = await p.evaluate(() => document.querySelector('.pre-fb')?.className ?? '');
    check('答对给出正确反馈', /right/.test(right), `${truth} → ${right || '（无反馈）'}`);
    await sleep(500);   // 答对会自动翻页
  } else {
    console.log('  · 第一题反查不到答案，跳过答对断言');
  }

  // ② 第二题故意答错
  await p.type('.pre-input', 'zzzz');
  await p.keyboard.press('Enter');
  await sleep(300);
  const wrong = await p.evaluate(() => ({
    fb: document.querySelector('.pre-fb')?.textContent ?? '',
    cls: document.querySelector('.pre-fb')?.className ?? '',
    mask: document.querySelector('.pre-mask')?.textContent ?? '',
  }));
  check('答错给出正确词', /^✗ 是 /.test(wrong.fb), wrong.fb);
  check('答错时露出完整单词', !/_/.test(wrong.mask), wrong.mask);
  check('答错样式为 wrong', /wrong/.test(wrong.cls));
  await p.keyboard.press('Enter');
  await sleep(250);

  // 跳过剩余
  await p.evaluate(() => document.querySelector('.pre-skip')?.click());
  await sleep(400);
  const gone = await p.evaluate(() => !document.querySelector('.pre'));
  check('预习结束后回到正文', gone);
  check('正文仍然在', !!(await p.$('.stage')));

  // 打字仍然工作（预习卡没把键盘事件吃掉）
  const text = await p.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
  await p.keyboard.type(text.slice(0, 12), { delay: 0 });
  await sleep(300);
  const typed = await p.evaluate(() => document.querySelectorAll('.stage .ch.ok, .stage .ch.done').length);
  check('预习之后能正常打字', typed > 0, `${typed} 字符已确认`);

  check('没有运行时错误', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await b.close();
}

console.log(`\n通过 ${pass} · 失败 ${fails.length}`);
process.exit(fails.length ? 1 : 0);
