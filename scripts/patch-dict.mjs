/**
 * 把对话语料的补充词条并进 dict.json。
 *
 * 为什么不直接改 build-data：那个脚本要从 data/raw/ecdict.csv 重建 7200 词，
 * 而 raw 数据不在仓库里（几十兆），重跑不了。所以补充词条走这个补丁：
 * 幂等（已经有的词跳过），可以反复跑。
 *
 * 用法：node scripts/patch-dict.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dialogWordEntries } from './lib/dialog-words.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'public/data/dict.json');

const dict = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const have = new Set(dict.words.map(w => w.w));

const add = dialogWordEntries().filter(e => !have.has(e.w));
const dup = dialogWordEntries().filter(e => have.has(e.w));

if (dup.length) {
  console.log(`  · ${dup.length} 条已存在，跳过：${dup.slice(0, 8).map(x => x.w).join(' ')}`);
}
if (!add.length) {
  console.log('  ✓ 词库已是最新，无需追加');
} else {
  dict.words.push(...add);
  fs.writeFileSync(FILE, JSON.stringify(dict));
  console.log(`  ✓ 追加 ${add.length} 条 → 词库 ${dict.words.length} 词`);
}
