// 单句改写：node scripts/fix-tr.mjs data/tr-inbox/fix-xxx.json
// 输入 {"文章id": {"句序号(0基)": "新译文"}}，自动取全篇、替换、写回标准 inbox 格式。
// 这样不必为了改一句而把整篇译文重新贴一遍。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2];
if (!file) { console.error('用法: node scripts/fix-tr.mjs <patch.json>'); process.exit(1); }

const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/tr.json'), 'utf8')).map;
const patch = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));

const out = {};
let n = 0;
for (const [id, edits] of Object.entries(patch)) {
  const cur = tr[id];
  if (!cur) { console.error(`✗ ${id} 没有译文`); process.exit(1); }
  const next = [...cur];
  for (const [k, v] of Object.entries(edits)) {
    const i = +k;
    if (!(i >= 0 && i < next.length)) { console.error(`✗ ${id} 句序号 ${i} 越界（共 ${next.length} 句）`); process.exit(1); }
    if (!v || !v.trim()) { console.error(`✗ ${id}#${i} 空译文`); process.exit(1); }
    next[i] = v.trim();
    n++;
  }
  out[id] = next;
}

fs.writeFileSync(path.join(ROOT, 'data/tr-inbox/_patch.json'), JSON.stringify(out, null, 1));
console.log(`· 已生成 patch：${Object.keys(out).length} 篇 / 改了 ${n} 句`);
console.log('  下一步：node scripts/import-tr.mjs data/tr-inbox/_patch.json');
