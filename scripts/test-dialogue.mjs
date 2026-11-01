// 场景对话：语料结构 + 比对逻辑 + 三种练法的端到端行为。
// 重点守两件事：标点/大小写不算错（否则用户被无关细节打断），
// 以及答错后回车能继续（input 一旦 disabled 就收不到键盘事件）。
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-dialogue.mjs');
const PORT = process.env.PORT || 4173;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0;
const fails = [];
const check = (name, cond, got = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${got ? `  ${got}` : ''}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${got ? `  ${got}` : ''}`); }
};

/* ------------------------- 1. 纯逻辑 ------------------------- */
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/dialogue.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const D = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));

const bad = D.validate(bank);
check('语料结构全部合格', bad.length === 0, bad.slice(0, 3).join(' / ') || `${bank.scenes.length} 场`);
check('场景数与难度在 1-7', bank.scenes.length >= 8 && bank.scenes.every(s => s.lv >= 1 && s.lv <= 7),
  `${bank.scenes.length} 场`);

const mineTotal = bank.scenes.reduce((n, s) => n + D.yourLines(s).length, 0);
check('两个角色的台词加起来正好是全篇',
  bank.scenes.every(s => D.linesOf(s, 'you').length + D.linesOf(s, 'other').length === s.lines.length),
  `${mineTotal} + ${bank.scenes.reduce((n, s) => n + D.linesOf(s, 'other').length, 0)} 句`);
check('换角也有足够的句子可练',
  bank.scenes.every(s => D.linesOf(s, 'other').length >= 3),
  bank.scenes.map(s => D.linesOf(s, 'other').length).join('/'));
const s0 = bank.scenes[0];
check('两个角色的句子不重叠',
  D.linesOf(s0, 'you').every(a => !D.linesOf(s0, 'other').includes(a)));
check('每场至少 3 句你的台词', bank.scenes.every(s => D.yourLines(s).length >= 3), `${mineTotal} 句可练`);

// 标点与大小写不计较
const t1 = 'Could I get a large latte, please?';
check('少标点不算错', D.diff(t1, 'could i get a large latte please').ok);
check('多了空格不算错', D.diff(t1, 'Could  I   get a large latte please').ok);
check('撇号可以省略', D.diff("I'm checking in.", 'im checking in').ok);
check('连字符可以分开', D.diff('a front-end role', 'a front end role').ok);
check('打错一个字母就算错', !D.diff(t1, 'Could I get a large latto please').ok);

// 错位要能回推成词
const d = D.diff('I would like to return this jacket.', 'I would like to return these jacket');
const words = D.errorWords('I would like to return this jacket.', d.wrong);
check('错位能定位到词', words.length > 0 && words.every(w => w.length >= 4), words.join(','));
const d2 = D.diff('Thank you for your help.', 'Thank you for your halp.');
const w2 = D.errorWords('Thank you for your help.', d2.wrong);
check('错词会去重且不含虚词', w2.length === 1 && w2[0] === 'help', w2.join(','));
// 撇号必须留在词里，否则 That's → thats，词库查不到，夜巡里就是空牌
const d3 = D.diff("That's fine, thank you.", "That's fine, thank yuo.");
const w3 = D.errorWords("That's fine, thank you.", d3.wrong);
check('所有格与缩写不会被拆坏', !w3.includes('thats') && w3.every(w => /^[a-z]+$/.test(w)), w3.join(','));

check('空位按词长画', D.maskOf('Hot or iced?') === '___  __  ____', JSON.stringify(D.maskOf('Hot or iced?')));
check('首字母提示', D.initials('Hot or iced?') === 'H o i', D.initials('Hot or iced?'));

// 跟读判分：按词对齐，容 20%
const say1 = D.scoreSay('Could I get a large latte, please?', 'could i get a large latte please');
check('说得一模一样算过', say1.pass && say1.ratio === 1, `${say1.matched}/${say1.total}`);

const say2 = D.scoreSay("I'm checking in for the flight to Seattle.", 'I am checking in for the flight to Seattle');
check('缩写展开后能对上', say2.pass && say2.ratio === 1, `${say2.matched}/${say2.total}`);

const say3 = D.scoreSay('Hot or iced?', 'hot or nice');
check('短句漏一个词就算没过', !say3.pass && say3.matched === 2, `${say3.matched}/${say3.total}`);

const say4 = D.scoreSay('Hot or iced?', 'hot or ice');
check('长词允许一个字母的出入', say4.pass, `${say4.matched}/${say4.total}`);

const long = 'Iced, please. And could you make it with oat milk?';
const say5 = D.scoreSay(long, 'Iced please and could you make it with milk');
check('长句容忍两成词没说清', say5.pass, `${say5.matched}/${say5.total}`);

const say6 = D.scoreSay(long, 'hello there how are you today my friend');
check('答非所问判不过', !say6.pass && say6.ratio < 0.3, `${say6.matched}/${say6.total}`);

const say7 = D.scoreSay('Where is the fitting room?', 'where is fitting room');
check('逐词标对，漏的词能被指出来', say7.pass === false || say7.words.length === 5, say7.words.map(w => (w.ok ? w.w : `[${w.w}]`)).join(' '));
check('漏词的位置准确', say7.words.filter(w => !w.ok).map(w => w.w).join(',') === 'the', say7.words.map(w => (w.ok ? '+' : '-') + w.w).join(' '));

const noYou = { v: 1, scenes: [{ id: 'x', name: 'x', cat: 'x', lv: 1, cefr: 'A1', setting: 'x', roles: ['你', '他'], you: 0, lines: [], phrases: [] }] };
check('校验器能挑出残缺语料', D.validate(noYou).length >= 2, D.validate(noYou).slice(0, 2).join(' / '));
try { fs.unlinkSync(TMP); } catch { /* ignore */ }

/* ------------------------- 2. 界面 ------------------------- */
const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--mute-audio'],
  defaultViewport: { width: 1320, height: 900, deviceScaleFactor: 1 },
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));

const store = async () => p.evaluate(() => JSON.parse(localStorage.getItem('typewake:v1') || '{}'));

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('typewake:theme', 'light'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForSelector('.hero');
  await sleep(400);

  const nav = await p.evaluate(() =>
    [...document.querySelectorAll('.side-item')].some(x => x.textContent.includes('场景对话')));
  check('侧边栏有入口', nav);

  await p.evaluate(() =>
    [...document.querySelectorAll('.side-item')].find(x => x.textContent.includes('场景对话'))?.click());
  await p.waitForSelector('.dg-grid', { timeout: 5000 });
  await sleep(400);

  const cards = await p.evaluate(() => document.querySelectorAll('.dg-card').length);
  check('场景列表渲染全部场景', cards === bank.scenes.length, `${cards} 张卡`);

  // 进第一场
  const first = bank.scenes[0];
  await p.click('.dg-card');
  await p.waitForSelector('.dg-thread', { timeout: 5000 });
  await sleep(300);

  const thread = await p.evaluate(() => ({
    bubbles: document.querySelectorAll('.dg-bub').length,
    me: document.querySelectorAll('.dg-bub.me').length,
    notes: document.querySelectorAll('.dg-note').length,
  }));
  check('通读渲染全部台词', thread.bubbles === first.lines.length, `${thread.bubbles} 条`);
  check('你的台词靠右', thread.me === D.yourLines(first).length, `${thread.me} 条`);

  // 跟打
  const mine = D.yourLines(first);
  await p.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '跟打')?.click());
  await sleep(350);
  const shown = await p.evaluate(() => document.querySelector('.dg-target')?.textContent ?? '');
  check('跟打显示英文原句', shown.replace(/\s+/g, ' ').trim() === mine[0].en, shown.slice(0, 42));

  await p.keyboard.type(mine[0].en, { delay: 0 });
  await p.keyboard.press('Enter');
  await sleep(320);
  const okFb = await p.evaluate(() => document.querySelector('.dg-fb')?.className ?? '');
  check('打对给出正确反馈', /ok/.test(okFb), `${mine[0].en.slice(0, 30)} → ${okFb || '（无）'}`);

  await sleep(900);   // 自动翻页
  const bar2 = await p.evaluate(() => document.querySelector('.dg-bar span')?.textContent ?? '');
  check('答对后自动翻到下一句', /^2\s*\/\s*/.test(bar2), bar2);

  // 背打：不给英文
  await p.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '背打')?.click());
  await sleep(350);
  const recall = await p.evaluate(() => ({
    target: !!document.querySelector('.dg-target'),
    mask: document.querySelector('.dg-mask')?.textContent ?? '',
    zh: document.querySelector('.dg-prompt-zh')?.textContent ?? '',
    bar: document.querySelector('.dg-bar span')?.textContent ?? '',
  }));
  check('背打不显示英文', !recall.target && !/[A-Za-z]{3,}/.test(recall.mask), recall.mask);
  check('背打给出中文与词数', recall.zh.length > 2 && recall.mask.includes('_'), recall.zh);
  check('切模式后从头开始', /^1\s*\/\s*/.test(recall.bar), recall.bar);

  const beforeHint = await p.evaluate(() => document.querySelector('.dg-mask')?.textContent ?? '');
  await p.evaluate(() => document.querySelector('.dg-hint-btn')?.click());
  await sleep(200);
  const afterHint = await p.evaluate(() => document.querySelector('.dg-mask')?.textContent ?? '');
  check('看首字母给出首字母', /^[A-Za-z]( [A-Za-z])+/.test(afterHint.trim()) && beforeHint.trim() !== afterHint.trim(),
    `${beforeHint.trim()} → ${afterHint.trim()}`);

  // 故意打错 → 显示正确句 → 回车继续
  await p.keyboard.type('zzzz', { delay: 10 });
  await p.keyboard.press('Enter');
  await sleep(300);
  const wrong = await p.evaluate(() => {
    const fb = document.querySelector('.dg-fb.bad');
    return {
      has: !!fb,
      line: fb?.querySelector('.dg-fb-line')?.textContent ?? '',
      err: fb?.querySelectorAll('.err').length ?? 0,
      readOnly: document.querySelector('.dg-input')?.hasAttribute('readonly') ?? false,
    };
  });
  check('答错亮出正确句', wrong.has && wrong.line.includes(mine[0].en.slice(0, 12)), wrong.line.slice(0, 40));
  check('错处的字符被标出', wrong.err > 0, `${wrong.err} 个字符`);
  check('答错后输入框仍可聚焦', wrong.readOnly);

  await p.keyboard.press('Enter');
  await sleep(350);
  const bar3 = await p.evaluate(() => document.querySelector('.dg-bar span')?.textContent ?? '');
  check('答错后回车能继续', /^2\s*\/\s*/.test(bar3), bar3);

  // 一路「看答案」推到结算
  for (let n = 0; n < 12; n++) {
    if (await p.evaluate(() => !!document.querySelector('.dg-sum'))) break;
    const state = await p.evaluate(() => ({
      fb: !!document.querySelector('.dg-fb'),
      reveal: [...document.querySelectorAll('.dg-link')].some(x => x.textContent === '看答案'),
    }));
    if (state.fb) { await p.keyboard.press('Enter'); await sleep(320); continue; }
    if (state.reveal) { await p.evaluate(() => [...document.querySelectorAll('.dg-link')].find(x => x.textContent === '看答案')?.click()); await sleep(220); continue; }
    await p.keyboard.type('zzz'); await p.keyboard.press('Enter'); await sleep(220);
  }

  const sum = await p.evaluate(() => ({
    has: !!document.querySelector('.dg-sum'),
    score: document.querySelector('.dg-sum-score')?.textContent ?? '',
    line: document.querySelector('.dg-sum-line')?.textContent ?? '',
    phrases: document.querySelectorAll('.dg-sum .dg-phrase').length,
  }));
  check('练完给出结算', sum.has, `${sum.score} · ${sum.line.slice(0, 24)}`);
  check('结算带上句型', sum.phrases === first.phrases.length, `${sum.phrases} 条`);

  // 进度与词回写
  const saved = await store();
  const scene = saved?.p?.scenes?.[first.id];
  check('场景成绩写入档案', !!scene && typeof scene.runs === 'number', JSON.stringify(scene));

  const today = await p.evaluate(() => Math.floor(Date.now() / 86400000));
  const learned = Object.entries(saved?.p?.mastery ?? {})
    .filter(([, st]) => st && st.due === today && st.er > 0).map(([w]) => w);
  check('打错的词进了今日夜巡队列', learned.length > 0, learned.slice(0, 6).join(', '));

  // 回列表 → 卡片标已完成
  await p.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到场景列表'))?.click());
  await p.waitForSelector('.dg-grid');
  await sleep(300);
  const doneMark = await p.evaluate(() => ({
    done: document.querySelectorAll('.dg-card.done').length,
    best: document.querySelector('.dg-best')?.textContent ?? '',
    sub: document.querySelector('.page-sub')?.textContent ?? '',
  }));
  check('已练过的场景有标记', doneMark.done === 1, `${doneMark.done} 张卡 · ${doneMark.best}`);
  check('顶部统计已练场次', /已练\s*1\s*场/.test(doneMark.sub), doneMark.sub.trim());

  /* ---------------- 跟读 ---------------- */
  // 注入假识别器：把要说的话放进 __nextSay，点麦克风时由它返回
  await p.evaluate(() => {
    window.__nextSay = '';
    window.__TYPEWAKE_ASR__ = () => window.__nextSay;
  });

  await p.click('.dg-card');
  await p.waitForSelector('.dg-thread');
  await p.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '跟读')?.click());
  await p.waitForSelector('.dg-mic', { timeout: 5000 });
  await sleep(300);

  const sayTab = await p.evaluate(() =>
    [...document.querySelectorAll('.dg-tabs button')].map(x => x.textContent));
  check('有跟读模式', sayTab.includes('跟读'), sayTab.join(' / '));

  const target1 = await p.evaluate(() => document.querySelector('.dg-speak-en')?.textContent ?? '');
  await p.evaluate(t => { window.__nextSay = t; }, target1);
  await p.click('.dg-mic');
  await sleep(400);

  const passState = await p.evaluate(() => ({
    cls: document.querySelector('.dg-say')?.className ?? '',
    head: document.querySelector('.dg-say-head')?.textContent ?? '',
    ok: document.querySelectorAll('.dg-say-words .ok').length,
    no: document.querySelectorAll('.dg-say-words .no').length,
  }));
  check('说对了判为通过', /pass/.test(passState.cls) && passState.no === 0, passState.head.trim());
  check('逐词都标成听清', passState.ok > 3, `${passState.ok} 个词`);

  await sleep(1800);   // 通过后自动进下一句
  const barSay = await p.evaluate(() => document.querySelector('.dg-bar span')?.textContent ?? '');
  check('说对后自动进下一句', /^2\s*\/\s*/.test(barSay), barSay);

  // 说错
  await p.evaluate(() => { window.__nextSay = 'hello there how are you'; });
  await p.click('.dg-mic');
  await sleep(400);
  const failState = await p.evaluate(() => ({
    cls: document.querySelector('.dg-say')?.className ?? '',
    no: document.querySelectorAll('.dg-say-words .no').length,
    heard: document.querySelector('.dg-say-heard')?.textContent ?? '',
  }));
  check('说错判为不通过', !/pass/.test(failState.cls), failState.cls);
  check('标出没说清的词', failState.no > 0, `${failState.no} 个词`);
  check('回显识别到的内容', /hello there/.test(failState.heard), failState.heard.trim());

  await p.evaluate(() => [...document.querySelectorAll('.dg-link')].find(x => x.textContent === '下一句')?.click());
  await sleep(300);
  const barSay2 = await p.evaluate(() => document.querySelector('.dg-bar span')?.textContent ?? '');
  check('可以跳过这一句', /^3\s*\/\s*/.test(barSay2), barSay2);

  // 剩下三句全部说对，走到结算
  for (let n = 0; n < 6; n++) {
    if (await p.evaluate(() => !!document.querySelector('.dg-sum'))) break;
    const t = await p.evaluate(() => document.querySelector('.dg-speak-en')?.textContent ?? '');
    if (!t) break;
    await p.evaluate(x => { window.__nextSay = x; }, t);
    await p.click('.dg-mic');
    await sleep(1900);
  }
  const saySum = await p.evaluate(() => ({
    has: !!document.querySelector('.dg-sum'),
    score: document.querySelector('.dg-sum-score')?.textContent ?? '',
    line: document.querySelector('.dg-sum-line')?.textContent ?? '',
  }));
  check('跟读也有结算', saySum.has, `${saySum.score} · ${saySum.line.slice(0, 26)}`);
  const saved2 = await store();
  check('跟读成绩写入档案', (saved2?.p?.scenes?.[first.id]?.runs ?? 0) >= 1, `runs=${saved2?.p?.scenes?.[first.id]?.runs}`);

  /* ---------------- 不支持时降级 ---------------- */
  await p.evaluate(() => {
    delete window.__TYPEWAKE_ASR__;
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });
  await p.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '通读')?.click());
  await sleep(250);
  await p.evaluate(() => [...document.querySelectorAll('.dg-tabs button')].find(x => x.textContent === '跟读')?.click());
  await sleep(350);
  const nosay = await p.evaluate(() => ({
    has: !!document.querySelector('.dg-nosay'),
    title: document.querySelector('.dg-nosay-title')?.textContent ?? '',
    acts: [...document.querySelectorAll('.dg-nosay-acts button')].map(x => x.textContent),
  }));
  check('没有识别能力时给出说明', nosay.has && /跑不了语音识别/.test(nosay.title), nosay.title);
  check('降级路径给出替代方案', nosay.acts.includes('改用跟打'), nosay.acts.join(' / '));

  await p.evaluate(() => [...document.querySelectorAll('.dg-nosay-acts button')].find(x => x.textContent === '改用跟打')?.click());
  await sleep(350);
  const switched = await p.evaluate(() => ({
    target: !!document.querySelector('.dg-target'),
    tabs: [...document.querySelectorAll('.dg-tabs button')].find(x => x.classList.contains('on'))?.textContent,
  }));
  check('降级后能切到跟打', switched.target && switched.tabs === '跟打', `当前 ${switched.tabs}`);

  /* ---------------- 角色互换 ---------------- */
  const roleBtns = await p.evaluate(() =>
    [...document.querySelectorAll('.dg-roles button')].map(x => x.textContent));
  check('练习模式有角色开关', roleBtns.length === 2, roleBtns.join(' / '));

  const before = await p.evaluate(() => document.querySelector('.dg-target')?.textContent ?? '');
  check('默认练自己的台词', before.trim() === D.linesOf(first, 'you')[0].en, before.trim().slice(0, 36));

  await p.evaluate(() => [...document.querySelectorAll('.dg-roles button')].find(x => x.textContent.startsWith('店员'))?.click());
  await sleep(350);
  const after = await p.evaluate(() => ({
    target: document.querySelector('.dg-target')?.textContent ?? '',
    bar: document.querySelector('.dg-bar span')?.textContent ?? '',
    hint: document.querySelector('.dg-roles-hint')?.textContent ?? '',
  }));
  check('换角后改练对方的台词', after.target.trim() === D.linesOf(first, 'other')[0].en, after.target.trim().slice(0, 36));
  check('换角后进度归零', /^1\s*\/\s*/.test(after.bar), after.bar);
  check('换角有说明', /先听懂/.test(after.hint), after.hint.trim());

  const storeBefore = await store();
  const bestBefore = storeBefore?.p?.scenes?.[first.id]?.best ?? 0;

  // 换角一路打错推完，只为验证成绩写到 swapBest
  await p.click('.dg-input');
  for (let n = 0; n < 16; n++) {
    if (await p.evaluate(() => !!document.querySelector('.dg-sum'))) break;
    const ro = await p.evaluate(() => document.querySelector('.dg-input')?.hasAttribute('readonly'));
    if (ro) { await p.keyboard.press('Enter'); await sleep(280); continue; }
    await p.keyboard.type('zzz');
    await p.keyboard.press('Enter');
    await sleep(220);
  }
  const swapSum = await p.evaluate(() => ({
    has: !!document.querySelector('.dg-sum'),
    line: document.querySelector('.dg-sum-line')?.textContent ?? '',
  }));
  check('换角也能练完并结算', swapSum.has, swapSum.line.slice(0, 24));

  const afterSwap = await store();
  const st = afterSwap?.p?.scenes?.[first.id];
  check('换角成绩单独记', typeof st?.swapBest === 'number', `swapBest=${st?.swapBest} best=${st?.best}`);
  check('换角不覆盖原来的最好成绩', (st?.best ?? null) === bestBefore, `${bestBefore} → ${st?.best}`);

  await p.evaluate(() => [...document.querySelectorAll('.dg-sum-acts button')].find(x => x.textContent.includes('回到场景列表'))?.click());
  await p.waitForSelector('.dg-grid');
  await sleep(300);
  const card = await p.evaluate(() => ({
    check: document.querySelector('.dg-card .dg-check')?.textContent ?? '',
    swap: document.querySelector('.dg-card .dg-best.swap')?.textContent ?? '',
  }));
  check('卡片标出两个角色都练过', card.check.includes('✓✓'), card.check);
  check('卡片显示换角成绩', /换角\s*\d+%/.test(card.swap), card.swap);

  check('页面无报错', errs.length === 0, errs.slice(0, 2).join(' / '));
} finally {
  await b.close();
}

console.log(`\n${fails.length ? '✗' : '✓'} 场景对话：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) process.exit(1);
