/**
 * 体检报告：先打三次（故意打错若干键），再看报告是否给出有效结论。
 * 用法：node scripts/test-report.mjs（预览服务需在 4173）
 */
import puppeteer from 'puppeteer-core';
import * as esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-report.mjs');

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

/* ---------------- 纯逻辑：对话维度 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/report.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const R = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);
const fakeCorpus = { dict: new Map(), names: new Set(), articles: [], byLevel: [] };
const mk = (scenes, branchStats = {}) => ({
  history: [], keyErr: {}, mastery: {}, bestWpm: {}, runs: 0, totalSeconds: 0, scenes, branchStats,
});
const reportOf = (scenes, total = 10, branchStats = {}) =>
  R.buildReport(mk(scenes, branchStats), fakeCorpus, 1, { scenes: total });

const none = reportOf({});
check('没练过对话时不影响报告', none.talk.played === 0 && none.talk.verdict === null);

const mixed = reportOf({
  cafe: { best: 92, swapBest: 74, liveBest: 55, at: '', runs: 5 },
  hotel: { best: 88, liveBest: 60, at: '', runs: 3 },
  doctor: { best: 70, at: '', runs: 1 },
}, 10);
check('统计练过的场数', mixed.talk.played === 3, `${mixed.talk.played} 场`);
check('统计换角与实战', mixed.talk.bothWays === 1 && mixed.talk.live === 2,
  `换角 ${mixed.talk.bothWays} · 实战 ${mixed.talk.live}`);
check('平均分只算练过的', mixed.talk.bestAvg === 83, `说台词 ${mixed.talk.bestAvg}%`);
check('总场数取自参数', mixed.talk.total === 10);
check('差距大时判「临场接不住」', /临场/.test(mixed.talk.verdict?.title ?? ''), mixed.talk.verdict?.title);

const wide = reportOf({
  a: { best: 95, liveBest: 45, at: '', runs: 2 },
  b: { best: 90, liveBest: 50, at: '', runs: 2 },
});
check('差距 ≥20 判 warn', wide.talk.verdict?.tone === 'warn', `${wide.talk.bestAvg} vs ${wide.talk.liveAvg}`);

const weak = reportOf({
  a: { best: 55, liveBest: 40, at: '', runs: 2 },
  b: { best: 60, liveBest: 42, at: '', runs: 2 },
});
check('整体偏低判 bad', weak.talk.verdict?.tone === 'bad', weak.talk.verdict?.title);

const even = reportOf({
  a: { best: 82, liveBest: 78, at: '', runs: 2 },
  b: { best: 86, liveBest: 80, at: '', runs: 2 },
});
check('两条线齐平时判 good', even.talk.verdict?.tone === 'good', even.talk.verdict?.title);

const few = reportOf({ a: { best: 90, liveBest: 40, at: '', runs: 1 } });
check('实战不足两场不下结论', few.talk.verdict === null, `实战 ${few.talk.live} 场`);

/* ---------------- 岔路按类型 ---------------- */
const none2 = reportOf({}, 10, {});
check('没练过岔路时不出分类', none2.talk.branches.length === 0 && none2.talk.weakBranch === null);

const br = (ok, n) => ({ ok, n });
const mix = reportOf({}, 10, { cost: br(1, 3), short: br(2, 2), change: br(0, 2), probe: br(0, 1) });
check('只列练过的类型', mix.talk.branches.length === 4,
  mix.talk.branches.map(b => b.label).join(' / '));
check('接住率低的排前面', mix.talk.branches[0].kind === 'change',
  mix.talk.branches.map(b => `${b.label}${b.rate}%`).join(' / '));
check('样本不足一局的排到最后', mix.talk.branches[3].kind === 'probe',
  mix.talk.branches.map(b => `${b.label} ${b.n}局`).join(' / '));
check('接住率是百分比', mix.talk.branches.find(b => b.kind === 'short').rate === 100);
check('挑出最弱的一类', mix.talk.weakBranch?.kind === 'change', mix.talk.weakBranch?.label);
check('最弱的一类写进建议', mix.tips.some(t => /流程变了/.test(t)), mix.tips.join(' | ').slice(0, 60));

