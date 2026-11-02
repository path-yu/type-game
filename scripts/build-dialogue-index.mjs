/**
 * 从 dialogues.json 抽一份场景索引，给首页用。
 *
 * 为什么要有这个：dialogues.json 有 2.8 MB，而首页（地图页）只需要知道
 * "今天抽哪一场、那一场叫什么、CET 等级、你有几句台词、几个句型" ——
 * 为了这几个字段把整个语料库拉下来、再 parse 一遍，首屏就白等了大半秒。
 *
 * 索引约 140 KB，只含这些字段；完整语料在真正进入对话页时才拉。
 * 索引是从语料派生出来的，所以 audit-dialogue 会校验两者一致 ——
 * 忘了重跑本脚本，测试就会响。
 *
 * 用法：node scripts/build-dialogue-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public/data');

const bank = JSON.parse(fs.readFileSync(path.join(DATA, 'dialogues.json'), 'utf8'));

const items = bank.scenes.map(s => ({
  id: s.id,
  name: s.name,
  cat: s.cat,
  lv: s.lv,
  cefr: s.cefr,
  you: s.you,
  ny: (s.lines || []).filter(l => l.r === s.you).length,  // 你有几句台词
  np: (s.phrases || []).length,                          // 几个句型
}));

const out = { v: 1, total: items.length, items };
const file = path.join(DATA, 'dialogues-index.json');
fs.writeFileSync(file, JSON.stringify(out));
console.log(`✓ ${items.length} 场 → dialogues-index.json（${Math.round(fs.statSync(file).size / 1024)} KB）`);
