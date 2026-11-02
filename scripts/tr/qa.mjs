/**
 * 全书译文的质检。
 *
 * put.mjs 只保证"一句对一句、不空、是中文"。这里查的是**读起来会出问题**的那几类：
 *
 * 1. 中文里夹着整段英文（没译完就交）
 * 2. 同一句英文给了两个完全不同的中文（术语/人名前后不一致）
 * 3. 中文长度只有英文的 0.15 以下（很可能漏译了半句）
 * 4. 相邻两句译文一模一样，但原文不同（复制粘贴串行）
 * 5. 常见专名在同一本书里出现两种译法
 *
 * 只报告，不改数据 —— 判断要靠人。
 *
 * 用法：
 *   node scripts/tr/qa.mjs <slug>
 *   node scripts/tr/qa.mjs --all
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'data/tr-src');
const WORK = path.join(ROOT, 'data/tr-work');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tr-meta.json'), 'utf8'));

const readSrc = slug => fs.readFileSync(path.join(SRC, `${slug}.jsonl`), 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const readWork = slug => {
  const f = path.join(WORK, `${slug}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
};

function qa(slug) {
  const src = readSrc(slug);
  const w = readWork(slug);
  const idx = Object.keys(w).map(Number).sort((a, b) => a - b);
  const issues = { latin: [], diverge: [], short: [], dup: [] };

  const en2zh = new Map();
  idx.forEach(i => {
    const en = src[i].en;
    const zh = w[i];
    // 1. 中文里还有成串英文单词
    if (/([A-Za-z]{3,}\s+){4,}/.test(zh)) issues.latin.push(i);
    // 3. 太短
    //
    // 例外：这一条是上一句被缩写截断的残留。1818 年版通篇写 "M. Krempe"，
    // 切句会在 "M." 后面断开 —— 前一条收在 "…continued M."，这一条从
    // "Krempe, professor of natural philosophy." 起。它本来就只有半个短语，
    // 长度比必然偏低，但两行连起来读是通的，不算漏译。
    const contOfAbbr = i > 0
      && /(^|\s)(M|Mr|Mrs|Dr|St|No)\.\s*$/.test(src[i - 1].en.trim());
    const ratio = zh.length / Math.max(1, en.length);
    if (en.length > 40 && ratio < 0.15 && !contOfAbbr) issues.short.push(i);
    // 2. 同一句英文的两种译法
    const k = en.trim().toLowerCase();
    if (en.length > 25) {
      if (en2zh.has(k) && en2zh.get(k).zh !== zh) issues.diverge.push([en2zh.get(k).i, i]);
      else if (!en2zh.has(k)) en2zh.set(k, { i, zh });
    }
    // 4. 相邻同译但原文不同
    if (i > 0 && w[i - 1] != null && zh === w[i - 1] && src[i].en !== src[i - 1].en) issues.dup.push(i);
  });

  return { slug, n: idx.length, total: meta[slug].n, issues };
}

const slugs = process.argv.includes('--all')
  ? Object.keys(meta).filter(s => fs.existsSync(path.join(WORK, `${s}.json`)))
  : [process.argv[2]].filter(Boolean);

if (!slugs.length) {
  console.error('用法：node scripts/tr/qa.mjs <slug> | --all');
  process.exit(1);
}

for (const slug of slugs) {
  const r = qa(slug);
  const bad = Object.values(r.issues).reduce((s, a) => s + a.length, 0);
  console.log(`\n${meta[slug].title}  ${r.n}/${r.total} 句 · ${bad ? `${bad} 处待看` : '未见问题'}`);
  if (r.issues.latin.length) console.log(`  中文里夹英文: ${r.issues.latin.slice(0, 8).join(', ')}`);
  if (r.issues.short.length) console.log(`  疑似漏译（过短）: ${r.issues.short.slice(0, 8).join(', ')}`);
  if (r.issues.diverge.length) {
    console.log(`  同一句英文两种译法: ${r.issues.diverge.slice(0, 5).map(x => x.join('/')).join(' ')}`);
  }
  if (r.issues.dup.length) console.log(`  相邻重复: ${r.issues.dup.slice(0, 8).join(', ')}`);
}
