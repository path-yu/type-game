/**
 * 词库覆盖检查：对话语料里的词，有多少能查到中文。
 *
 * 查不到的词有两个实际后果：界面上没有释义，**打错了也不进夜巡**
 * （Drill 判断 `corpus.dict.get(w)?.z` 为空就跳过，免得夜巡发一张空牌）。
 * 所以这个脚本的阈值是 0 —— 有新语料引入词库外的词，就该补进
 * scripts/lib/dialog-words.mjs，而不是让它静静躺着。
 *
 * 用法：node scripts/audit-words.mjs [--list 40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLexicon } from './lib/words.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const LIST = Number(argv[argv.indexOf('--list') + 1]) || 20;

const LEX = loadLexicon(ROOT);
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dialogues.json'), 'utf8'));

const freq = new Map();
let total = 0;
for (const s of bank.scenes) {
  for (const l of s.lines) {
    for (const t of LEX.tokensOf(l.en)) {
      total++;
      if (LEX.isHard(t)) freq.set(t.key, (freq.get(t.key) ?? 0) + 1);
    }
  }
}

const missing = [...freq].sort((a, b) => b[1] - a[1]);
const covered = (1 - missing.reduce((n, [, c]) => n + c, 0) / total) * 100;

console.log(`对话语料 ${bank.scenes.length} 场 / ${total} 个词`);
console.log(`能查到释义：${covered.toFixed(2)}%`);

if (!missing.length) {
  console.log('\n  ✓ 没有词库外的词');
} else {
  console.log(`\n  词库外 ${missing.length} 个（出现 ${missing.reduce((n, [, c]) => n + c, 0)} 次）：`);
  console.log('  ' + missing.slice(0, LIST).map(([w, c]) => `${w}(${c})`).join(' '));
  console.log('\n  把它们补进 scripts/lib/dialog-words.mjs，再跑 npm run data:dict');
  process.exitCode = 1;
}
