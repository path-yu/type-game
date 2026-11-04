/**
 * 建「词库」数据：43,000 多个语料词形 → 释义 / 例句 / 关联词，按首字母分片。
 *
 * 为什么这么拼：
 *   1. 释义用 WordNet 3.1（普林斯顿，词库界的老实人），按词性分组，一个词多个义项
 *      分条列出 —— 用户要的"不同上下文不同意思"就在这里，不合并成一句。
 *   2. 例句不从模型编，直接从语料里捞：22 本书 + 1419 篇选段里这句词真实出现过的句子，
 *      并且带着既有的中文译文。这比生成的例句可靠得多，也天然带着上下文。
 *   3. 音标只用在 dict.json 里已经有的，没有就留空 —— 不猜、不编。
 *
 * 产物（public/data/lex/）：
 *   index.json      词表 + 频次 + 词性位，够搜索和列表用
 *   a.json … z.json 每个字母一片，点开某个词才取
 *
 * 用法：node scripts/build-lexicon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public/data');
const WN = path.join(ROOT, 'data/raw/wordnet');
const OUT = path.join(DATA, 'lex');

const TOK = /[A-Za-z][A-Za-z'-]*/g;
const MAX_SENSES = 6;
const MAX_SENSE_EX = 2;
const MAX_LEX_EX = 3;
const MAX_REL = 6;

const log = (...a) => console.log('[lex]', ...a);

/* ---------------- 1. WordNet ---------------- */

/** data.noun 这一行的格式，见 WordNet 文档 5.1 节 */
function parseDataFile(file, ssType, offIndex) {
  const out = new Map(); // word → [{ p, d, x, syn }]
  const text = fs.readFileSync(path.join(WN, file), 'utf8');
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('  ')) continue; // 文件头是缩进的版权说明
    const bar = line.indexOf('|');
    if (bar < 0) continue;
    const head = line.slice(0, bar).trim();
    const glossRaw = line.slice(bar + 1).trim();
    const t = head.split(/\s+/);
    const wcnt = parseInt(t[3], 16);
    if (!Number.isFinite(wcnt)) continue;

    const words = [];
    const upper = new Set(); // 原文里是大写的形（IT / He / As 这类缩略与化学符号）
    let i = 4;
    for (let k = 0; k < wcnt && i + 1 < t.length; k++, i += 2) {
      // 形容词会带 (a)(p)(ip) 标记，去掉
      const raw = t[i].replace(/\([a-z]+\)$/, '').replace(/_/g, ' ');
      if (/^[A-Z]/.test(raw)) upper.add(raw.toLowerCase());
      words.push(raw.toLowerCase());
    }
    if (!words.length) continue;

    // gloss 里分号引号引起来的都是例句
    const ex = [];
    const d = glossRaw.replace(/;\s*"([^"]*)"|;\s*"([^"]*)"/g, (m, a, b) => {
      ex.push((a ?? b).trim());
      return '';
    }).replace(/\s+/g, ' ').trim();

    /*
     * 指针段：`@ 00001740 n 0000` 是上位词，`~` 是下位词，`!` 是反义词。
     * 每个指针 4 个 token（符号 / 目标偏移 / 词性 / 源目标词义位）。
     * 这里只收 @ 和 !，下位词太多（一个"动物"下面几千条），列出来没意义。
     */
    if (offIndex) offIndex.set(`${ssType}:${t[0]}`, words);
    const hyper = [], anto = [];
    if (i + 1 < t.length) {
      const pcnt = parseInt(t[i], 16);
      if (Number.isFinite(pcnt)) {
        i++;
        for (let k = 0; k < pcnt && i + 3 < t.length; k++, i += 4) {
          const sym = t[i], off = t[i + 1], pos = t[i + 2];
          if (sym === '@') hyper.push(`${pos}:${off}`);
          else if (sym === '!') anto.push(`${pos}:${off}`);
        }
      }
    }

    for (const w of words) {
      if (!out.has(w)) out.set(w, []);
      out.get(w).push({
        p: ssType, d, x: ex, o: t[0], syn: words.filter(o => o !== w).slice(0, MAX_REL),
        ...(hyper.length ? { h: hyper } : {}),
        ...(anto.length ? { a: anto } : {}),
        // 该词在这个 synset 里原文就是大写 → 这是缩略语/元素符号，不是这个词本身
        ...(upper.has(w) ? { up: 1 } : {}),
      });
    }
  }
  return out;
}

