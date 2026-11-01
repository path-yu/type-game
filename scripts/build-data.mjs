/**
 * TypeWake 数据构建流水线
 * ------------------------------------------------------------
 * 输入：data/raw/ecdict.csv、data/raw/lemma.en.txt、公版书、Simple English Wikipedia
 * 输出：public/data/dict.json、public/data/lemma.json、public/data/articles.json
 *
 * 全部来源许可：
 *   ECDICT (MIT) · Project Gutenberg (Public Domain) · Simple English Wikipedia (CC BY-SA 3.0)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RAW = path.join(ROOT, 'data/raw');
const OUT = path.join(ROOT, 'public/data');
const BOOKS = path.join(RAW, 'books');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(BOOKS, { recursive: true });

const log = (...a) => console.log('[data]', ...a);

/* ============================ 1. CSV ============================ */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/* ============================ 2. 词典 ============================ */
function buildDict() {
  const csvPath = path.join(RAW, 'ecdict.csv');
  if (!fs.existsSync(csvPath)) throw new Error('缺少 data/raw/ecdict.csv');
  log('解析 ECDICT ...');
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  log('  原始行数', rows.length);

  const seen = new Set();
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const w = r[0];
    if (!w || !/^[a-zA-Z][a-zA-Z'’-]*$/.test(w)) continue;
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    const bnc = Number(r[8]) || 0;
    const frq = Number(r[9]) || 0;
    if (!frq && !bnc) continue;
    seen.add(key);
    list.push({
      w: key,
      p: (r[1] || '').trim(),
      e: (r[2] || '').trim(),
      z: (r[3] || '').trim(),
      col: Number(r[5]) || 0,
      ox: Number(r[6]) || 0,
      g: (r[7] || '').trim(),
      bnc, frq,
      ex: (r[10] || '').trim(),
      rank: frq > 0 ? frq : bnc + 2000,
    });
  }

  list.sort((a, b) => a.rank - b.rank);
  const MAX = 7200;
  const picked = list.slice(0, MAX);

  const clean = (s, max) =>
    s.replace(/\\r/g, '')
      .split(/\\n|\r?\n/)
      .map(x => x.trim())
      .filter(x => x && !/^\[/.test(x))
      .slice(0, max)
      .join('\n');

  const words = picked.map((d, i) => {
    const o = { w: d.w };
    if (d.p) o.p = d.p;
    const z = clean(d.z, 4);
    if (z) o.z = z;
    const e = clean(d.e, 2);
    if (e) o.e = e;
    if (d.col) o.c = d.col;
    if (d.g) o.g = d.g.split(/\s+/).filter(Boolean);
    o.t = Math.min(5, Math.floor(i / 1000) + 1);
    if (d.ex) o.x = d.ex;
    return o;
  });

  log('  入库词条', words.length, '首词', words[0].w, '末词', words[words.length - 1].w);
  return words;
}

/* ============================ 3. Lemma 映射 ============================ */
const FORM_KEYS = { p: '过去式', d: '过去分词', i: '现在分词', 3: '第三人称单数', r: '比较级', t: '最高级', s: '复数' };

function parseExchange(ex) {
  // d:perceived/p:perceived/3:perceives/i:perceiving
  const out = { forms: {}, lemma: null };
  for (const part of ex.split('/')) {
    if (!part) continue;
    const k = part[0];
    const v = part.slice(2);
    if (!v) continue;
    if (k === '0') out.lemma = v;
    else if (FORM_KEYS[k]) out.forms[FORM_KEYS[k]] = v;
    else if (/^[1-9]$/.test(k)) out.forms['变体'] = v;
  }
  return out;
}

function buildLemma(words) {
  const map = {};               // form -> base
  const detail = {};            // base -> {过去式: ...}
  const vocab = new Set(words.map(w => w.w));

  for (const w of words) {
    if (!w.x) continue;
    const { forms, lemma } = parseExchange(w.x);
    if (lemma && vocab.has(lemma) && lemma !== w.w) map[w.w] = lemma;
    const f = {};
    for (const [k, v] of Object.entries(forms)) {
      if (!v || v === '-') continue;
      f[k] = v;
      if (vocab.has(v.toLowerCase())) map[v.toLowerCase()] = w.w;
    }
    if (Object.keys(f).length) detail[w.w] = f;
  }

  // 补充 lemma.en.txt（形如：be/4109826 -> is,was,are）
  const lp = path.join(RAW, 'lemma.en.txt');
  if (fs.existsSync(lp)) {
    const txt = fs.readFileSync(lp, 'utf8');
    for (const line of txt.split('\n')) {
      if (!line || line.startsWith(';')) continue;
      const i = line.indexOf('->');
      if (i < 0) continue;
      const base = line.slice(0, i).split('/')[0].trim().toLowerCase();
      if (!vocab.has(base)) continue;
      for (const f of line.slice(i + 2).split(',')) {
        const form = f.trim().toLowerCase();
        if (form && !map[form] && vocab.has(form) === false) map[form] = base;
      }
    }
  }

  log('  lemma 映射', Object.keys(map).length, '词形变化', Object.keys(detail).length);
  return { map, detail };
}

/* ============================ 4. 文本处理 ============================ */
function cleanGutenberg(raw) {
  let t = raw.replace(/\r\n?/g, '\n');
  const s = t.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK/);
  if (s >= 0) t = t.slice(t.indexOf('\n', s) + 1);
  const e = t.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK/);
  if (e >= 0) t = t.slice(0, e);
  return t;
}

