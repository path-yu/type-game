// FSRS 记忆调度的行为测试。
// 重点不是公式对不对（那是上游的事），而是这三条必须成立：
//   1. 记住得越多，下次间隔越长
//   2. 忘了之后，间隔要缩回去
//   3. 遗忘曲线在 t=S 时正好是 0.9
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-fsrs.mjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/fsrs.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
});
const F = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

let pass = 0;
const fails = [];
const ok = (name, cond, got = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${got ? `  ${got}` : ''}`); }
  else { fails.push(name); console.log(`  ✗ ${name}${got ? `  ${got}` : ''}`); }
};

const D0 = 0;

/* 1. 遗忘曲线 */
ok('刚复习完记得住的概率是 1', Math.abs(F.retrievability(0, 10) - 1) < 1e-9, F.retrievability(0, 10).toFixed(4));
ok('间隔等于稳定度时保持率 0.9', Math.abs(F.retrievability(10, 10) - 0.9) < 1e-6, F.retrievability(10, 10).toFixed(6));
ok('保持率随时间单调下降', F.retrievability(0, 10) > F.retrievability(5, 10) && F.retrievability(5, 10) > F.retrievability(30, 10));
ok('稳定度越高，同一天保持率越高', F.retrievability(10, 5) < F.retrievability(10, 20));

/* 2. 排期与稳定度一致 */
ok('r=0.9 时 间隔≈稳定度', Math.abs(F.intervalFor(10, 0.9) - 10) <= 1, `${F.intervalFor(10, 0.9)} 天 / S=10`);

/* 3. 连续答对，间隔必须越来越长 */
let m = F.review(null, 3, D0);
const firstInt = m.due - D0;
let prev = m;
const growth = [firstInt];
for (let i = 0; i < 4; i++) {
  m = F.review(prev, 3, prev.due);
  growth.push(m.due - prev.due);
  prev = m;
}
ok('连续答对间隔递增', growth.every((v, i) => i === 0 || v > growth[i - 1]), growth.join(' → ') + ' 天');
ok('五次答对后间隔超过一个月', growth[growth.length - 1] > 30, `${growth[growth.length - 1]} 天`);

/* 4. 忘记之后必须缩回去 */
const before = prev.s;
const afterForget = F.review(prev, 1, prev.due);
ok('忘记后稳定度下降', afterForget.s < before, `S ${before.toFixed(1)} → ${afterForget.s.toFixed(1)}`);
ok('忘记后间隔缩短', afterForget.due - prev.due < growth[growth.length - 1], `${afterForget.due - prev.due} 天`);

/* 5. 难度 */
const easy = F.review(null, 4, D0);
const hard = F.review(null, 1, D0);
ok('评 easy 的词比 again 的词更容易', easy.d < hard.d, `${easy.d.toFixed(2)} vs ${hard.d.toFixed(2)}`);
ok('难度落在 1–10', [easy.d, hard.d].every(d => d >= 1 && d <= 10));
ok('首次 easy 的初始间隔比 again 长', easy.due - D0 > hard.due - D0, `${easy.due - D0} vs ${hard.due - D0} 天`);

/* 6. 越接近遗忘时复习，涨得越多（必要难度） */
const fresh = F.review(null, 3, D0);
const sEarly = F.review(fresh, 3, D0 + 1).s;
const sLate = F.review(fresh, 3, D0 + F.intervalFor(fresh.s) * 3).s;
ok('越接近遗忘时复习，稳定度涨得越多', sLate > sEarly, `${sEarly.toFixed(2)} vs ${sLate.toFixed(2)}`);

/* 7. 状态文本 */
ok('状态文本能读', /复习|记得/.test(F.memoryLabel(F.review(null, 3, D0), D0)));

try { fs.unlinkSync(TMP); } catch {}
console.log(`\n${fails.length ? '✗' : '✓'} FSRS：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) process.exit(1);
