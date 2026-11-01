/**
 * 自定义对话：解析器 + 导入流程。
 *
 * 守三件事：
 *   1. 格式宽容但错误要指得准 —— 用户粘的是自己的材料，报错必须说清第几行哪里不对
 *   2. 导入后五种练法都能用（自建场没有岔路，实战要能优雅退化成整场走一遍）
 *   3. 删得干净 —— 场景和它的练习记录一起清掉
 *
 * 用法：node scripts/test-custom.mjs（预览服务需在 4173）
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-custom.mjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

/* ---------------- 纯逻辑 ---------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/custom.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const C = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const sample = C.parseDialogue(C.SAMPLE, 'x1');
check('示例能解析', sample.scene !== null, sample.errors.join(' / '));
check('句数与角色', sample.scene?.lines.length === 5 && sample.scene.roles[1] === '店员',
  `${sample.scene?.lines.length} 句 · 对方 ${sample.scene?.roles[1]}`);
check('「我」的台词归到自己', sample.scene?.lines.filter(l => l.r === 0).length === 2);
check('场景名与说明取自 # 和 >', sample.scene?.name === '咖啡店点单' && /街角咖啡店/.test(sample.scene?.setting ?? ''),
  `${sample.scene?.name} · ${sample.scene?.setting}`);
check('示例带一处岔路', !!sample.scene?.branch && sample.scene.branch.options.length === 2,
  `${sample.scene?.branch?.options.length} 条路`);
check('岔路挂在「我」的台词之后', sample.scene?.lines[sample.scene.branch.at].r === 0,
  sample.scene?.lines[sample.scene.branch.at].en);
check('中文类型名认得出', sample.scene?.branch.kind === 'cost', sample.scene?.branch.kind);
check('岔路里的英文也是半角',
  !/[^\x20-\x7E]/.test(sample.scene?.branch.prompt.en ?? '') &&
  sample.scene.branch.options.every(o => !/[^\x20-\x7E]/.test(o.say.en + o.react.en)));

/* ---------- 岔路：可选的两种行 ---------- */
const plain = C.parseDialogue(`我: Hi | 你好\n店员: Hello | 你好\n我: Thanks | 谢谢\n店员: Bye | 再见`, 'p1');
check('不写岔路就没有岔路', plain.scene?.branch === undefined);

const noKind = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? 应付一次意外 | Card machine is down. | 刷卡机坏了。\n` +
  `+ Cash is fine. | 现金可以。 > Five dollars. | 五块。\n` +
  `+ Phone works. | 手机也行。 > Sure. | 可以。\n` +
  `店员: OK. | 好。`, 'p2');
check('省掉类型也能解析', noKind.scene?.branch?.kind === 'other', noKind.errors.join(' / '));
check('三个分段时第一段当目标', noKind.scene?.branch?.task === '应付一次意外', noKind.scene?.branch?.task);

const enKind = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? probe | 应付一次追问 | Why that one? | 为什么点这个？\n` +
  `+ I like it. | 我喜欢。 > Fair enough. | 行吧。\n` +
  `+ No reason. | 没理由。 > Okay. | 好吧。\n` +
  `店员: OK. | 好。`, 'p3');
check('英文类型名也认', enKind.scene?.branch?.kind === 'probe', enKind.errors.join(' / '));

const badKind = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? 退款 | 目标 | Something. | 什么。\n店员: OK. | 好。`, 'p4');
check('不认识的类型会报错', badKind.errors.some(e => /不认识/.test(e)), badKind.errors[0]);

const oneOpt = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? 目标 | Something. | 什么。\n+ Cash. | 现金。 > Five. | 五。\n店员: OK. | 好。`, 'p5');
check('只有一条路不算岔路', oneOpt.errors.some(e => /至少写两行/.test(e)), oneOpt.errors[0]);

const orphanPlus = C.parseDialogue(
  `店员: Hi. | 你好。\n+ Cash. | 现金。 > Five. | 五。\n我: A latte. | 一杯。\n店员: OK. | 好。`, 'p6');
check('没有「?」的「+」会报错', orphanPlus.errors.some(e => /前面没有/.test(e)), orphanPlus.errors[0]);

