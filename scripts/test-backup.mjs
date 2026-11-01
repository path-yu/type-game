/**
 * 进度备份：导出 / 导入。
 *
 * 守三件事：
 *   1. 导出的是完整档案（不是只有成绩数字），能原样导回来
 *   2. 坏文件一律拒收，并说清哪里不对
 *   3. 导入是覆盖，且覆盖前必须把两边的数字摆出来
 *
 * 用法：node scripts/test-backup.mjs（预览服务需在 4173）
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-backup.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

/* ---------------- 纯逻辑 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/backup.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const B = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const w = (m, due = 0) => ({ m, s: 2, d: 5, due, seen: 1, ok: 1, er: 0 });
const P = {
  mastery: { apple: w(60), bread: w(85), cedar: w(10) },
  runs: 9,
  dailyStreak: 4,
  scenes: { cafe: { best: 90, at: '' , runs: 1 } },
  customScenes: [{ id: 'my-1' }],
};

const built = B.buildBackup(P, { rate: 1 }, new Date('2026-11-02T10:00:00Z'));
check('导出带上应用标记与版本', built.app === 'typewake' && built.v === 1, `v${built.v}`);
check('导出的时间戳是 ISO', built.at === '2026-11-02T10:00:00.000Z', built.at);

const sum = B.summarize(built);
check('摘要统计词数', sum.words === 3, `${sum.words} 词`);
check('摘要统计已掌握（≥70）', sum.learned === 1, `${sum.learned} 个`);
check('摘要统计篇数与对话', sum.runs === 9 && sum.scenes === 1 && sum.custom === 1,
  `${sum.runs} 篇 / ${sum.scenes} 场 / 自建 ${sum.custom}`);

check('文件名带日期', B.fileName(new Date('2026-11-02T10:00:00Z')) === 'typewake-2026-11-02.json',
  B.fileName(new Date('2026-11-02T10:00:00Z')));

// 往返：导出再导入，数据要一模一样
const text = JSON.stringify(built);
const back = B.parseBackup(text);
check('自己导出的文件能读回来', back.ok, back.error);
check('读回来的进度与原来一致',
  JSON.stringify(back.data?.p?.mastery) === JSON.stringify(P.mastery) && back.data?.p?.runs === 9);
check('读回来的设置也在', back.data?.s?.rate === 1);
check('干净的备份没有警告', back.warnings.length === 0, back.warnings.join(' / '));

// 拒收：说清哪里不对
const bad = [
  ['这不是 JSON', '{oops', /JSON/],
  ['顶层是数组', '[1,2,3]', /对象/],
  ['没有 p 字段', '{"app":"typewake"}', /学习记录/],
  ['没有词表', '{"app":"typewake","p":{"runs":1}}', /词表/],
  ['版本太新', JSON.stringify({ app: 'typewake', v: 99, p: { mastery: {} } }), /更新的版本/],
];
for (const [label, body, re] of bad) {
  const r = B.parseBackup(body);
  check(`拒收：${label}`, !r.ok && re.test(r.error ?? ''), r.error ?? '(居然通过了)');
}

// 宽容：老格式 / 空档案都能进，但要提醒
const old = B.parseBackup(JSON.stringify({ p: { mastery: { a: w(50) } } }));
check('没有应用标记也能导入', old.ok, old.error);
check('老格式给提醒', old.warnings.some(x => /应用标记/.test(x)), old.warnings[0]);

const empty = B.parseBackup(JSON.stringify({ app: 'typewake', v: 1, p: { mastery: {} } }));
check('空档案给提醒但仍可导入', empty.ok && empty.warnings.some(x => /是空的/.test(x)), empty.warnings[0]);

check('相对时间：今天', B.whenLabel(new Date().toISOString()) === '今天', B.whenLabel(new Date().toISOString()));
check('相对时间：昨天',
  B.whenLabel(new Date(Date.now() - 86400000).toISOString()) === '昨天');
check('相对时间：未知', B.whenLabel('') === '时间未知');

try { fs.unlinkSync(TMP); } catch { /* ignore */ }

/* ---------------- 端到端 ---------------- */
const DL = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-dl-'));
const UP = path.join(os.tmpdir(), `tw-up-${Date.now()}.json`);

const br = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 1000, deviceScaleFactor: 1 },
});
const page = await br.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

const seed = {
  mastery: { apple: w(60), bread: w(85) },
  runs: 7,
  dailyStreak: 3,
  scenes: { cafe: { best: 90, at: '2026-11-01', runs: 1 } },
  customScenes: [],
};

