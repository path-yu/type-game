/**
 * 夜巡扩容：单词队列里夹一两句到期的句型。
 *
 * 用法：node scripts/test-review.mjs（预览服务需在 4173）
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-review.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));
const cafe = bank.scenes.find(s => s.id === 'cafe');

/* ---------------- 纯逻辑 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/review.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const R = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const TODAY = 1000;
const w = (due, m = 50, er = 0, lex = false) => ({ m, s: 1, due, last: 0, reps: 1, lapses: 0, seen: 1, ok: 1, er, lex });

/* 1. 单词队列：谁该进来 */
const mastery = {
  apple: w(TODAY - 2),        // 到期
  bread: w(TODAY),            // 今天到期
  ladder: w(TODAY + 30, 40),  // 没到期但没掌握
  window: w(TODAY + 30, 90, 2), // 没到期、掌握了、打错过
  garden: w(TODAY + 60, 100),  // 掌握且没到期、没错过 —— 不该出现
};
const q1 = R.buildWordQueue(mastery, TODAY, 12);
check('到期的最先出现', q1[0] === 'apple' && q1[1] === 'bread', q1.join(','));
check('没掌握的词也会进来', q1.includes('ladder'), q1.join(','));
check('打错过的词也会进来', q1.includes('window'), q1.join(','));
check('已经掌握且没到期的词不进来', !q1.includes('garden'), q1.join(','));
check('尊重上限', R.buildWordQueue(mastery, TODAY, 2).length === 2);

/* 2. 句型只收到期且学过的 */
const pool = cafe.phrases.map(ph => ({ ...ph, sceneId: cafe.id, sceneName: cafe.name }));
const pstats = {
  [pool[0].en]: { m: 60, s: 2, due: TODAY - 1 },
  [pool[1].en]: { m: 70, s: 3, due: TODAY },
  [pool[2].en]: { m: 80, s: 9, due: TODAY + 20 },   // 没到期
  // pool[3] 没学过
};
const due = R.duePhrases(pool, pstats, TODAY, 5);
check('只收学过的句型', due.every(p => pstats[p.en]), due.map(p => p.en).join(' / '));
check('只收到期的句型', !due.some(p => p.en === pool[2].en), due.map(p => p.en).join(' / '));
check('越早到期越靠前', due[0].en === pool[0].en, due.map(p => p.en).join(' / '));
check('句型也有上限', R.duePhrases(pool, pstats, TODAY, 1).length === 1);

/* 3. 混排 */
const words = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
const mixed = R.mixItems(words, due);
check('混排后长度 = 单词 + 句型', mixed.length === words.length + due.length, `${mixed.length}`);
check('第一题永远是单词', mixed[0].kind === 'word');
check('句型不会全堆在最后', mixed[mixed.length - 1].kind === 'word', mixed.map(x => x.kind).join(','));
const at = mixed.map((x, k) => (x.kind === 'phrase' ? k : -1)).filter(k => k >= 0);
check('句型之间是散开的', at.length < 2 || at[1] - at[0] >= 2, at.join(','));
check('单词顺序不变', mixed.filter(x => x.kind === 'word').map(x => x.w).join(',') === words.join(','));
check('没有句型时就是纯单词队列', R.mixItems(words, []).every(x => x.kind === 'word'));
check('只有句型时也能出队', R.mixItems([], due).length === due.length);

/* 4. 整轮 */
const q = R.buildReviewQueue(mastery, pool, pstats, TODAY);
check('整轮不超过 12 题', q.length <= 12, `${q.length} 题`);
check('整轮里句型不超过 2 句', q.filter(x => x.kind === 'phrase').length <= 2,
  `${q.filter(x => x.kind === 'phrase').length} 句`);
check('整轮既有单词也有句型', q.some(x => x.kind === 'word') && q.some(x => x.kind === 'phrase'),
  q.map(x => x.kind[0]).join(''));
const qEmpty = R.buildReviewQueue({}, [], {}, TODAY);
check('什么都没有时返回空队列', qEmpty.length === 0);

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

const stat = (dueDay, m = 50) => ({ m, s: 1, d: 5, due: dueDay, last: 0, reps: 1, lapses: 0, seen: 1, ok: 1, er: 0 });

