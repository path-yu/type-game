/**
 * 按"已知错误类型"筛查，而不是逐句读。
 *
 * 审了 215 句长句后，6 处问题全部落在三类里：
 *   1. 引号在长句中丢失 —— 原文有对话，译文变成无引号的转述
 *   2. 逻辑时序颠倒 —— only when / not until / before 被译反
 *   3. 数字与单位错配
 *
 * 这个脚本按这三类扫全库，输出待人工确认的清单。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

const rows = [];
const stat = {};

for (const a of arts) {
  const zh = tr[a.id];
  if (!zh) continue;
  const en = splitSentences(a.tx).map(x => x.text);

  for (let i = 0; i < Math.min(en.length, zh.length); i++) {
    const e = en[i];
    const z = zh[i] || '';
    if (!z) continue;

    /* 1. 引号丢失：原文有成对引号，译文一个「都没开 */
    const enQuotes = (e.match(/"/g) || []).length;
    const zhOpen = (z.match(/「/g) || []).length;
    const zhClose = (z.match(/」/g) || []).length;
    if (enQuotes >= 2 && zhOpen === 0 && zhClose === 0) {
      rows.push({ kind: '引号丢失', id: a.id, i, e, z });
      stat['引号丢失'] = (stat['引号丢失'] || 0) + 1;
      continue;
    }
    // 开了没关，或关比开多
    if (zhOpen !== zhClose) {
      rows.push({ kind: '引号不配对', id: a.id, i, e, z });
      stat['引号不配对'] = (stat['引号不配对'] || 0) + 1;
      continue;
    }

    /* 2. 时序：原文有 only when / not until 这类，译文却一个「才」都没有 */
    if (/\b(only when|not until|no sooner|hardly had|scarcely had)\b/i.test(e) &&
        !/才|直到|一…就|刚/.test(z)) {
      rows.push({ kind: '时序可疑', id: a.id, i, e, z });
      stat['时序可疑'] = (stat['时序可疑'] || 0) + 1;
      continue;
    }

    /* 3. 数字：原文与译文里的阿拉伯数字集合应当一致 */
    const numEn = (e.match(/\d[\d,.]*/g) || []).map(x => x.replace(/[,.]$/, '')).sort().join(',');
    const numZh = (z.match(/\d[\d,.]*/g) || []).map(x => x.replace(/[,.]$/, '')).sort().join(',');
    if (numEn !== numZh) {
      rows.push({ kind: '数字不一致', id: a.id, i, e, z, note: `EN[${numEn}] ZH[${numZh}]` });
      stat['数字不一致'] = (stat['数字不一致'] || 0) + 1;
    }
  }
}

rows.sort((x, y) => x.kind.localeCompare(y.kind) || x.id.localeCompare(y.id));

console.log(`命中 ${rows.length} 句`);
for (const [k, v] of Object.entries(stat).sort((a, b) => b[1] - a[1])) console.log(`  ${k}  ${v}`);

const only = process.argv[2];
const list = only ? rows.filter(r => r.kind === only) : rows;
const SHOW = +(process.argv[3] || 20);
console.log(`\n前 ${SHOW} 条：`);
for (const r of list.slice(0, SHOW)) {
  console.log(`\n[${r.kind}${r.note ? ' ' + r.note : ''}] ${r.id}#${r.i}`);
  console.log('  EN ' + r.e.slice(0, 150));
  console.log('  ZH ' + r.z.slice(0, 110));
}

fs.writeFileSync(path.join(ROOT, 'data/qa/risk-scan.json'), JSON.stringify(rows, null, 1));
console.log(`\n清单 → data/qa/risk-scan.json`);
