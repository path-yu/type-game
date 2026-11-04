/**
 * 构建前清掉上一次的产物。
 *
 * 为什么不用 vite 自带的 `emptyOutDir`：它清空 dist 时会一次 `rmSync` 掉
 * dist/covers 里的全部封面（现在 55 个）。本机有一个安全删除钩子，
 * 单次删除超过 50 个文件就会被拦下 —— 于是空的 assets 与旧的 index.html
 * 留在磁盘上，构建中途失败，产物对不上，所有界面测试跑在坏产物上（曾经一次挂了 18 组）。
 *
 * 所以改成：vite 不再自己清（emptyOutDir: false），由这里只清「自己产出的那些」——
 * dist/assets 与 index.html，每次几个文件，远低于阈值；
 * dist/covers、dist/data、dist/fonts 是 public/ 里拷过来的，同名覆盖即可，不必删。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const OWN = ['assets', 'index.html'];

for (const name of OWN) {
  const p = path.join(DIST, name);
  if (!fs.existsSync(p)) continue;
  fs.rmSync(p, { recursive: true, force: true });
}