function normalize(p) {
  return p
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\[[^\]]{0,40}\]/g, '')
    .replace(/[_*]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No|Fig|Vol|Ch)\./g;

function splitSentences(p) {
  const guarded = p.replace(ABBR, m => m.replace('.', '\u0001'));
  return guarded
    .split(/(?<=[.!?])\s+(?=["'A-Z])/)
    .map(x => x.replace(/\u0001/g, '.').trim())
    .filter(Boolean);
}

const wordCount = s => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

function isCleanParagraph(p) {
  if (p.length < 80 || p.length > 2400) return false;
  if (/GUTENBERG|Project Gutenberg|ebook/i.test(p)) return false;
  if (/^(CHAPTER|PART|BOOK|SECTION|ACT|SCENE)\b/i.test(p)) return false;
  if (/^[A-Z\s\d.,'-]{25,}$/.test(p)) return false;                 // 全大写标题
  if (/https?:|\bwww\.|@|\.com\b/i.test(p)) return false;
  const caps = (p.match(/[A-Z]/g) || []).length / p.length;
  if (caps > 0.32) return false;
  const letters = (p.match(/[A-Za-z]/g) || []).length;
  if (letters / p.length < 0.72) return false;
  const strange = (p.match(/[^A-Za-z0-9\s.,;:'"!?()\-%$&/]/g) || []).length;
  if (strange / p.length > 0.012) return false;
  return true;
}

function chunkParagraph(p, minW, maxW, targetW) {
  const sents = splitSentences(p);
  const out = [];
  let buf = [], n = 0;
  for (const s of sents) {
    const sw = wordCount(s);
    if (sw === 0) continue;
    if (sw > maxW * 1.4) continue;                                   // 超长句多半是排版噪音
    buf.push(s); n += sw;
    if (n >= targetW) { out.push(buf.join(' ')); buf = []; n = 0; }
  }
  if (buf.length && n >= minW * 0.7) out.push(buf.join(' '));
  return out.map(t => t.replace(/^[\s.,;:!?)"'\]]+/, '')).filter(t => {
    const w = wordCount(t);
    return w >= minW && w <= maxW && /[.!?"']$/.test(t) && splitSentences(t).length >= 2;
  });
}

async function fetchBook(id, slug) {
  const f = path.join(BOOKS, `${id}.txt`);
  if (fs.existsSync(f) && fs.statSync(f).size > 20000) return fs.readFileSync(f, 'utf8');
  const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
  log('  下载', slug, id);
  const res = await fetch(url, { headers: { 'User-Agent': 'TypeWake/0.1 (edu demo)' } });
  if (!res.ok) throw new Error(`${id} ${res.status}`);
  const t = await res.text();
  fs.writeFileSync(f, t);
  return t;
}

const SOURCES = [
  { id: 11339, key: 'aesop', title: 'The Aesop for Children', theme: 'fable', lic: 'PD', cap: 130 },
  { id: 11, key: 'alice', title: "Alice's Adventures in Wonderland", theme: 'novel', lic: 'PD', cap: 110 },
  { id: 55, key: 'oz', title: 'The Wonderful Wizard of Oz', theme: 'novel', lic: 'PD', cap: 110 },
  { id: 16, key: 'peterpan', title: 'Peter Pan', theme: 'novel', lic: 'PD', cap: 100 },
  { id: 45, key: 'anne', title: 'Anne of Green Gables', theme: 'novel', lic: 'PD', cap: 90 },
  { id: 120, key: 'garden', title: 'Treasure Island', theme: 'novel', lic: 'PD', cap: 90 },
  { id: 1661, key: 'sherlock', title: 'The Adventures of Sherlock Holmes', theme: 'mystery', lic: 'PD', cap: 90 },
  { id: 84, key: 'frank', title: 'Frankenstein', theme: 'novel', lic: 'PD', cap: 80 },
  { id: 1342, key: 'pride', title: 'Pride and Prejudice', theme: 'novel', lic: 'PD', cap: 80 },
  { id: 98, key: 'twocities', title: 'A Tale of Two Cities', theme: 'novel', lic: 'PD', cap: 80 },
  { id: 174, key: 'dorian', title: 'The Picture of Dorian Gray', theme: 'novel', lic: 'PD', cap: 80 },
  { id: 2701, key: 'moby', title: 'Moby Dick', theme: 'novel', lic: 'PD', cap: 80 },
];

async function gutenbergPassages() {
  const out = [];
  for (const src of SOURCES) {
    try {
      const raw = cleanGutenberg(await fetchBook(src.id, src.title));
      const paras = raw.split(/\n\s*\n+/).map(normalize).filter(isCleanParagraph);
      let n = 0;
      for (const p of paras) {
        for (const c of chunkParagraph(p, 55, 190, 125)) {
          out.push({ tx: c, s: src.title, k: src.key, th: src.theme, lic: src.lic, u: `gutenberg:${src.id}` });
          n++;
          if (n >= src.cap) break;
        }
        if (n >= src.cap) break;
      }
      log(`  《${src.title}》→ ${n} 段`);
    } catch (e) {
      log(`  ✗ 《${src.title}》 ${e.message}`);
    }
  }
  return out;
}

const UA = 'TypeWakeBot/0.1 (educational typing game; contact: typewake@example.com) node-fetch';

async function wikiPassages(target = 380) {
  const out = [];
  let rounds = 0, fails = 0;
  while (out.length < target && rounds < 90 && fails < 6) {
    rounds++;
    try {
      const url = 'https://simple.wikipedia.org/w/api.php?action=query&format=json&generator=random' +
        '&grnnamespace=0&grnlimit=20&prop=extracts&explaintext=1&exsectionformat=plain';
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      if (res.status === 429) { fails++; await sleep(1200 * fails); continue; }
      if (!res.ok) throw new Error(res.status);
      fails = 0;
      const j = await res.json();
      const pages = Object.values(j?.query?.pages || {});
      for (const pg of pages) {
        const title = pg.title || '';
        if (/^(List of|Lists of)/i.test(title)) continue;
        const text = pg.extract || '';
        if (text.length < 400) continue;
        const paras = text.split(/\n+/).map(normalize).filter(isCleanParagraph);
        let n = 0;
        for (const p of paras) {
          for (const c of chunkParagraph(p, 55, 180, 120)) {
            const theme = guessTheme(title + ' ' + c);
            out.push({ tx: c, s: title, k: 'wiki', th: theme, lic: 'CC BY-SA 3.0', u: `simple.wikipedia:${pg.pageid}` });
            n++;
            if (out.length >= target) break;
          }
          if (out.length >= target || n >= 2) break;
        }
      }
      await sleep(260);
    } catch (e) {
      fails++;
      log('  wiki 轮次失败', e.message);
      await sleep(900);
    }
  }
  log(`  Simple Wikipedia → ${out.length} 段`);
  return out;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function guessTheme(t) {
  const s = t.toLowerCase();
  if (/\b(war|battle|empire|king|queen|president|century|history|ancient)\b/.test(s)) return 'history';
  if (/\b(species|animal|plant|water|energy|cell|planet|climate|atom|disease|body)\b/.test(s)) return 'science';
  if (/\b(city|country|river|mountain|island|population|region)\b/.test(s)) return 'geo';
  if (/\b(film|music|book|artist|game|sport)\b/.test(s)) return 'culture';
  return 'science';
}

/* ============================ 5. 分级 ============================ */
function buildTierIndex(words) {
  const tier = new Map();
  for (const w of words) tier.set(w.w, w.t);
  return tier;
}

function analyze(items, tierOf) {
  const TOK = /[A-Za-z][A-Za-z'-]*/g;
  for (const it of items) {
    const toks = (it.tx.match(TOK) || []).map(t => t.toLowerCase().replace(/'s$/, ''));
    const n = toks.length || 1;
    let t1 = 0, t2 = 0, unknown = 0;
    for (const t of toks) {
      const k = tierOf.get(t);
      if (!k) unknown++;
      else if (k === 1) t1++;
      else if (k === 2) t2++;
    }
    const sents = splitSentences(it.tx);
    const avg = n / Math.max(1, sents.length);
    it.w = n;
    it.st = sents.length;
    it.avg = Math.round(avg * 10) / 10;
    it.t1 = t1 / n;
    it.nw = unknown + (n - t1 - t2 - unknown);            // 一级词之外的词数
    // 难度分：一级词覆盖率 55% + 二级词覆盖率 30% + 句长 15%
    const diff = 0.55 * (1 - t1 / n) + 0.30 * (1 - (t1 + t2) / n) + 0.15 * Math.min(avg / 32, 1);
    it.sc = Math.round(diff * 1000) / 1000;
  }
}

function assignLevels(items) {
  const sorted = [...items].sort((a, b) => a.sc - b.sc);
  const per = Math.floor(sorted.length / 7);
  sorted.forEach((it, i) => {
    it.lv = Math.min(7, Math.floor(i / per) + 1);
  });
  const hist = {};
  for (const it of items) hist[it.lv] = (hist[it.lv] || 0) + 1;
  log('  难度分布', JSON.stringify(hist));
}

/* ============================ 6. 主流程 ============================ */
async function main() {
  const dictOnly = process.argv.includes('--dict-only');
  const words = buildDict();
  const { map, detail } = buildLemma(words);

  if (dictOnly) {
    fs.writeFileSync(path.join(OUT, 'dict.json'), JSON.stringify({ v: 1, words }));
    fs.writeFileSync(path.join(OUT, 'lemma.json'), JSON.stringify({ v: 1, map, detail }));
    const kb2 = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + 'KB';
    log('✅ dict.json', words.length, '词', kb2('dict.json'));
    return;
  }

  const tierOf = buildTierIndex(words);

  log('拉取文本 ...');
  const [guten, wiki] = await Promise.all([gutenbergPassages(), wikiPassages()]);
  let items = [...guten, ...wiki];
  log('总段落', items.length);

  // 去重（开头 60 字符指纹）
  const seen = new Set();
  items = items.filter(it => {
    const k = it.tx.slice(0, 60).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  analyze(items, tierOf);
  assignLevels(items);

  // 每级内洗牌，保证推荐时不总是同一本书
  const byLevel = {};
  for (const it of items) (byLevel[it.lv] ||= []).push(it);
  for (const k of Object.keys(byLevel)) {
    const a = byLevel[k];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  const ordered = [];
  for (let lv = 1; lv <= 7; lv++) {
    for (const it of byLevel[lv] || []) {
      it.id = `${it.k}-${String(ordered.length).padStart(4, '0')}`;
      ordered.push(it);
    }
  }

  const payload = {
    v: 1,
    builtAt: new Date().toISOString(),
    sources: SOURCES.map(s => ({ title: s.title, license: s.lic, url: `https://www.gutenberg.org/ebooks/${s.id}` }))
      .concat([{ title: 'Simple English Wikipedia', license: 'CC BY-SA 3.0', url: 'https://simple.wikipedia.org' }]),
    items: ordered.map(it => ({
      id: it.id, tx: it.tx, s: it.s, lv: it.lv, sc: it.sc,
      w: it.w, st: it.st, avg: it.avg, nw: it.nw, th: it.th,
      lic: it.lic, u: it.u,
    })),
  };

  fs.writeFileSync(path.join(OUT, 'articles.json'), JSON.stringify(payload));
  fs.writeFileSync(path.join(OUT, 'dict.json'), JSON.stringify({ v: 1, words }));
  fs.writeFileSync(path.join(OUT, 'lemma.json'), JSON.stringify({ v: 1, map, detail }));

  const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + 'KB';
  log('✅ articles.json', payload.items.length, '篇', kb('articles.json'));
  log('✅ dict.json', words.length, '词', kb('dict.json'));
  log('✅ lemma.json', kb('lemma.json'));
}

main().catch(e => { console.error(e); process.exit(1); });