log('读 WordNet…');
const byOffset = new Map(); // "n:00001740" → 该 synset 的词
const wn = new Map();
for (const [file, ss] of [['data.noun', 'n'], ['data.verb', 'v'], ['data.adj', 'a'], ['data.adv', 'r']]) {
  const m = parseDataFile(file, ss, byOffset);
  for (const [w, senses] of m) {
    if (!wn.has(w)) wn.set(w, []);
    wn.get(w).push(...senses);
  }
  log(`  ${file.padEnd(11)} ${m.size} 词`);
}
log(`WordNet 合计 ${wn.size} 词`);

/*
 * 义项顺序来自 index.*，不是 data.*。
 * data.noun 是按 synset 偏移排的，一个词的几个义项在文件里是散开的 ——
 * 直接按读到的顺序摆，father 的第一条会变成「黑帮家族的头目」，
 * mother 的第一条会变成「灵感来源」，全乱。
 * index.noun 每行末尾那串偏移就是按词频排好的义项顺序。
 */
/*
 * 顺序必须按「词」分开存。
 * 同一个 synset 会被好几个词共享（hand / helping hand / mite …），
 * 用 "pos:offset" 做键的话，后写的词会把前一个词的序号覆盖掉 ——
 * 结果 hand 的第一条变成了「帮手」，因为那条来自 helping hand 的词频序。
 */
const order = new Map(); // word → Map("pos:offset" → 序号)
for (const [file, pos] of [['index.noun', 'n'], ['index.verb', 'v'], ['index.adj', 'a'], ['index.adv', 'r']]) {
  let text = '';
  try { text = fs.readFileSync(path.join(WN, file), 'utf8'); } catch { continue; }
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('  ')) continue;
    // 行尾有空格，split 后末尾会产生空串 —— 不 trim 就把空串当成了偏移
    const t = line.trim().split(/\s+/);
    const cnt = Number(t[2]);
    if (!['n', 'v', 'a', 'r'].includes(t[1]) || !Number.isFinite(cnt) || cnt <= 0) continue;
    const offs = t.slice(-cnt);
    const lemma = t[0].toLowerCase();
    if (!order.has(lemma)) order.set(lemma, new Map());
    const m = order.get(lemma);
    offs.forEach((o, i) => m.set(`${pos}:${o}`, i));
  }
}
log(`义项顺序索引 ${order.size} 条`);

/* ---------------- 2. 语料：词频 + 真实例句 ---------------- */

/*
 * 中文释义有两个来源：
 *   overrides.json  人工定的高频虚词（WordNet 根本不全：没有冠词、代词，
 *                   还会把 it/he/as 错配成 IT、氦、砷）
 *   merged.json     分批译出来的普通词，一个词一个数组，与义项顺序对应
 */
const OV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lex-zh/overrides.json'), 'utf8'));
const mergedPath = path.join(ROOT, 'data/lex-zh/merged.json');
/*
 * 精讲词条：人写的例句与用法解析（不是从语料里抓的）。
 * 语料例句能证明"这个词在真实文本里长什么样"，但给不了"怎么用、和谁搭配、
 * 容易和谁混"——这些只能人写。
 */
const curatedPath = path.join(ROOT, 'data/lex-zh/curated.json');
const CURATED = fs.existsSync(curatedPath) ? JSON.parse(fs.readFileSync(curatedPath, 'utf8')) : {};

/*
 * 交叉引用：解析的正文里提到别的精讲词时，把它记下来，界面上做成可点的链接。
 *
 * 精讲是一整套制度，词与词之间本来互相牵着 —— entail 的解析里说到
 * settlement、jointure、dower，读者读完一定会想接着看那几个。
 * 让它们能点，比让他手动去搜一次要省一整个来回。
 *
 * 只连精讲词（不是全库），否则中文行文里偶然出现的英文词会到处变成链接。
 */
{
  const terms = Object.keys(CURATED).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [w, v] of Object.entries(CURATED)) {
    const text = v.note ?? '';
    if (!text) continue;
    const hits = [];
    for (const t of terms) {
      if (t === w || t.length < 3) continue;
      // 词界：英文里 \b 对 "pin-money" 这类带连字符的词不好用，单独处理两侧
      const re = new RegExp(`(^|[^A-Za-z])${esc(t)}([^A-Za-z]|$)`, 'i');
      if (re.test(text)) hits.push({ t, at: text.toLowerCase().indexOf(t.toLowerCase()) });
    }
    if (hits.length) {
      hits.sort((a, b) => a.at - b.at);
      v.see = hits.slice(0, 8).map(x => x.t);
    } else {
      delete v.see;
    }
  }
}
const ZH_MERGED = fs.existsSync(mergedPath) ? JSON.parse(fs.readFileSync(mergedPath, 'utf8')) : {};
delete OV._comment;