try {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await page.evaluate(data => {
    localStorage.clear();
    localStorage.setItem('typewake:theme', 'light');
    localStorage.setItem('typewake:v1', JSON.stringify({
      p: {
        mastery: {
          apple: data.w, bread: data.w, ladder: data.w, window: data.w,
        },
        scenes: { cafe: { best: 90, at: '2026-11-01', runs: 2 } },
        phrases: { [data.p1]: data.w, [data.p2]: data.w },
      },
      s: { pretest: false },
    }));
  }, { w: stat(0), p1: cafe.phrases[0].en, p2: cafe.phrases[1].en });

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');

  /* 先确认「没练过的句型不进夜巡」 */
  const before = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('typewake:v1'));
    return Object.keys(raw.p.phrases).length;
  });
  check('台账里预置了两句句型', before === 2, `${before} 句`);

  await page.evaluate(() =>
    [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('夜巡'))?.click());
  await page.waitForSelector('.rv-slot, .empty', { timeout: 6000 });
  await sleep(500);

  const head = await page.evaluate(() => ({
    total: document.querySelector('.rv-top span')?.textContent ?? '',
    dots: document.querySelectorAll('.rv-top .dots i').length,
    mode: document.querySelector('.rv-mode')?.textContent ?? '',
    slots: document.querySelectorAll('.rv-slot').length,
    say: !!document.querySelector('.rv-say-input'),
  }));
  check('队列是 4 个词 + 2 句句型', /^\d+\s*\/\s*6$/.test(head.total), head.total);
  check('进度点数量对得上', head.dots === 6, `${head.dots} 个`);
  check('第一题是听写单词', !head.say && head.mode.includes('听发音'), head.mode);
  check('单词用逐字符格子', head.slots > 0, `${head.slots} 格`);

  /* 一路走完：遇词打错、遇句型先错后对 */
  const seen = [];
  let phraseNo = 0;
  for (let n = 0; n < 16; n++) {
    if (await page.evaluate(() => !!document.querySelector('.rv-done-title'))) break;
    const st = await page.evaluate(() => ({
      say: !!document.querySelector('.rv-say-input'),
      fix: !!document.querySelector('.rv-say-fix'),
      mode: document.querySelector('.rv-mode')?.textContent ?? '',
      zh: document.querySelector('.rv-zh')?.textContent ?? '',
      blanks: document.querySelectorAll('.rv-mask-words span').length,
      hint: [...document.querySelectorAll('.rv-hint')].map(x => x.textContent).join(' | '),
    }));

    if (!st.say && !st.fix) {
      seen.push({ kind: 'word' });
      await page.keyboard.type('z'.repeat(40), { delay: 0 });
      await sleep(2100);       // 答错要等 1.9s 才翻页
      continue;
    }

    if (st.fix) {
      // 句型答错后的复盘页：回车继续
      await page.keyboard.press('Enter');
      await sleep(350);
      continue;
    }

    seen.push({ kind: 'phrase', ...st });
    const item = st.zh === cafe.phrases[0].zh ? cafe.phrases[0] : cafe.phrases[1];
    await page.evaluate(() => document.querySelector('.rv-say-input')?.focus());
    if (phraseNo === 0) {
      await page.keyboard.type('zzz');
    } else {
      await page.keyboard.type(item.en, { delay: 0 });
    }
    phraseNo++;
    await page.keyboard.press('Enter');
    await sleep(phraseNo === 1 ? 500 : 1400);
  }

  const kinds = seen.map(x => x.kind);
  check('队列里确实夹了句型', kinds.includes('phrase'), kinds.join(','));
  check('句型不排在最前面', kinds[0] === 'word', kinds.join(','));
  check('句型也不全堆在最后', kinds[kinds.length - 1] === 'word', kinds.join(','));

  const first = seen.find(x => x.kind === 'phrase');
  check('句型给出中文题干', (first?.zh ?? '').length > 2, first?.zh ?? '');
  const firstEn = first?.zh === cafe.phrases[0].zh ? cafe.phrases[0].en : cafe.phrases[1].en;
  const nWords = (firstEn.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  check('句型按词长画空位，一段横线一个词', first?.blanks === nWords, `${first?.blanks}/${nWords} 段`);
  check('句型标明来源场景', /咖啡店点单/.test(first?.mode ?? ''), first?.mode ?? '');

  const sum = await page.evaluate(() => ({
    title: document.querySelector('.rv-done-title')?.textContent ?? '',
    body: document.querySelector('.rv-card')?.innerText.replace(/\n/g, ' | ') ?? '',
    wrongSay: [...document.querySelectorAll('.rv-wrong-item b')].map(x => x.textContent),
    chips: [...document.querySelectorAll('.chips .chip')].map(x => x.textContent.trim()),
  }));
  check('走完 6 题后结算', /\/\s*6\s*拼对了/.test(sum.title), sum.title);
  check('答错的句型列在结算里', sum.wrongSay.length === 1, sum.wrongSay.join(' / '));
  check('答上的那题没进错题', sum.chips.length === 4, `${sum.chips.length} 个错词`);
  check('结算提示排回队首', /排回队首/.test(sum.body), sum.body.slice(-40));

  /* 写档：句型过了一遍，due 被推到未来 */
  const saved = await page.evaluate(() => ({
    // 与 store 的 dayNo 同口径：本地日历日，不是 UTC
    today: (() => {
      const d = new Date();
      return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    })(),
    phrases: JSON.parse(localStorage.getItem('typewake:v1') || '{}')?.p?.phrases ?? {},
  }));
  const p1 = saved.phrases[cafe.phrases[0].en];
  const p2 = saved.phrases[cafe.phrases[1].en];
  check('答错的句型当天回炉', p1?.due === saved.today && p1?.er >= 1,
    `due=${p1?.due - saved.today} er=${p1?.er}`);
  check('答对的句型排到之后', p2?.due > saved.today && p2?.ok >= 2,
    `due=+${p2?.due - saved.today} ok=${p2?.ok}`);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await br.close();
}

console.log(`\n${fail ? '✗' : '✓'} 夜巡扩容：${pass} 通过 / ${fail} 失败`);
if (fail) process.exit(1);