const twoBranch = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? 目标一 | Something. | 什么。\n+ Cash. | 现金。 > Five. | 五。\n+ Phone. | 手机。 > Sure. | 行。\n` +
  `店员: OK. | 好。\n我: Thanks. | 谢谢。\n` +
  `? 目标二 | Another. | 另一个。\n+ Yes. | 是。 > Good. | 好。\n+ No. | 不。 > Fine. | 行。\n`, 'p7');
check('一场只能有一处岔路', twoBranch.errors.some(e => /只能写一处岔路/.test(e)), twoBranch.errors[0]);

const notAfterMe = C.parseDialogue(
  `店员: Hi. | 你好。\n? 目标 | Something. | 什么。\n+ Cash. | 现金。 > Five. | 五。\n我: A latte. | 一杯。`, 'p8');
check('岔路必须接在自己的台词之后', notAfterMe.errors.some(e => /接在「我:」的台词后面/.test(e)), notAfterMe.errors[0]);

const nextIsMine = C.parseDialogue(
  `店员: Hi. | 你好。\n我: A latte. | 一杯拿铁。\n` +
  `? 目标 | Something. | 什么。\n+ Cash. | 现金。 > Five. | 五。\n+ Phone. | 手机。 > Sure. | 行。\n` +
  `我: Thanks. | 谢谢。\n店员: OK. | 好。`, 'p9');
check('岔路后面接自己的台词会被拦下', nextIsMine.errors.some(e => /顶替/.test(e)), nextIsMine.errors[0]);

// 宽容：中文冒号、全角竖线、弯引号、破折号
const loose = C.parseDialogue(`# 试\n我：I’d like this — please｜我要这个。\n店员: Sure. | 好的。\n我: Thanks. | 谢谢。`, 'x2');
check('中文冒号/全角竖线都认', loose.scene !== null, loose.errors.join(' / '));
check('弯引号破折号折成 ASCII', loose.scene?.lines[0].en === "I'd like this - please", loose.scene?.lines[0].en);

// 错误要指得准
const noPipe = C.parseDialogue(`我: Hello there | 你好\n店员: Hi | 嗨\n我: Bye | 再见\n随便一行没有分隔符`);
check('缺分隔符报行号', noPipe.errors.some(e => /第 4 行/.test(e)), noPipe.errors[0]);
const badChar = C.parseDialogue(`我: I want 这个 | 我要这个\n店员: Okay | 好的\n我: Thanks | 谢谢`);
check('英文里的全角字符被抓出来', badChar.errors.some(e => /全角/.test(e)), badChar.errors[0]);
const noMe = C.parseDialogue(`店员: Hi | 嗨\n店员: Bye | 再见\n客人: Thanks | 谢谢\n客人: Bye | 再见`);
check('没有「我:」时给出指引', noMe.errors.some(e => /我:/.test(e)), noMe.errors[0]);
const noZh = C.parseDialogue(`我: Hello | \n店员: Hi | 嗨\n我: Bye | 再见`);
check('中文留空会报错', noZh.errors.some(e => /中文是空/.test(e)), noZh.errors[0]);
check('错误超过 0 条时不出场景', noPipe.scene === null);

// 多个对方角色：合并成「对方」，给一句提醒
const multi = C.parseDialogue(`我: Hi | 你好\n店员: Hello | 你好\n经理: Welcome | 欢迎\n我: Thanks | 谢谢`);
check('多个对方角色合并', multi.scene?.lines.filter(l => l.r === 1).length === 2, multi.scene?.roles[1]);
check('多角色有提醒', multi.warnings.some(w => /个角色/.test(w)), multi.warnings[0]);

// 缺场景名
const noName = C.parseDialogue(`我: Hi | 你好\n店员: Hello | 你好\n我: Thanks | 谢谢\n店员: Bye | 再见`);
check('没写场景名时给默认名', noName.scene?.name === '我的对话' && noName.warnings.some(w => /场景名/.test(w)));

// # 与 > 不计入台词
check('注释行不进台词', sample.scene?.lines.every(l => !l.en.startsWith('#') && !l.en.startsWith('>')));

try { fs.unlinkSync(TMP); } catch { /* ignore */ }

/* ---------------- 导入流程 ---------------- */
const br2 = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 1 },
});
const page = await br2.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('dialog', d => d.accept());

/** React 受控组件不能直接改 .value —— 要越过它自己的 setter */
const fill = async (text) => page.evaluate((t) => {
  const ta = document.querySelector('.dg-import-ta');
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  set.call(ta, t);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}, text);