// 只练过一次就下结论等于碰运气
const once = reportOf({}, 10, { cost: br(0, 1) });
check('样本只有一次不下「最弱」结论', once.talk.weakBranch === null,
  once.talk.branches.map(b => `${b.label} ${b.ok}/${b.n}`).join(' / '));

// 两类打平：按场次多的排前面
const tie = reportOf({}, 10, { short: br(1, 2), cost: br(1, 2) });
check('打平时场次多的在前', tie.talk.branches.length === 2 &&
  tie.talk.branches.every(b => b.n === 2));

// 全都接得住时不判「最弱」
const allOk = reportOf({}, 10, { cost: br(3, 3), short: br(2, 2) });
check('全接住时没有最弱项', allOk.talk.weakBranch === null,
  allOk.talk.branches.map(b => `${b.label} ${b.rate}%`).join(' / '));

try { fs.unlinkSync(TMP); } catch { /* ignore */ }

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 2 },
});
const page = await b.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  localStorage.clear();
  // 预习卡会盖住打字区，这几项测试只关心打字与结算，先关掉；它有专属测试
  localStorage.setItem('typewake:v1', JSON.stringify({ s: { pretest: false } }));
});
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.hero');

/** 打一篇，每 17 个字符故意打错一次 */
async function playOnce() {
  await page.click('.hero .btn-primary');
  await page.waitForSelector('.stage');
  // 预习卡会盖住打字区：测试里统一跳过（它有自己的专项测试）
  await sleep(350);
  if (await page.$('.pre')) {
    await page.evaluate(() => document.querySelector('.pre-skip')?.click());
    await sleep(300);
  }

  await sleep(250);
  const text = await page.evaluate(() => [...document.querySelectorAll('.stage .ch')].map(e => e.textContent).join(''));

  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const wrong = ch.toLowerCase() === 'z' ? 'q' : 'z';
    if (i > 0 && i % 17 === 0) {
      if (buf) { await page.keyboard.type(buf); buf = ''; }
      await page.keyboard.press(wrong);   // 故意打错
    }
    buf += ch;
  }
  if (buf) await page.keyboard.type(buf);
  await sleep(1400);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.actions .btn')];
    (btns.find(x => x.textContent.includes('回地图')) || btns[0])?.click();
  });
  await sleep(600);
}

console.log('[打三次，制造错键数据]');
for (let i = 0; i < 3; i++) await playOnce();

const saved = await page.evaluate(() => {
  const j = JSON.parse(localStorage.getItem('typewake:v1'));
  return {
    history: j.p.history?.length ?? 0,
    keyErr: Object.keys(j.p.keyErr ?? {}).length,
    totalKeys: Object.values(j.p.keyErr ?? {}).reduce((a, b) => a + b, 0),
  };
});
check('成绩历史已记录', saved.history === 3, `${saved.history} 条`);
check('易错键已累计', saved.keyErr > 0 && saved.totalKeys > 0, `${saved.keyErr} 种 / ${saved.totalKeys} 次`);

console.log('\n[体检报告]');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('体检报告'));
  b?.click();
});
await sleep(700);

const rep = await page.evaluate(() => ({
  verdict: document.querySelector('.rep-verdict .rv-title')?.textContent ?? '',
  detail: document.querySelector('.rep-verdict .rv-detail')?.textContent ?? '',
  cards: document.querySelectorAll('.rep-card').length,
  avgs: [...document.querySelectorAll('.rep-big')].map(x => x.textContent),
  sparkLen: (document.querySelector('.spark-line')?.getAttribute('d') ?? '').length,
  keys: document.querySelectorAll('.key-row').length,
  firstKey: document.querySelector('.key-row .key-pair')?.textContent ?? '',
  weak: document.querySelectorAll('.weak-item').length,
  tips: document.querySelectorAll('.rep-tips li').length,
}));

