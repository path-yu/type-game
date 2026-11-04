/**
 * 义项顺序调整后，把已有中文重新对位。
 *
 * 中文数组是按「位次」存的（第 1 条中文配第 1 个义项）。一旦排序规则变了，
 * 数组还是那个数组，义项却换了位置 —— 数量对得上，内容全错位，
 * 这正是前面反复强调"看不出来"的那类错。
 *
 * 做法：拿上一版分片里「英文释义 → 中文」的对应关系，按新的义项顺序重排。
 * 找不到对应就整条丢掉，宁可没有也不留错位。
 *
 * 用法：node scripts/lex/realign.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LEX = path.join(ROOT, 'public/data/lex');
const mergedPath = path.join(ROOT, 'data/lex-zh/merged.json');
const dry = process.argv.includes('--dry');

const merged = JSON.parse(fs.readFileSync(mergedPath, 'utf8'));
const oldCache = new Map();
const oldShard = (ch) => {
  if (!oldCache.has(ch)) {
    const raw = execSync(`git show HEAD:public/data/lex/${ch}.json`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    oldCache.set(ch, JSON.parse(raw));
  }
  return oldCache.get(ch);
};
const newCache = new Map();
const newShard = (ch) => {
  if (!newCache.has(ch)) newCache.set(ch, JSON.parse(fs.readFileSync(path.join(LEX, `${ch}.json`), 'utf8')));
  return newCache.get(ch);
};

let moved = 0, dropped = 0, same = 0;
for (const w of Object.keys(merged)) {
  const zh = merged[w];
  const before = oldShard(w[0])[w]?.senses ?? [];
  const after = newShard(w[0])[w]?.senses ?? [];
  if (!before.length || !after.length) { dropped++; delete merged[w]; continue; }

  const beforeGloss = before.map(s => s.d);
  const afterGloss = after.map(s => s.d);
  if (beforeGloss.join('\u0001') === afterGloss.join('\u0001')) { same++; continue; }

  // 英文释义 → 中文
  const map = new Map();
  before.forEach((s, i) => { if (zh[i]) map.set(s.d, zh[i]); });
  /*
   * 部分对得上就保留对得上的部分，缺的留空 —— 空着不会误导人，
   * 整条扔掉反而让查 hand / head 这种核心词时没有中文。
   */
  const next = afterGloss.map(g => map.get(g) ?? '');
  const hit = next.filter(x => x).length;
  if (hit === 0) { dropped++; delete merged[w]; continue; }
  merged[w] = next;
  moved++;
  if (hit < next.length) console.log(`  ~ ${w}: ${next.length} 条中 ${hit} 条保留，${next.length - hit} 条空缺`);
}

console.log(`未变 ${same} · 重排 ${moved} · 丢弃 ${dropped} · 现有 ${Object.keys(merged).length}`);
if (dry) { console.log('--dry，不写盘'); process.exit(0); }
fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 1) + '\n');