const dict = JSON.parse(fs.readFileSync(path.join(DATA, 'dict.json'), 'utf8'));
const ipa = new Map(dict.words.map(x => [x.w, x.p || '']));
const zhGloss = new Map(dict.words.map(x => [x.w, x.z || '']));

const lemmaFile = JSON.parse(fs.readFileSync(path.join(DATA, 'lemma.json'), 'utf8'));
const lemmaOf = (w) => lemmaFile.map?.[w] || w;

/*
 * 规则兜底找原形。
 * lemma.json 只覆盖 11,339 个，剩下几万个屈折形式（walked / studies / happier）
 * 会查不到释义 —— 而它们恰恰是读者最常撞见的形式。
 * 按英语最常见的几条构词规则往回退，命中了就用原形的释义。
 */
function guessLemma(w) {
  const known = (x) => wn.has(x) || zhGloss.has(x);
  const tries = [];
  if (w.endsWith('ies')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) tries.push(w.slice(0, -2));
  if (w.endsWith('s')) tries.push(w.slice(0, -1));
  if (w.endsWith('ied')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) tries.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('ing')) tries.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  if (w.endsWith('ier')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('iest')) tries.push(w.slice(0, -4) + 'y');
  if (w.endsWith('ly')) tries.push(w.slice(0, -2));
  // 双写辅音：stopped → stop
  if (/(.)\1(ed|ing)$/.test(w)) tries.push(w.replace(/(.)\1(ed|ing)$/, '$1'));
  return tries.find(known) ?? null;
}

const freq = new Map();
const examples = new Map(); // word → [{ t, zh, src }]
/* 每个词在哪些书里出现过、各出现几次 —— 查完词能顺着跳到那本书 */
const srcCount = new Map(); // word → Map(src → count)

function bumpSrc(word, src) {
  if (!src) return;
  if (!srcCount.has(word)) srcCount.set(word, new Map());
  const m = srcCount.get(word);
  m.set(src, (m.get(src) ?? 0) + 1);
}

function addExample(word, t, zh, src) {
  if (!examples.has(word)) examples.set(word, []);
  const arr = examples.get(word);
  if (arr.length >= MAX_LEX_EX) return;
  if (arr.some(e => e.t === t)) return;
  arr.push({ t, zh, src });
}