try {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await page.evaluate(d => {
    localStorage.clear();
    localStorage.setItem('typewake:theme', 'light');
    localStorage.setItem('typewake:v1', JSON.stringify({ p: d, s: { rate: 1 } }));
  }, seed);
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');
  await page.evaluate(() => [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('设置'))?.click());
  await page.waitForSelector('.bk-export', { timeout: 5000 });
  await sleep(300);

  const cur = await page.evaluate(() => ({
    text: document.querySelector('.bk-acts')
      ?.closest('.set-row')?.querySelector('.set-label span')?.textContent?.replace(/\s+/g, ' ') ?? '',
    rows: [...document.querySelectorAll('.set-group')].map(g => g.querySelector('.set-group-title')?.textContent),
    exportBtn: !!document.querySelector('.bk-export'),
    importBtn: !!document.querySelector('.bk-import'),
    fileInput: !!document.querySelector('.bk-file'),
  }));
  check('设置里出现「数据」分组', cur.rows.includes('数据'), cur.rows.join(' / '));
  check('两个按钮都在', cur.exportBtn && cur.importBtn);
  check('有隐藏的文件选择框', cur.fileInput);
  check('说明里写出当前档案规模', /2 个词的记录/.test(cur.text), cur.text.slice(0, 46));

  /* ---------- 导出 ---------- */
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });

  await page.click('.bk-export');
  let file = '';
  for (let i = 0; i < 40; i++) {
    const list = fs.readdirSync(DL).filter(f => f.endsWith('.json'));
    if (list.length) { file = path.join(DL, list[0]); break; }
    await sleep(100);
  }
  check('点导出会下载一个 json', !!file, file ? path.basename(file) : '没等到文件');
  check('文件名带日期', /^typewake-\d{4}-\d{2}-\d{2}\.json$/.test(path.basename(file)), path.basename(file));

  const got = file ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  check('文件里是完整档案', got.app === 'typewake' && got.v === 1 && !!got.p?.mastery);
  check('导出内容与当前进度一致',
    got.p?.runs === 7 && Object.keys(got.p.mastery).length === 2,
    `${got.p?.runs} 篇 / ${Object.keys(got.p?.mastery ?? {}).length} 词`);
  check('导出后给出提示', /已导出/.test(await page.evaluate(() => document.querySelector('.bk-msg')?.textContent ?? '')));

  /* ---------- 导入：坏文件 ---------- */
  fs.writeFileSync(UP, '{ broken json');
  await page.evaluate(() => { const el = document.querySelector('.bk-file'); el.value = ''; });
  let input = await page.$('.bk-file');
  await input.uploadFile(UP);
  await sleep(400);
  const badMsg = await page.evaluate(() => ({
    msg: document.querySelector('.bk-msg.err')?.textContent ?? '',
    confirm: !!document.querySelector('.bk-confirm'),
  }));
  check('坏文件被拒收并说明原因', /JSON/.test(badMsg.msg), badMsg.msg);
  check('坏文件不会弹确认框', !badMsg.confirm);

  /* ---------- 导入：好文件 ---------- */
  const incoming = {
    app: 'typewake',
    v: 1,
    at: new Date(Date.now() - 3 * 86400000).toISOString(),
    p: {
      mastery: { zebra: w(95), yak: w(40), xray: w(20) },
      runs: 2,
      dailyStreak: 1,
      scenes: { hotel: { best: 70, at: '2026-10-30', runs: 1 } },
      customScenes: [{ id: 'my-9' }],
    },
    s: { rate: 0.75 },
  };
  fs.writeFileSync(UP, JSON.stringify(incoming));
  await page.evaluate(() => { const el = document.querySelector('.bk-file'); el.value = ''; });
  input = await page.$('.bk-file');
  await input.uploadFile(UP);
  await sleep(400);

  const conf = await page.evaluate(() => {
    const box = document.querySelector('.bk-confirm');
    return {
      has: !!box,
      head: box?.querySelector('.bk-confirm-head')?.textContent?.replace(/\s+/g, ' ') ?? '',
      rows: [...(box?.querySelectorAll('.bk-cmp b') ?? [])].map(x => x.textContent.replace(/\s+/g, ' ')),
      go: !!document.querySelector('.bk-confirm-go'),
      cancel: !!document.querySelector('.bk-cancel'),
    };
  });
  check('好文件弹出确认框', conf.has, conf.head.slice(0, 30));
  check('确认框写明会覆盖', /覆盖/.test(conf.head), conf.head);
  check('确认框标出备份时间', /3 天前/.test(conf.head), conf.head);
  check('两边数字都摆出来',
    conf.rows.length === 2 && /2 词/.test(conf.rows[0]) && /3 词/.test(conf.rows[1]),
    conf.rows.join(' | '));

  // 取消：不该动档案
  await page.click('.bk-cancel');
  await sleep(300);
  const afterCancel = await page.evaluate(() => JSON.parse(localStorage.getItem('typewake:v1') || '{}').p?.runs);
  check('取消后不改动当前档案', afterCancel === 7, `runs=${afterCancel}`);

  // 确认：覆盖
  await page.evaluate(() => { const el = document.querySelector('.bk-file'); el.value = ''; });
  input = await page.$('.bk-file');
  await input.uploadFile(UP);
  await sleep(400);
  await page.click('.bk-confirm-go');
  await sleep(700);

  const after = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1') || '{}');
    return {
      runs: j.p?.runs,
      words: Object.keys(j.p?.mastery ?? {}).sort().join(','),
      scenes: Object.keys(j.p?.scenes ?? {}).join(','),
      custom: (j.p?.customScenes ?? []).length,
      rate: j.s?.rate,
      screen: document.querySelector('.hero') ? 'map' : '?',
      toast: document.querySelector('.toast')?.textContent ?? '',
    };
  });
  check('导入后换成备份里的进度', after.runs === 2, `runs=${after.runs}`);
  check('词表整个换掉（旧的 apple 不该留着）', after.words === 'xray,yak,zebra', after.words);
  check('对话成绩与自建场一起恢复', after.scenes === 'hotel' && after.custom === 1,
    `${after.scenes} / 自建 ${after.custom}`);
  check('设置也一起恢复', after.rate === 0.75, `rate=${after.rate}`);
  check('导入后回到城市页', after.screen === 'map');

  // 刷新后仍在（写进存档了）
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('typewake:v1') || '{}').p?.runs);
  check('刷新后导入的进度还在', persisted === 2, `runs=${persisted}`);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await br.close();
  try { fs.rmSync(DL, { recursive: true, force: true }); } catch { /* ignore */ }
  try { fs.unlinkSync(UP); } catch { /* ignore */ }
}

console.log(`\n${fail ? '✗' : '✓'} 进度备份：${pass} 通过 / ${fail} 失败`);
if (fail) process.exit(1);