try {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero');
  await page.evaluate(() => [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('场景对话'))?.click());
  await page.waitForSelector('.dg-grid');
  await sleep(400);

  const before = await page.evaluate(() => ({
    empty: !!document.querySelector('.dg-empty'),
    cards: document.querySelectorAll('.dg-cell').length,
  }));
  check('没导入过时给出提示', before.empty, `${before.cards} 张卡`);

  await page.evaluate(() => [...document.querySelectorAll('.page-head .btn')].find(x => x.textContent.includes('导入'))?.click());
  await page.waitForSelector('.dg-import');
  await sleep(300);

  check('导入按钮在没内容时是禁用的',
    await page.evaluate(() => document.querySelector('.dg-import-acts .btn-primary')?.hasAttribute('disabled')));

  await fill(C.SAMPLE);
  await sleep(300);
  const okState = await page.evaluate(() => ({
    count: document.querySelector('.dg-import-count')?.textContent ?? '',
    err: document.querySelectorAll('.dg-import-err li').length,
    disabled: document.querySelector('.dg-import-acts .btn-primary')?.hasAttribute('disabled'),
  }));
  check('边写边校验：示例通过', okState.err === 0 && !okState.disabled, okState.count);

  await fill(`${C.SAMPLE}\n随便一行没有分隔符`);
  await sleep(300);
  const badState = await page.evaluate(() => ({
    err: document.querySelector('.dg-import-err li')?.textContent ?? '',
    disabled: document.querySelector('.dg-import-acts .btn-primary')?.hasAttribute('disabled'),
  }));
  check('写错时列出问题并禁用导入', /第 \d+ 行/.test(badState.err) && badState.disabled, badState.err);

  await fill(C.SAMPLE);
  await sleep(300);
  await page.evaluate(() => document.querySelector('.dg-import-acts .btn-primary')?.click());
  await page.waitForSelector('.dg-scene', { timeout: 5000 });
  await sleep(400);

  const opened = await page.evaluate(() => ({
    title: document.querySelector('.dg-scene .page-title')?.textContent ?? '',
    tabs: [...document.querySelectorAll('.dg-tabs button')].map(x => x.textContent),
  }));
  check('导入后直接进这一场', opened.title === '咖啡店点单', opened.title);
  check('自建场五种练法都在', opened.tabs.length === 5, opened.tabs.join('/'));

  const stored = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1') || '{}');
    return (j.p?.customScenes ?? []).length;
  });
  check('存档里有一条自建对话', stored === 1, `${stored} 条`);

  // 通读：气泡数量对得上
  await sleep(200);
  const bubbles = await page.evaluate(() => document.querySelectorAll('.dg-bub').length);
  check('通读渲染导入的台词', bubbles === 5, `${bubbles} 条`);

  // 实战：没有岔路也要能整场走一遍
  await page.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '实战')?.click());
  await sleep(400);
  const liveBar = await page.evaluate(() => document.querySelector('.dg-bar span')?.textContent ?? '');
  check('自建场的实战按台词数算步数', /^1\s*\/\s*5$/.test(liveBar), liveBar);

  // 走到岔路：自建场也能有「对方突然改口」
  for (let n = 0; n < 10; n++) {
    if (await page.evaluate(() => !!document.querySelector('.dg-branch'))) break;
    const st = await page.evaluate(() => ({
      go: !!document.querySelector('.dg-go'),
      input: !!document.querySelector('.dg-input'),
    }));
    if (st.go) { await page.evaluate(() => document.querySelector('.dg-go')?.click()); await sleep(220); continue; }
    if (st.input) {
      await page.keyboard.type('zz');
      await page.keyboard.press('Enter');
      await sleep(180);
      await page.keyboard.press('Enter');
      await sleep(220);
    }
  }
  const branchUI = await page.evaluate(() => ({
    has: !!document.querySelector('.dg-branch'),
    en: document.querySelector('.dg-branch .dg-listen-en')?.textContent ?? '',
    task: document.querySelector('.dg-branch-task')?.textContent ?? '',
  }));
  check('导入的岔路出现在实战里', branchUI.has, branchUI.en.slice(0, 40));
  check('岔路显示导入时写的目标', /给个能继续走下去的办法/.test(branchUI.task), branchUI.task);

  // 照着第一条路打 → 接住，对方按这条反应
  const opt0 = sample.scene.branch.options[0];
  await page.keyboard.type(opt0.say.en, { delay: 0 });
  await page.keyboard.press('Enter');
  await sleep(400);
  const hit = await page.evaluate(() => ({
    up: !!document.querySelector('.dg-branch-tag.up'),
    react: document.querySelector('.dg-branch .dg-listen-en')?.textContent ?? '',
  }));
  check('照着参考说法打能接住', hit.up);
  check('对方按选的那条路反应', hit.react.trim() === opt0.react.en, hit.react.slice(0, 40));

  // 背打走完，验证能结算
  await page.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '背打')?.click());
  await sleep(400);
  for (let n = 0; n < 10; n++) {
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
  check('自建场能练完并结算', await page.evaluate(() => !!document.querySelector('.dg-sum')));

  // 回列表 → 删除
  await page.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到场景列表'))?.click());
  await page.waitForSelector('.dg-grid');
  await sleep(400);
  const listed = await page.evaluate(() => {
    const first = document.querySelector('.dg-cell');
    return {
      name: first?.querySelector('.dg-name')?.textContent ?? '',
      cat: first?.querySelector('.dg-cat')?.textContent ?? '',
      del: !!first?.querySelector('.dg-del'),
      empty: !!document.querySelector('.dg-empty'),
    };
  });
  check('自建对话排在最前并标为自建', listed.cat === '自建' && listed.name === '咖啡店点单', `${listed.cat} · ${listed.name}`);
  check('自建对话有删除按钮', listed.del);
  check('导入后提示消失', !listed.empty);

  await page.evaluate(() => document.querySelector('.dg-del')?.click());
  await sleep(500);
  const afterDel = await page.evaluate(() => {
    const j = JSON.parse(localStorage.getItem('typewake:v1') || '{}');
    return {
      custom: (j.p?.customScenes ?? []).length,
      scenes: Object.keys(j.p?.scenes ?? {}).length,
      cards: document.querySelectorAll('.dg-cell').length,
    };
  });
  check('删除后场景消失', afterDel.custom === 0, `剩 ${afterDel.cards} 张卡`);
  check('练习记录一并清掉', afterDel.scenes === 0);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await br2.close();
}

console.log(`\n${fail ? '✗' : '✓'} 自定义对话：${pass} 通过 / ${fail} 失败`);
if (fail || errs.length) process.exit(1);
