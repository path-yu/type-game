/**
 * 把公版书切成可练的段落 —— 切段、清洗、难度分。
 *
 * 这套规则原来只写在 build-data.mjs 里。加新书时要复用同样的口径，
 * 否则新入库的书会和老文章长得不一样（同样的英文，判定出的难度分不同、
 * 一段切成两句还是三句也不同），而界面上它们是并排摆着的。
 */

/**
 * 切句：**直接用前端那一份**（src/lib/split.js）。
 *
 * 这里原来抄了一份，和 split.js 差了缩写表与句界前瞻 —— 结果 139 篇文章的
 * 「N 句」和前端实际渲染的段落数对不上，而译文是按前端那份对齐的。
 * 抄第二份就是制造第二个真相，所以现在只剩一个 import。
 */
import { splitSentences as splitRanges } from '../../src/lib/split.js';

export function splitSentences(p) {
  return splitRanges(p).map(s => s.text);
}

export const wordCount = s => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

/** 去掉 Gutenberg 的页头页脚 */
export function cleanGutenberg(raw) {
  let t = raw.replace(/\r\n?/g, '\n');
  const s = t.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK/);
  if (s >= 0) t = t.slice(t.indexOf('\n', s) + 1);
  const e = t.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK/);
  if (e >= 0) t = t.slice(0, e);
  return t;
}

/** 弯引号、破折号、省略号统一成 ASCII，去掉方括号注与强调符号 */
export function normalize(p) {
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

/** 目录、版权页、章节标题这类东西不是让人打字的材料 */
export function isCleanParagraph(p) {
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

/** 长段落按句子攒成 ~125 词的块，每块至少两句、以句末标点收尾 */
export function chunkParagraph(p, minW, maxW, targetW) {
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

/**
 * 难度分：一级词覆盖率 55% + 二级词覆盖率 30% + 句长 15%。
 * 分数越高越难；等级是按这个分数在全库里的排名等分出来的，不是绝对标准。
 */
export function analyzeItem(it, tierOf) {
  const TOK = /[A-Za-z][A-Za-z'-]*/g;
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
  it.nw = unknown + (n - t1 - t2 - unknown);
  const diff = 0.55 * (1 - t1 / n) + 0.30 * (1 - (t1 + t2) / n) + 0.15 * Math.min(avg / 32, 1);
  it.sc = Math.round(diff * 1000) / 1000;
  return it;
}
