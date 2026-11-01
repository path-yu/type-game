/**
 * 每日卷轴的端到端验证：确定性、进入、完成、持久化。
 * 用法：node scripts/test-daily.mjs（预览服务需在 4173）
 */
import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 860, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.daily-row');
await sleep(400);

const readDaily = () => page.evaluate(() => {
  const el = document.querySelector('.daily-row');
  return {
    title: el?.querySelector('.daily-title')?.textContent ?? '',
    meta: el?.querySelector('.daily-meta')?.textContent ?? '',
    label: el?.querySelector('.daily-label')?.textContent ?? '',
    go: el?.querySelector('.daily-go')?.textContent ?? '',
    done: el?.classList.contains('done'),
  };
});

const first = await readDaily();
check('地图页有每日卷轴', !!first.title, first.title);
check('标注当天日期', /\d{4}-\d{2}-\d{2}/.test(first.label), first.label);

// 确定性：刷新后仍是同一篇
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.daily-row');
const again = await readDaily();
check('刷新后仍是同一篇', again.title === first.title && again.title !== '', again.title);

// 存进 progress，跨天才会变
const stored = await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  return { day: j.p.dailyDay, id: j.p.dailyArticle, done: j.p.dailyDone };
});
check('选中结果已写入存档', !!stored.id && !!stored.day, `${stored.id} @ ${stored.day}`);

// 进入 → 标题应与卷轴一致（标题后面跟了一个「第 N/M 段」，比对时剥掉）
await page.click('.daily-row');
await page.waitForSelector('.stage');
await sleep(400);
const ttl = await page.evaluate(() => {
  const el = document.querySelector('.tbar .ttl');
  const part = el?.querySelector('.ttl-part')?.textContent ?? '';
  return (el?.textContent ?? '').replace(part, '').trim();
});
check('点卷轴进入的就是这一篇', ttl === first.title, `${ttl}`);

const partTxt = await page.evaluate(() => document.querySelector('.tbar .ttl-part')?.textContent ?? '');
check('顶栏标出这是书里的第几段', /第\s*\d+\s*\/\s*\d+\s*段/.test(partTxt), partTxt || '（无）');

// 打完
const text = await page.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
await page.keyboard.type(text);
await sleep(1600);
const res = await page.evaluate(() => ({
  onResult: !!document.querySelector('.wpm-big'),
  badge: document.querySelector('.daily-done')?.textContent ?? null,
}));
check('结算页出现「今日卷轴」标记', res.onResult && !!res.badge, res.badge ?? '无');

// 回地图 → 卡片变为已完成
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.actions .btn')];
  (btns.find(x => x.textContent.includes('回地图')) || btns[0])?.click();
});
await sleep(700);
const after = await readDaily();
check('地图卡片标记为已完成', after.done, after.go);
// 无头浏览器是瞬间输入，WPM 会到几千；界面有 300 上限保护，此时不显示成绩。
const shown = after.meta.match(/今日最好 (\d+) WPM/);
check('成绩回显遵守上限保护', !!shown ? Number(shown[1]) <= 300 : true, after.meta);

// 刷新后仍是已完成
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.daily-row');
await sleep(300);
check('刷新后完成状态保留', (await readDaily()).done);

// 完成态：明日预告出现
const nextLine = await page.evaluate(() => document.querySelector('.daily-next')?.textContent ?? '');
check('完成后显示明日预告', /明日 · \S/.test(nextLine), nextLine);

/* ---------- 场景二：昨天做过 → 今天完成应 +1 ---------- */
await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // 假装昨天已完成过、且已连续 3 天
  j.p.dailyDone = false;
  j.p.dailyLastDay = y;
  j.p.dailyStreak = 3;
  localStorage.setItem('typewake:v1', JSON.stringify(j));
});
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.daily-row');
await sleep(400);
check('跨天后回到未完成', !(await readDaily()).done);
check('未断签时显示连续 3 天', /连续 3 天/.test(await page.evaluate(() => document.querySelector('.daily-streak')?.textContent ?? '')),
  await page.evaluate(() => document.querySelector('.daily-streak')?.textContent ?? '无'));

await page.click('.daily-row');
await page.waitForSelector('.stage');
await sleep(300);
const text2 = await page.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));
await page.keyboard.type(text2);
await sleep(1500);
const badge2 = await page.evaluate(() => document.querySelector('.daily-done')?.textContent ?? '');
check('完成后连续天数 +1', /每日连续 4 天/.test(badge2), badge2);

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
