/**
 * 今日对话：每日卷轴的第二项。
 *
 * 守三件事：
 *   1. 确定性 —— 同一天刷新多少次都是同一场（用日期做种子，不是随机）
 *   2. 直达 —— 点首页那一行，直接打开那一场，不用自己去列表里找
 *   3. 记账 —— 只完成对话也能推进「每日连续」，且不与文章那项互相干扰
 *
 * 用法：node scripts/test-daily-scene.mjs（预览服务需在 4173）
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-daily.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

/* ---------------- 纯逻辑：同一天必须抽出同一场 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/daily.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const D = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));
const day = D.todayKey();

const a = D.pickDailyScene(bank.scenes, 1, day);
const b2 = D.pickDailyScene(bank.scenes, 1, day);
check('同一天抽到同一场', a && b2 && a.id === b2.id, a?.id);
check('换一天会换一场', D.pickDailyScene(bank.scenes, 1, '2030-01-01')?.id !== a?.id || bank.scenes.filter(s => s.lv <= 1).length === 1);
check('只从已解锁难度里抽', a && a.lv <= 1, `lv ${a?.lv}`);
const all = new Set();
for (let i = 0; i < 30; i++) {
  const s = D.pickDailyScene(bank.scenes, 7, `2030-02-${String(i + 1).padStart(2, '0')}`);
  all.add(s.id);
}
check('不同日期能覆盖到多场', all.size >= 6, `${all.size} / ${bank.scenes.length} 场`);

check('连续天数：昨天做过 → +1',
  D.bumpDailyStreak({ dailyStreak: 3, dailyLastDay: D.yesterdayKey() }, day).dailyStreak === 4);
check('连续天数：今天做过 → 不重复加',
  D.bumpDailyStreak({ dailyStreak: 3, dailyLastDay: day }, day).dailyStreak === 3);
check('连续天数：断了两天 → 从 1 重来',
  D.bumpDailyStreak({ dailyStreak: 3, dailyLastDay: '2020-01-01' }, day).dailyStreak === 1);
try { fs.unlinkSync(TMP); } catch { /* ignore */ }

/* ---------------- 界面 ---------------- */
const br = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 2 },
});
const page = await br.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