function scanText(text, zhList, src) {
  const sents = text.split(/(?<=[.!?]["”']?)\s+/);
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i].trim();
    if (s.length < 12 || s.length > 240) continue;
    const seen = new Set();
    for (const raw of s.match(TOK) ?? []) {
      const w = raw.toLowerCase().replace(/^'+|'+$/g, '').replace(/'s$/, '');
      if (w.length < 2) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
      if (seen.has(w)) continue;
      seen.add(w);
      bumpSrc(w, src);
      addExample(w, s, zhList?.[i] ?? '', src);
    }
  }
}

log('扫语料…');
/*
 * 书名有两种写法：文章里是书名（"Moby Dick"），全书文件里用的是 slug（moby-dick），
 * 有些全书文件连 title 字段都没有。不统一就会统计成两本书，
 * 界面上也会出现 "moby-dick 584 次" 这种不该给读者看的东西。
 */
const fullIdx = JSON.parse(fs.readFileSync(path.join(DATA, 'full/index.json'), 'utf8'));
const BOOK_TITLE = new Map(); // 小写 → 正式书名
for (const [slug, info] of Object.entries(fullIdx.books ?? {})) {
  BOOK_TITLE.set(slug.toLowerCase(), info.title);
  if (info.title) BOOK_TITLE.set(info.title.toLowerCase(), info.title);
}
const canonSrc = (x) => (x ? BOOK_TITLE.get(String(x).toLowerCase()) ?? x : x);

const arts = JSON.parse(fs.readFileSync(path.join(DATA, 'articles.json'), 'utf8')).items;
// 文章里的书名也登记进来，避免同一本书两种写法
for (const a of arts) if (a.s) BOOK_TITLE.set(a.s.toLowerCase(), BOOK_TITLE.get(a.s.toLowerCase()) ?? a.s);
for (const a of arts) scanText(a.tx, null, canonSrc(a.s));
// 选段没有逐句译文，取整段译文按句切不齐，这里只留原文句

const fullDir = path.join(DATA, 'full');
for (const f of fs.readdirSync(fullDir).filter(x => x.endsWith('.json') && x !== 'index.json')) {
  const j = JSON.parse(fs.readFileSync(path.join(fullDir, f), 'utf8'));
  const en = j.en ?? j.src ?? [];
  const zh = j.tr ?? [];
  const title = canonSrc(f.replace(/\.json$/, ''));
  for (let i = 0; i < en.length; i++) addExampleRow(en[i], zh[i], title);
}
function addExampleRow(t, zh, src) {
  const s = String(t).trim();
  if (s.length < 12 || s.length > 240) return;
  const seen = new Set();
  for (const raw of s.match(TOK) ?? []) {
    const w = raw.toLowerCase().replace(/^'+|'+$/g, '').replace(/'s$/, '');
    if (w.length < 2) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
    if (seen.has(w)) continue;
    seen.add(w);
    bumpSrc(w, src);
    addExample(w, s, zh ?? '', src);
  }
}
log(`语料 ${freq.size} 个词形，有例句的 ${examples.size} 个`);

/* ---------------- 3. 组词条 ---------------- */

/** 这个词在哪几本书里出现得最多，最多 4 本 */
function srcRank(w) {
  const m = srcCount.get(w);
  if (!m) return {};
  const top = [...m].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return top.length ? { src: top } : {};
}

const POS_ORDER = { n: 0, v: 1, a: 2, r: 3 };
/*
 * 词表 = 语料里出现过的词 + 人工表里写过的词。
 * 只取语料会漏掉 albeit 这种"书里没出现、但读者会去查"的词 ——
 * 既然已经为它写了释义，就该在词库里能查到。
 */
const words = [...new Set([...freq.keys(), ...Object.keys(OV)])].sort();
const shards = new Map();
const index = [];
let withSense = 0, withEx = 0;

for (const w of words) {
  if (!/^[a-z][a-z'-]*$/.test(w)) continue;

  /*
   * 人工表先于一切。
   *
   * 原来这一段放在 WordNet 处理之后，结果是「WordNet 里根本没有的词」
   * 到不了人工表 —— ere / lest / albeit / methinks 这些古语词界面上查无此词，
   * 而公版书里满篇都是。人工表是唯一的释义来源时，它必须排在最前面。
   */
  const ov = OV[w];
  if (ov) {
    // 人工条目直接用，不再和 WordNet 混
    const list = ov.map(([p2, d2]) => ({ p: p2, d: '', zh: d2 }));
    const ex = examples.get(w) ?? [];
    const entry = {
      w,
      ...(ipa.get(w) ? { ipa: ipa.get(w) } : {}),
      f: freq.get(w) ?? 0,
      senses: list,
      ...(ex.length ? { ex } : {}),
      ...srcRank(w),
      // 人工表里的词也可能带精讲（means / works 这类），别在这一支漏掉
      ...(CURATED[w] ? { cur: CURATED[w] } : {}),
    };
    withSense++;
    if (ex.length) withEx++;
    const ch0 = w[0];
    if (!shards.has(ch0)) shards.set(ch0, {});
    shards.get(ch0)[w] = entry;
    index.push([w, entry.f, list.map(x => x.p).join(''), ex.length ? 1 : 0, CURATED[w] ? 1 : 0]);
    continue;
  }

  /*
   * 只留原文是小写的义项。
   * WordNet 不分大小写，IT（信息技术）、He（氦）、As（砷）会和 it / he / as
   * 混在同一个词头下 —— 之前就出过「it: 计算机与通信工程的分支」这种笑话。
   * 一个词若只剩大写义项，说明它本身没有独立的词条，交给下面的旧词典兜底。
   */
  const mapped = lemmaOf(w);
  const base = wn.has(mapped) || zhGloss.has(mapped) ? mapped : (guessLemma(w) ?? mapped);
  const pick = (x) => (x ?? []).filter(s => !s.up);
  /*
   * 屈折形式要和原形的义项合起来看，而不是二选一。
   * 之前只看词形本身：said 只剩形容词义「前面提到的那个人」，
   * saw 只剩名词「锯子」，made 只剩「制造的」—— 全都丢了真正的动词义。
   * 原形义项排前面（读者查 said 要的是 say），词形自己的义项接在后面。
   */
  /* 按 WordNet 的词频义序排，最常用的义项排第一 */
  /*
   * 排序两个层级：
   *   1. 先按词性分组，义项多的词性排前面（see 动词 20 条、名词 1 条 → 动词先行；
   *      time 名词多、go 动词多，各归各位）
   *   2. 组内按 WordNet 的词频义序
   * 只按序排会把 see 的第一条排成「主教座堂」，因为名词义序也是 0，跟动词打平。
   */
  const bySenseOrder = (arr, key) => {
    const m = order.get(key);
    const posSize = new Map();
    for (const x of arr) posSize.set(x.p, (posSize.get(x.p) ?? 0) + 1);
    return arr
      .map((x, i) => ({
        x,
        g: -(posSize.get(x.p) ?? 0),
        r: m?.get(`${x.p}:${x.o}`) ?? 999 + i,
      }))
      .sort((a, b) => a.g - b.g || a.r - b.r)
      .map(v => v.x);
  };
  let senses = bySenseOrder(pick(wn.get(w)), w);
  /*
   * 动名词（-ing）不并原形义项。
   * whaling 本身是「捕鲸」，把 whale 的「鲸 / 庞然大物」并进来，
   * 读者会以为 whaling 也能指鲸鱼。building / meeting 同理。
   * 屈折形式（said / saw / made）该并，-ing 派生词不该并。
   */
  const own0 = wn.get(w) ?? [];
  const gerund = /ing$/.test(w) && own0.length > 0 && own0.every(x => x.p === 'n');
  if (w !== base && wn.has(base) && !gerund) {
    const bs = bySenseOrder(pick(wn.get(base)), base);
    /*
     * 完全没有自身义项、又带 -ing 的词（whaling / farming）：
     * 只取原形的动词义（hunt for whales → 捕鲸），
     * 原形的名词义（鲸）不该给这个形式。
     */
    if (/ing$/.test(w) && !own0.length) {
      const vs = bs.filter(x => x.p === 'v');
      senses = vs.length ? vs : bs;
    } else {
      senses = [...bs, ...senses];
    }
    /*
     * 屈折形式优先给动词义。
     * saw 是「看见」的过去式，但 see 的名词义（主教座堂）在 WordNet 里排前面，
     * 直接按原顺序合并会让读者以为 saw 是个宗教词。凡 -ed/-ing/-s 形式且原形有动词义，
     * 就把动词义提到前面。
     */
    // 词形被词表映射过（said → say）也算屈折，不能只靠 -ed/-ing/-s 后缀
    if ((w !== mapped || /(ed|ing|s)$/.test(w)) && bs.some(x => x.p === 'v')) {
      senses = [...senses.filter(x => x.p === 'v'), ...senses.filter(x => x.p !== 'v')];
    }
  }

  if (!senses.length) {
    // 只有旧词典里那句中文，也先留着 —— 总比"查无此词"好
    const z = zhGloss.get(w) || zhGloss.get(base);
    if (!z) continue;
    // 旧词典的释义本来就是中文，直接当中文放，别塞进英文字段里显示成斜体
    senses = [{ p: '', d: '', zh: z, x: [], syn: [] }];
  }

  /* 把上位/反义指针解成词形，最多各 4 个，去掉自己 */
  const relOf = (senses0) => {
    const up = new Set(), opp = new Set();
    // 只看第一个义项：把 hunt/run 这种动词上位词混到名词词条里，反而看不懂
    for (const s0 of senses0.slice(0, 1)) {
      for (const o of s0.h ?? []) {
        const ws = byOffset.get(o);
        // 优先收单词（"cetacean" 好过 "cetacean mammal"），多字词排在后面
        // 优先收单词（"cetacean" 好过 "cetacean mammal"），多字词排在后面
        if (ws) for (const x of ws) if (x !== w && x.length > 1 && !up.has(x)) up.add(x);
      }
      for (const o of s0.a ?? []) {
        const ws = byOffset.get(o);
        if (ws) for (const x of ws) if (x !== w && !opp.has(x)) opp.add(x);
      }
    }
    const tidy = (arr) => [...arr]
      .sort((a, b) => (a.includes(' ') ? 1 : 0) - (b.includes(' ') ? 1 : 0) || a.length - b.length)
      .slice(0, 4);
    return {
      ...(up.size ? { up: tidy(up) } : {}),
      ...(opp.size ? { opp: tidy(opp) } : {}),
    };
  };

  const zhOf = ZH_MERGED[w];
  /*
   * 中文条数必须和义项数对齐，少一条就整体错位 ——
   * 界面上一行中文配着下一行英文，看不出错，只会觉得"这词翻得怪"。
   * 宁可整条中文都不要，也不能错位。
   */
  const seenGloss = new Set();
  const list = senses
    .filter(s => s.d && !seenGloss.has(s.p + s.d) && seenGloss.add(s.p + s.d))
    /*
     * 不再按词性重排。上面已经决定了顺序（屈折形式动词义在前），
     * 这里再按 n/v/a/r 排一次会把那个顺序推翻 —— saw 又回到「主教座堂」打头。
     */
    .slice(0, MAX_SENSES)
    .map(s => ({
      p: s.p,
      d: s.d,
      ...(s.zh ? { zh: s.zh } : {}),
      ...(s.x?.length ? { x: s.x.slice(0, MAX_SENSE_EX) } : {}),
      ...(s.syn?.length ? { s: s.syn } : {}),
    }));

  /*
   * 中文对位放在最后一步：按「去重后」的义项数比。
   * 之前拿去重前的数量比，woods 这种「5 条义项去重成 4 条」的词会误判成错位，
   * 结果整条中文被丢掉。
   */
  /*
   * 一条义项都没剩下：多半是 WordNet 里只有空 gloss 的词条（缩略语、专名），
   * 旧词典也查不到。这种条目留着就是一个点开什么都没有的壳，
   * 不如不进库 —— 界面上"查无此词"比"点开一片空白"诚实。
   */
  if (!list.length) continue;

  if (zhOf) {
    if (zhOf.length === list.length) {
      // 空串表示"这一条还没译"，不要写成 zh:""
      list.forEach((s, i) => { if (zhOf[i]) s.zh = zhOf[i]; });
    } else {
      console.warn(`[lex] ⚠ ${w}: 中文 ${zhOf.length} 条 / 义项 ${list.length} 个，跳过中文`);
    }
  }

  const ex = examples.get(w) ?? [];
  const entry = {
    w,
    ...(ipa.get(w) ? { ipa: ipa.get(w) } : {}),
    f: freq.get(w) ?? 0,
    ...(base !== w ? { l: base } : {}),
    senses: list,
    ...(ex.length ? { ex } : {}),
    ...srcRank(w),
    ...(CURATED[w] ? { cur: CURATED[w] } : {}),
    ...relOf(senses),
    ...(lemmaFile.detail?.[base]?.forms ? { forms: lemmaFile.detail[base].forms } : {}),
  };

  withSense++;
  if (ex.length) withEx++;

  const ch = w[0];
  if (!shards.has(ch)) shards.set(ch, {});
  shards.get(ch)[w] = entry;
  index.push([w, entry.f, list.map(s => s.p).join(''), ex.length ? 1 : 0, CURATED[w] ? 1 : 0]);
}

/* ---------------- 3.5 补足到 3.5 万 ---------------- */

/*
 * 语料里能查到释义的只有 2.7 万，剩下的差额用 WordNet 里"义项最多"的词补 ——
 * 义项多通常意味着常见（run/get/take 几十条），比按字母随机补有意义得多。
 * 补进来的词没有语料例句，前端会标成"暂无例句"，后续再补（见 plan 的第 6 步）。
 */
const TARGET = 35000;
if (index.length < TARGET) {
  const have = new Set(index.map(r => r[0]));
  const pool = [...wn.entries()]
    .filter(([w, senses]) => !have.has(w) && /^[a-z][a-z'-]{2,17}$/.test(w) && senses.length > 0)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  let added = 0;
  for (const [w, senses] of pool) {
    if (index.length >= TARGET) break;
    const seenGloss = new Set();
    const list = senses
      .filter(s => s.d && !seenGloss.has(s.p + s.d) && seenGloss.add(s.p + s.d))
      .sort((a, b) => (POS_ORDER[a.p] ?? 9) - (POS_ORDER[b.p] ?? 9))
      .slice(0, MAX_SENSES)
      .map(s => ({ p: s.p, d: s.d, ...(s.x?.length ? { x: s.x.slice(0, MAX_SENSE_EX) } : {}) }));

    const entry = { w, f: 0, senses: list };
    const ch = w[0];
    if (!shards.has(ch)) shards.set(ch, {});
    shards.get(ch)[w] = entry;
    index.push([w, 0, list.map(s => s.p).join(''), 0, CURATED[w] ? 1 : 0]);
    added++;
  }
  log(`补入 ${added} 个 WordNet 词（无语料例句）`);
}

index.sort((a, b) => a[0].localeCompare(b[0]));

/*
 * 精讲的主题索引：一个词可以同时在几个主题里。
 * 校验放在这里而不是另写脚本 —— 主题表与 curated 一旦对不上，
 * 界面上就会有空分组或者查不到的词，而那种错只有点开才知道。
 */
const topicsPath = path.join(ROOT, 'data/lex-zh/topics.json');
const TOPICS = fs.existsSync(topicsPath) ? JSON.parse(fs.readFileSync(topicsPath, 'utf8')) : {};
const topicList = [];
{
  const assigned = new Set();
  for (const [k, ws] of Object.entries(TOPICS)) {
    if (k.startsWith('_')) continue;
    const keep = ws.filter(w => {
      if (!CURATED[w]) { console.warn(`[lex] ⚠ 主题「${k}」里的 ${w} 没有精讲词条，已跳过`); return false; }
      assigned.add(w);
      return true;
    });
    topicList.push({ k, n: keep.length, w: keep });
  }
  const unassigned = Object.keys(CURATED).filter(w => !assigned.has(w));
  if (unassigned.length) {
    console.warn(`[lex] ⚠ ${unassigned.length} 个精讲词未归入任何主题：${unassigned.slice(0, 8).join(' ')}`);
  }
}

/* ---------------- 4. 落盘 ---------------- */

fs.mkdirSync(OUT, { recursive: true });
for (const [ch, obj] of shards) {
  fs.writeFileSync(path.join(OUT, `${ch}.json`), JSON.stringify(obj));
}

// 主题索引单独一份，很小：词库页要按主题浏览时不必再拉任何分片
fs.writeFileSync(path.join(OUT, 'topics.json'), JSON.stringify({ v: 1, groups: topicList }));

/*
 * 精讲单独一份，给阅读器用。
 * 读书时点开一个词，卡片刻那 151 条精讲里的一条就够 —— 不该为了这一条
 * 去拉 26 个字母分片（最大 3.4MB）。这份只有几百 KB，一次取完常驻。
 */
const curOnly = {};
for (const [w, v] of Object.entries(CURATED)) {
  curOnly[w] = { ...(v.note ? { note: v.note } : {}), ...(v.ex ? { ex: v.ex } : {}), ...(v.see ? { see: v.see } : {}) };
}
fs.writeFileSync(path.join(OUT, 'curated.json'), JSON.stringify({ v: 1, words: curOnly }));

const letters = [...shards.entries()]
  .map(([ch, obj]) => ({ ch, n: Object.keys(obj).length }))
  .sort((a, b) => a.ch.localeCompare(b.ch));

fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify({ v: 1, total: index.length, letters, rows: index }),
);

const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + 'KB';
log(`✅ ${index.length} 个词条 · ${letters.length} 片 · index ${kb('index.json')}`);
log(`   有释义 ${withSense} · 有例句 ${withEx}`);
log(`   样例 ${JSON.stringify(index[0])} / ${JSON.stringify(index[Math.floor(index.length / 2)])}`);
