/** 一次性：把 data/raw/books/1984.txt 切成 data/tr-src/nineteen-eighty-four.jsonl */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../../src/lib/split.js';
import { normalize } from '../lib/prose.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const raw = fs.readFileSync(path.join(ROOT, 'data/raw/books/1984.txt'), 'utf8').replace(/\r\n?/g, '\n');
const slug = 'nineteen-eighty-four';
const title = 'Nineteen Eighty-Four';

// 正文从 "PART ONE" 开始，到 "THE END" 结束（前面是 PGA 的版权页）
const s = raw.indexOf('PART ONE');
const e = raw.lastIndexOf('THE END');
const body0 = raw.slice(s, e > s ? e : undefined);

const paras = body0.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);

const clean = paras.map(p => {
  const lines = p.split(/\n/).filter(l => !/^\s*\*([\s*]*)\s*$/.test(l));
  const t = normalize(lines.join(' ').replace(/\s+/g, ' ').trim());
  const isHeading = t.length <= 60
    && !/[.!?"”’]$/.test(t)
    && (/^(PART|Part|Chapter|CHAPTER)\b/.test(t) || /^[A-Z][^a-z]*$/.test(t));
  return isHeading ? `${t}.` : t;
}).filter(Boolean);

const sents = splitSentences(clean.join('\n\n'));
fs.writeFileSync(
  path.join(ROOT, `data/tr-src/${slug}.jsonl`),
  sents.map((x, i) => JSON.stringify({ i, en: x.text })).join('\n') + '\n',
);

const metaPath = path.join(ROOT, 'data/tr-meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta[slug] = { title, gid: 0, n: sents.length, src: 'gutenberg.net.au/ebooks01/0100021' };
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1) + '\n');

console.log(slug, sents.length, '句');
console.log('前3句:', sents.slice(0, 3).map(x => x.text.slice(0, 60)));
