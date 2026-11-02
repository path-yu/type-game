/**
 * 构建产物的资源引用检查：CSS / HTML 里引用的本地文件，在 dist 里是不是真的存在。
 *
 * 为什么需要这个：这类错误**只在打包后出现**，开发模式看不见。
 * 真实的坑：@font-face 写的是 `url('./fonts/x.woff2')`，
 * 开发模式下 CSS 由 Vite 注入，基准 URL 是根目录，`./fonts/` 正好命中 public/fonts；
 * 打包后 CSS 变成 `/assets/index-xxx.css`，同一个相对路径就指向 `/assets/fonts/`，
 * 而字体在 `/fonts/` —— 全部 404，浏览器默默回退系统字体，界面「样式错乱」但不报错。
 *
 * 用法：node scripts/audit-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('  · 还没有 dist/，先跑 npm run build');
  process.exit(0);
}

/** 把 `url(x)` / `href="x"` / `src="x"` 里的本地路径解析成 dist 下的绝对路径 */
const resolve = (raw, fromFile) => {
  const clean = raw.replace(/^['"]|['"]$/g, '').trim();
  if (!clean || /^(data:|https?:|#|\/\/)/.test(clean)) return null;
  if (clean.startsWith('/')) return path.join(DIST, clean);
  // 以引用它的文件所在目录为基准
  return path.join(path.dirname(fromFile), clean);
};

const walk = dir => {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
};

const refs = [];
const collect = (file, re, kind) => {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = re.exec(text))) {
    const target = resolve(m[1], file);
    if (target) refs.push({ from: path.relative(DIST, file), to: target, raw: m[1].trim(), kind });
  }
};

for (const f of walk(DIST)) {
  if (f.endsWith('.css')) collect(f, /url\(([^)]+)\)/g, 'css');
  else if (f.endsWith('.html')) {
    collect(f, /(?:href|src)="([^"]+)"/g, 'html');
  }
}

const missing = refs.filter(r => !fs.existsSync(r.to));

console.log(`构建产物 ${walk(DIST).length} 个文件 · 检查 ${refs.length} 处引用`);
if (!missing.length) {
  console.log('  ✓ 引用的资源都存在');
} else {
  for (const m of missing) {
    console.log(`  ✗ ${m.kind} 里的 ${m.raw}（来自 ${m.from}）→ 解析到 ${path.relative(DIST, m.to)}，文件不存在`);
  }
  console.log('\n  相对路径的基准是引用它的文件，不是项目根。打包后 CSS 在 assets/ 下，');
  console.log('  写 `./fonts/x` 会去找 assets/fonts/x —— 该写成 `/fonts/x` 或 `../fonts/x`。');
  process.exitCode = 1;
}