try {
  await page.goto(`http://localhost:${process.env.PORT || 4173}/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('typewake:theme', 'light');
    localStorage.setItem('typewake:v1', JSON.stringify({ s: { pretest: false } }));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.daily-row.scene');
  await sleep(600);

  const read = () => page.evaluate(() => {
    const rows = [...document.querySelectorAll('.daily-row')];
    const art = rows[0], sc = rows.find(r => r.classList.contains('scene'));
    return {
      artDone: art?.classList.contains('done') ?? false,
      sceneTitle: sc?.querySelector('.daily-title')?.textContent ?? '',
      sceneMeta: sc?.querySelector('.daily-meta')?.textContent ?? '',
      sceneLabel: sc?.querySelector('.daily-label')?.textContent ?? '',
      sceneDone: sc?.classList.contains('done') ?? false,
      go: sc?.querySelector('.daily-go')?.textContent ?? '',
      streak: document.querySelector('.daily-streak')?.textContent ?? '',
    };
  });

  const s1 = await read();
  check('首页出现「今日对话」', !!s1.sceneTitle, s1.sceneTitle);
  check('抽到的就是数据里那场', s1.sceneTitle === a.name, `${s1.sceneTitle} / 预期 ${a.name}`);
  check('标注句数与岔路', /句台词/.test(s1.sceneMeta) && /1 处岔路/.test(s1.sceneMeta), s1.sceneMeta.trim());
  check('两项进度从 0 开始', /0\s*\/\s*2/.test(s1.sceneLabel), s1.sceneLabel.trim());

  // 确定性：刷新后仍是同一场
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.daily-row.scene');
  await sleep(400);
  check('刷新后仍是同一场', (await read()).sceneTitle === a.name);

  const stored = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1'));
    return { scene: j.p.dailyScene, day: j.p.dailyDay };
  });
  check('场景已写入存档', stored.scene === a.id, `${stored.scene} @ ${stored.day}`);

  // 点它 → 直接进这一场
  await page.click('.daily-row.scene');
  await page.waitForSelector('.dg-scene', { timeout: 6000 });
  await sleep(400);
  const opened = await page.evaluate(() => ({
    title: document.querySelector('.dg-scene .page-title')?.textContent ?? '',
    tabs: [...document.querySelectorAll('.dg-tabs button')].length,
  }));
  check('点击直接打开那一场', opened.title === a.name, opened.title);
  check('打开的是完整场景页', opened.tabs === 5, `${opened.tabs} 个练法`);

  // 用背打最快走完：每句点「看答案」再回车
  await page.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '背打')?.click());
  await sleep(400);
  for (let n = 0; n < 12; n++) {
    if (await page.evaluate(() => !!document.querySelector('.dg-sum'))) break;
    const st = await page.evaluate(() => ({
      reveal: [...document.querySelectorAll('.dg-link')].some(x => x.textContent === '看答案'),
      disabled: !!document.querySelector('.dg-fb.bad'),
    }));
    if (st.reveal) {
      await page.evaluate(() => [...document.querySelectorAll('.dg-link')].find(x => x.textContent === '看答案')?.click());
      await sleep(200);
    }
    if (st.disabled || st.reveal) {
      await page.evaluate(() => document.querySelector('.dg-input')?.focus());
      await page.keyboard.press('Enter');
      await sleep(260);
    }
  }
  const sum = await page.evaluate(() => ({
    has: !!document.querySelector('.dg-sum'),
    line: document.querySelector('.dg-sum-line')?.textContent ?? '',
  }));
  check('今日对话能练完', sum.has, sum.line.slice(0, 22));

  // 回城市页看记账
  await page.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到场景列表'))?.click());
  await page.waitForSelector('.dg-grid', { timeout: 5000 });
  await page.evaluate(() => [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('城市'))?.click());
  await page.waitForSelector('.daily-row.scene');
  await sleep(500);

  const s2 = await read();
  check('对话那行打上已完成', s2.sceneDone, s2.go);
  check('两项进度变成 1 / 2', /1\s*\/\s*2/.test(s2.sceneLabel), s2.sceneLabel.trim());
  check('文章那项不受影响', !s2.artDone);

  const after = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1'));
    return {
      sceneDone: j.p.dailySceneDone,
      artDone: j.p.dailyDone,
      streak: j.p.dailyStreak,
      last: j.p.dailyLastDay,
    };
  });
  check('完成状态写入存档', after.sceneDone === true);
  check('只做对话也能推进每日连续', after.streak === 1 && after.last === D.todayKey(), `连续 ${after.streak} 天`);
  check('文章那项仍是未完成', after.artDone === false || after.artDone === undefined);

  // —— 该重温：练过的对话放两周不用，首页要提醒，点了直接落在筛选好的列表 ——
  await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1'));
    const id = Object.keys(j.p.scenes)[0];
    const d = new Date(Date.now() - 30 * 86400000);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    j.p.scenes[id] = { ...j.p.scenes[id], at: date };
    localStorage.setItem('typewake:v1', JSON.stringify(j));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.daily-row.due', { timeout: 5000 });
  const dueRow = await page.evaluate(() => ({
    label: document.querySelector('.daily-row.due .daily-label')?.textContent ?? '',
    title: document.querySelector('.daily-row.due .daily-title')?.textContent ?? '',
    meta: document.querySelector('.daily-row.due .daily-meta')?.textContent ?? '',
  }));
  check('两周没练的对话在首页提醒', /1 场/.test(dueRow.label), dueRow.label.trim());
  check('提醒里点名是哪一场并说多久没练', dueRow.title.length > 0 && /30 天没练/.test(dueRow.meta), `${dueRow.title.trim()} / ${dueRow.meta.trim()}`);

  await page.evaluate(() => document.querySelector('.daily-row.due').click());
  await page.waitForSelector('.dg-chips-status', { timeout: 5000 });
  await sleep(400);
  const applied = await page.evaluate(() => ({
    on: document.querySelector('.dg-chips-status .dg-chip.on')?.textContent ?? '',
    cards: [...document.querySelectorAll('.dg-card')].map(x => x.dataset.scene),
  }));
  check('点进去直接落在「待重温」', /待重温/.test(applied.on), applied.on.trim());
  check('列表就剩那一场', applied.cards.length === 1, `${applied.cards.length} 张`);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await br.close();
}

console.log(`\n${fail ? '✗' : '✓'} 今日对话：${pass} 通过 / ${fail} 失败`);
if (fail || errs.length) process.exit(1);
