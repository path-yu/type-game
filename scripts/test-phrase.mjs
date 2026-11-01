/**
 * 句型复习：练完一场对话，那场的句型才进池；到期了才推给你。
 *
 * 用法：node scripts/test-phrase.mjs（预览服务需在 4173）
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-phrase.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

/* ---------------- 纯逻辑 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/phrases.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const P = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));

const all = P.bankPhrases(bank.scenes);
const total = bank.scenes.reduce((n, s) => n + s.phrases.length, 0);
check('收全库句型', all.length === total, `${all.length} / ${total}`);
check('按英文去重', new Set(all.map(p => p.en)).size === all.length);
check('带出场景名', all.every(p => p.sceneName && p.sceneId));

const cafe = bank.scenes.find(s => s.id === 'cafe');
const pool1 = P.unlockedPhrases(bank.scenes, { cafe: { best: 90, at: '', runs: 1 } });
check('只收练过那场的句型', pool1.length === cafe.phrases.length, `${pool1.length} / ${cafe.phrases.length}`);
check('没练过的场不进池', P.unlockedPhrases(bank.scenes, {}).length === 0);

const today = 20000;
const fresh = P.pickSession(pool1, {}, today, 8);
check('没学过的按池子顺序抽', fresh.length === Math.min(8, pool1.length) && fresh[0].en === pool1[0].en);

const stats = {
  [pool1[0].en]: { m: 60, s: 3, d: 5, due: today - 5, seen: 2, ok: 1, er: 1 },
  [pool1[1].en]: { m: 40, s: 1, d: 8, due: today, seen: 1, ok: 0, er: 1 },
  [pool1[2].en]: { m: 90, s: 30, d: 3, due: today + 10, seen: 4, ok: 4, er: 0 },
};
const s2 = P.pickSession(pool1, stats, today, 8);
check('到期的排在最前，越快忘越靠前',
  s2[0].en === pool1[0].en && s2[1].en === pool1[1].en, s2.slice(0, 2).map(p => p.en.slice(0, 16)).join(' / '));
check('没到期的不抽', !s2.some(p => p.en === pool1[2].en));
// 到期 2 句 + 没学过 1 句；第 3 句排到十天后，不该出现
check('不够 8 句时补新句', s2.length === 3 && s2.some(p => p.en === pool1[3].en), `${s2.length} 句`);
check('上限生效', P.pickSession(P.bankPhrases(bank.scenes), {}, today, 8).length === 8);

check('待复习数 = 到期 + 没学过',
  P.pendingCount(pool1, stats, today) === pool1.length - 1, String(P.pendingCount(pool1, stats, today)));
check('已学数', P.learnedCount(pool1, stats) === 3, String(P.learnedCount(pool1, stats)));

try { fs.unlinkSync(TMP); } catch { /* ignore */ }

/* ---------------- 端到端 ---------------- */
const br = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 1 },
});
const page = await br.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

try {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');
  await page.evaluate(() => [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('场景对话'))?.click());
  await page.waitForSelector('.dg-grid');
  await sleep(400);

  check('没练过对话时没有复习入口', !(await page.evaluate(() => !!document.querySelector('.dg-pe'))));

  // 用背打把第一场走完（看答案 → 回车）
  await page.click('.dg-cell .dg-card');
  await page.waitForSelector('.dg-thread');
  await page.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '背打')?.click());
  await sleep(400);
  for (let n = 0; n < 12; n++) {
    if (await page.evaluate(() => !!document.querySelector('.dg-sum'))) break;
    const st = await page.evaluate(() => ({
      reveal: [...document.querySelectorAll('.dg-link')].some(x => x.textContent === '看答案'),
      bad: !!document.querySelector('.dg-fb.bad'),
    }));
    if (st.reveal) {
      await page.evaluate(() => [...document.querySelectorAll('.dg-link')].find(x => x.textContent === '看答案')?.click());
      await sleep(180);
    }
    if (st.reveal || st.bad) {
      await page.evaluate(() => document.querySelector('.dg-input')?.focus());
      await page.keyboard.press('Enter');
      await sleep(240);
    }
  }
  await page.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到场景列表'))?.click());
  await page.waitForSelector('.dg-grid');
  await sleep(500);

  const entry = await page.evaluate(() => {
    const el = document.querySelector('.dg-pe');
    return {
      has: !!el,
      text: el?.innerText.replace(/\n/g, ' | ') ?? '',
    };
  });
  check('练完一场后出现句型复习入口', entry.has, entry.text);
  check('入口标出待复习数量', /句待复习/.test(entry.text), entry.text);
  check('入口标出来源场次', /练过的 1 场/.test(entry.text), entry.text);

  await page.click('.dg-pe');
  await page.waitForSelector('.dg-drill', { timeout: 5000 });
  await sleep(400);

  const drill0 = await page.evaluate(() => ({
    zh: document.querySelector('.dg-prompt-zh')?.textContent ?? '',
    bar: document.querySelector('.dg-bar span')?.textContent ?? '',
    ctx: document.querySelector('.dg-ctx')?.textContent ?? '',
  }));
  check('复习给出中文题干', drill0.zh.length > 2, drill0.zh);
  check('复习标明来自哪场', /句型 ·/.test(drill0.ctx), drill0.ctx.trim());
  check('一池 4 句', /^1\s*\/\s*4$/.test(drill0.bar), drill0.bar);

  // 按语料顺序把 4 句打对
  for (let k = 0; k < cafe.phrases.length; k++) {
    const en = cafe.phrases[k].en;
    await page.evaluate(() => document.querySelector('.dg-input')?.focus());
    await page.keyboard.type(en, { delay: 0 });
    await page.keyboard.press('Enter');
    await sleep(1200);   // 说对后会等 900ms 自动翻页
  }
  // 最后一句判完 → 结算
  await page.waitForSelector('.dg-sum', { timeout: 6000 }).catch(() => {});

  const sum = await page.evaluate(() => ({
    has: !!document.querySelector('.dg-sum'),
    line: document.querySelector('.dg-sum-line')?.textContent ?? '',
    score: document.querySelector('.dg-sum-score')?.textContent ?? '',
  }));
  check('复习完有结算', sum.has, `${sum.score} · ${sum.line.slice(0, 24)}`);
  check('四句全说对', /说对 4 句/.test(sum.line), sum.line);

  const saved = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1') || '{}');
    const keys = Object.keys(j.p?.phrases ?? {});
    return { n: keys.length, due: keys.map(k => j.p.phrases[k].due) };
  });
  check('句型进度写进存档', saved.n === cafe.phrases.length, `${saved.n} 句`);
  check('复习过的排到以后', saved.due.every(d => d > 0), saved.due.join(','));

  await page.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到对话'))?.click());
  await page.waitForSelector('.dg-grid');
  await sleep(400);
  const after = await page.evaluate(() => document.querySelector('.dg-pe')?.innerText.replace(/\n/g, ' | ') ?? '');
  check('复习完入口显示已清空', /都复习过了/.test(after), after);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await br.close();
}

console.log(`\n${fail ? '✗' : '✓'} 句型复习：${pass} 通过 / ${fail} 失败`);
if (fail || errs.length) process.exit(1);
