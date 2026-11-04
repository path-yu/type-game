/**
 * 打包产物体检：解开发布用的 tar.zst，检查界面能不能真的打开。
 *
 * 为什么单独做这一步：`npm test` 检查的是 `dist/`，而安装包装的是
 * `build/<通道>-<平台>-<架构>/…/Resources/*.tar.zst`。两者之间隔着一次拷贝，
 * 而那次拷贝曾经出过事 —— 早期只拷了 index.html，data/ 与 covers/ 没进去，
 * 装完就是白屏（开发服务器完全正常，所以看不出来）。
 *
 * 这里只做三件事，都是"缺了就必然打不开"的：
 *   1. views/mainview/index.html 存在，且它引用的 assets 都在
 *   2. data/ 有内容（文章、词库索引、全书目录）
 *   3. covers/ 非空
 *
 * 找不到打包产物时跳过（不是失败）—— 只跑前端开发时本来就没打过包。
 *
 * 用法：node scripts/audit-package.mjs [--channel=stable]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const channel = process.argv.find(a => a.startsWith('--channel='))?.slice(10) ?? 'stable';
const ROOT = path.resolve(import.meta.dirname, '..');
const BUILD = path.join(ROOT, 'build', `${channel}-win-x64`);

if (!fs.existsSync(BUILD)) {
  console.log(`▶ 打包产物体检 —— 没有 ${path.relative(ROOT, BUILD)}，跳过`);
  process.exit(0);
}

/* 找包里的 payload：Resources 下那个 *.tar.zst */
const resources = fs.readdirSync(BUILD).map(d => path.join(BUILD, d, 'Resources')).find(p => fs.existsSync(p));
const payload = resources && fs.readdirSync(resources).find(f => f.endsWith('.tar.zst'));
if (!payload) {
  console.error('✗ 打包产物里找不到 Resources/*.tar.zst —— 包没打完整');
  process.exit(1);
}

const raw = fs.readFileSync(path.join(resources, payload));
const tar = zlib.zstdDecompressSync(raw);

/* 顺序扫 tar 头，不解包：只要文件名与 index.html 的内容 */
const dec = new TextDecoder();
const entries = new Map();
let off = 0;
while (off + 512 <= tar.length) {
  const head = tar.subarray(off, off + 512);
  if (head[0] === 0) break;
  const name = dec.decode(head.subarray(0, 100)).replace(/\0.*$/, '');
  const size = parseInt(dec.decode(head.subarray(124, 136)).replace(/\0.*$/, '').trim(), 8) || 0;
  const body = name.endsWith('index.html') ? dec.decode(tar.subarray(off + 512, off + 512 + size)) : '';
  entries.set(name, { size, body });
  off += 512 + Math.ceil(size / 512) * 512;
}

const names = [...entries.keys()];
const find = (re) => names.filter(n => re.test(n));
const has = (re) => names.some(n => re.test(n));

let fail = 0;
const ok = (label, pass, detail = '') => {
  console.log(`  ${pass ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!pass) fail++;
};

console.log(`▶ 打包产物体检 —— ${path.relative(ROOT, path.join(resources, payload))}`);
console.log(`  条目 ${names.length} · 解压 ${(tar.length / 1024 / 1024).toFixed(0)} MB`);

/* 1. 入口与它引用的资源 */
const htmlPath = find(/views\/mainview\/index\.html$/)[0];
ok('有界面入口 index.html', !!htmlPath);
if (htmlPath) {
  const html = entries.get(htmlPath).body;
  const refs = [...html.matchAll(/(?:src|href)="\.?\/?([^"]+)"/g)]
    .map(m => m[1])
    .filter(r => !r.startsWith('http') && !r.endsWith('.svg')); // 图标缺失不影响打开
  const base = htmlPath.replace(/index\.html$/, '');
  const missing = refs.filter(r => !entries.has(base + r));
  ok(`入口引用的 ${refs.length} 个资源都在`, missing.length === 0, missing.join(' '));
}

/* 2. 数据：文章、词库、全书目录 —— 少一样都是空白页 */
for (const [label, re] of [
  ['文章 articles.json', /views\/mainview\/data\/articles\.json$/],
  ['词库索引 lex\/index\.json', /views\/mainview\/data\/lex\/index\.json$/],
  ['整本目录 full\/index\.json', /views\/mainview\/data\/full\/index\.json$/],
  ['译文 tr\.json', /views\/mainview\/data\/tr\.json$/],
]) {
  const hit = find(re)[0];
  ok(label, !!hit, hit ? `${(entries.get(hit).size / 1024).toFixed(0)} KB` : '');
}

/* 3. 封面：书架上没有封面只是难看，但一个都没有说明 public/ 没拷进来 */
const covers = find(/views\/mainview\/covers\/.+\.svg$/);
ok('封面 covers/', covers.length > 0, `${covers.length} 个`);

console.log(fail === 0 ? '\n  ✓ 打包产物可打开' : `\n  ❌ ${fail} 项不通过 —— 装上去会白屏或空白`);
process.exit(fail ? 1 : 0);
