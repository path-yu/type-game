// 译文体检：不判定"翻得对不对"（那要人读），只找出**机器能确定有问题**的句子。
// 输出按严重度排序的清单，作为重译队列。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/split.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arts = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;

const CJK = /[\u4e00-\u9fa5]/g;
const cjkLen = s => (s.match(CJK) || []).length;
const enWords = s => (s.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;

const rows = [];
const stat = { total: 0, ok: 0, byKind: {} };
const add = (kind, weight, id, i, en, zh, note) => {
  rows.push({ kind, weight, id, i, en, zh, note });
  stat.byKind[kind] = (stat.byKind[kind] || 0) + 1;
};

for (const a of arts) {
  const zh = tr[a.id];
  if (!zh) continue;
  const en = splitSentences(a.tx).map(x => x.text);
  for (let i = 0; i < Math.min(en.length, zh.length); i++) {
    stat.total++;
    const e = en[i], z = zh[i] || '';
    const ew = enWords(e), cz = cjkLen(z);
    const ratio = cz / Math.max(1, ew);

    // 1. 长度严重失衡（正常 1 个英文词 ≈ 1.5–2.6 个汉字）
    if (cz >= 6 && ratio > 3.4) add('过长', 3, a.id, i, e, z, `1:${(ratio).toFixed(1)}`);
    else if (cz >= 6 && ratio < 0.85) add('过短', 3, a.id, i, e, z, `1:${(ratio).toFixed(1)}`);

    // 2. 英文没翻干净
    if (/[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(z) && !/^[A-Za-z]/.test(z)) {
      add('残留英文', 4, a.id, i, e, z, '');
    }

    // 3. 译文里没有中文
    if (cz < 3) add('几乎无中文', 5, a.id, i, e, z, '');

    // 4. 叠字 / 明显手滑
    if (/(的的|了了|是是|在在|和和|就就)/.test(z)) add('叠字', 5, a.id, i, e, z, '');

    // 5. 句末缺标点（整句只剩半截）
    if (cz >= 8 && !/[。！？…”」』】]$/.test(z.trim())) add('缺句末标点', 2, a.id, i, e, z, '');

    // 6. 全角半角混排：中文里出现半角逗号/句号
    if (/[\u4e00-\u9fa5],|,[\u4e00-\u9fa5]/.test(z) || /[\u4e00-\u9fa5]\.(?![0-9])/.test(z)) {
      add('标点混排', 1, a.id, i, e, z, '');
    }

    // 7. 直译痕迹：连续三个「的」，或「被被」类被动堆叠
    if (/的[^，。；]{1,6}的[^，。；]{1,6}的/.test(z)) add('直译痕迹', 2, a.id, i, e, z, '');
  }
}

if (!rows.length) stat.ok = stat.total;

rows.sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id));

console.log(`总句数 ${stat.total}，命中 ${rows.length} 句（${(rows.length / stat.total * 100).toFixed(1)}%）`);
console.log('按类型：');
for (const [k, v] of Object.entries(stat.byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(6)} ${v}`);
}

const TOP = +(process.argv[2] || 30);
console.log(`\n最需要重译的 ${TOP} 句：`);
for (const r of rows.slice(0, TOP)) {
  console.log(`\n[${r.kind}${r.note ? ' ' + r.note : ''}] ${r.id}#${r.i + 1}`);
  console.log('  EN ' + r.en.slice(0, 130));
  console.log('  ZH ' + r.zh.slice(0, 90));
}

fs.writeFileSync(path.join(ROOT, 'data/qa/retranslate.json'), JSON.stringify(rows, null, 1));
console.log(`\n清单已写入 data/qa/retranslate.json（${rows.length} 条）`);