check('给出诊断结论', rep.verdict.length > 2, rep.verdict);
check('结论有解释细节', rep.detail.length > 10, rep.detail.slice(0, 40) + '…');
check('三项核心指标', rep.cards === 3, rep.avgs.join(' / '));
check('WPM 趋势折线有数据', rep.sparkLen > 20, `${rep.sparkLen} 字符路径`);
check('列出易错键', rep.keys > 0, `${rep.keys} 行 · ${rep.firstKey}`);
check('列出反复打错的词', rep.weak > 0, `${rep.weak} 个`);
check('给出练习建议', rep.tips >= 2, `${rep.tips} 条`);

// 对话维度：没有练过对话时不显示
const talkNone = await page.evaluate(() => !!document.querySelector('.rep-talk'));
check('没练对话时不显示对话块', !talkNone);

await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('typewake:v1') || '{}');
  raw.p = raw.p || {};
  raw.p.scenes = {
    cafe: { best: 92, swapBest: 74, liveBest: 55, at: '2026-11-01', runs: 4 },
    hotel: { best: 88, liveBest: 60, at: '2026-11-01', runs: 2 },
    airport: { best: 80, liveBest: 40, at: '2026-11-01', runs: 1 },
  };
  // 岔路按类型：要加钱 1/3（最弱）、东西没了 2/2、流程变了 0/1（样本不足不下结论）
  raw.p.branchStats = { cost: { ok: 1, n: 3 }, short: { ok: 2, n: 2 }, change: { ok: 0, n: 1 } };
  localStorage.setItem('typewake:v1', JSON.stringify(raw));
});
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await page.evaluate(() => {
  [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('体检报告'))?.click();
});
await sleep(700);
const talk = await page.evaluate(() => {
  const t = document.querySelector('.rep-talk');
  return {
    has: !!t,
    head: t?.querySelector('.rep-block-head span')?.textContent?.replace(/\s+/g, ' ') ?? '',
    cards: [...(t?.querySelectorAll('.rep-card') ?? [])].map(c => c.innerText.replace(/\n/g, ' ')),
    note: t?.querySelector('.rep-talk-note b')?.textContent ?? '',
  };
});
check('练过对话后出现对话块', talk.has);
check('统计口径写清楚', /3 \/ 10 场/.test(talk.head) && /实战 3 场/.test(talk.head), talk.head.trim());
check('两个数据卡片', talk.cards.length === 2 && /说台词/.test(talk.cards[0]) && /实战接住率/.test(talk.cards[1]),
  talk.cards.join(' | '));
check('给出差距结论', /临场/.test(talk.note), talk.note);

const branch = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.rep-branch-row')];
  return {
    has: !!document.querySelector('.rep-branch'),
    title: document.querySelector('.rep-branch-title')?.textContent ?? '',
    rows: rows.map(r => ({
      k: r.querySelector('.k')?.textContent ?? '',
      n: r.querySelector('em')?.textContent ?? '',
      weak: r.classList.contains('weak'),
    })),
  };
});
check('报告列出岔路分类', branch.has && branch.rows.length === 3, `${branch.rows.length} 类`);
check('最弱的一类排最前', branch.rows[0]?.k === '要加钱', branch.rows.map(r => r.k).join(' / '));
check('标出最弱的一类', branch.rows[0]?.weak && /要加钱/.test(branch.title), branch.title.trim());
check('每类标出接住次数', branch.rows[0]?.n === '1/3',
  branch.rows.map(r => `${r.k}:${r.n}`).join(' '));
check('样本不足的一类排最后且不高亮',
  branch.rows[2]?.k === '流程变了' && !branch.rows[2].weak,
  branch.rows.map(r => `${r.k}${r.weak ? '*' : ''}`).join(' / '));

// 刷新后仍在
await page.reload({ waitUntil: 'networkidle2' });
await page.waitForSelector('.side-item');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('体检报告'));
  b?.click();
});
const reopened = await page.waitForSelector('.rep-verdict', { timeout: 5000 }).then(() => true).catch(() => false);
check('刷新后报告仍可打开', reopened);

console.log(`\n通过 ${pass} · 失败 ${fail}`);
console.log('运行时错误:', errs.length ? errs.slice(0, 3) : '0');
await b.close();
process.exit(fail || errs.length ? 1 : 0);
