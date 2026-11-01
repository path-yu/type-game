/**
 * 句子译文补齐脚本（可断点续跑）
 *
 * 数据源：MyMemory 免费翻译接口（无需 key，匿名有日额度）
 * 产物：public/data/tr.json —— { id: [句1译文, 句2译文, ...] }
 * 缓存：data/cache/tr-cache.json —— 按句子文本去重，重复句子不再请求
 *
 * 用法：
 *   node scripts/translate.mjs --minutes 10        # 跑 10 分钟后自动收工
 *   node scripts/translate.mjs --limit 50          # 只翻 50 篇
 *   node scripts/translate.mjs --level 1           # 只翻第 1 档
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ART = path.join(ROOT, 'public/data/articles.json');
const TR = path.join(ROOT, 'public/data/tr.json');
const CACHE_DIR = path.join(ROOT, 'data/cache');
const CACHE = path.join(CACHE_DIR, 'tr-cache.json');

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const MINUTES = Number(arg('minutes', 10));
const LIMIT = Number(arg('limit', 99999));
const LEVEL = Number(arg('level', 0));

fs.mkdirSync(CACHE_DIR, { recursive: true });

const articles = JSON.parse(fs.readFileSync(ART, 'utf8')).items;
const trFile = fs.existsSync(TR) ? JSON.parse(fs.readFileSync(TR, 'utf8')) : { v: 1, map: {} };
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./g;
function splitSentences(text) {
  const g = text.replace(ABBR, m => m.replace('.', '\u0001'));
  const out = [];
  const re = /[.!?]+["'\u201d)\]]?\s+/g;
  let start = 0, m;
  while ((m = re.exec(g))) {
    const end = m.index + m[0].length;
    const t = text.slice(start, end).trim();
    if (t) out.push(t);
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function translate(text) {
  if (cache[text]) return cache[text];
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TypeWake/0.1 (edu demo)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (j.quotaFinished) throw new Error('QUOTA');
  const t = j?.responseData?.translatedText;
  if (!t || typeof t !== 'string' || /MYMEMORY WARNING/i.test(t)) throw new Error('BAD');
  cache[text] = t;
  return t;
}

const started = Date.now();
const budget = MINUTES * 60_000;
let done = 0, skipped = 0, failed = 0, chars = 0;

const todo = articles
  .filter(a => (LEVEL ? a.lv === LEVEL : true))
  .filter(a => !trFile.map[a.id])
  .slice(0, LIMIT);

console.log(`待翻译 ${todo.length} 篇（共 ${articles.length} 篇，已译 ${Object.keys(trFile.map).length} 篇）`);

for (const a of todo) {
  if (Date.now() - started > budget) { console.log('⏱ 到时间了，收工'); break; }
  const sents = splitSentences(a.tx);
  if (sents.length === 0) { skipped++; continue; }
  const out = [];
  let ok = true;
  let broken = 0;
  for (const s of sents) {
    if (s.length < 12) { out.push(''); continue; }   // 太短的片段不值得翻
    try {
      const t = await translate(s);
      out.push(t);
      chars += s.length;
      await sleep(180);
    } catch (e) {
      if (e.message === 'QUOTA') { console.log('⚠ 额度用尽，停止'); ok = false; break; }
      out.push('');
      broken++;
      failed++;
    }
  }
  if (!ok) break;
  // 只保存「整篇都翻到了」的，半成品会被下一轮重试
  if (broken === 0 && out.some(Boolean)) {
    trFile.map[a.id] = out;
    done++;
    if (done % 5 === 0) {
      fs.writeFileSync(TR, JSON.stringify(trFile));
      fs.writeFileSync(CACHE, JSON.stringify(cache));
      console.log(`  ${done} 篇 · ${chars} 字符 · ${Math.round((Date.now() - started) / 1000)}s`);
    }
  }
  await sleep(120);
}

fs.writeFileSync(TR, JSON.stringify(trFile));
fs.writeFileSync(CACHE, JSON.stringify(cache));
console.log(`✅ 本次 ${done} 篇 · 失败句 ${failed} · 跳过 ${skipped} · 累计 ${Object.keys(trFile.map).length}/${articles.length} 篇`);
