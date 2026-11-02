/**
 * 一条命令做出可执行的 exe，并放进仓库里的 release/。
 *
 * ⚠️ 必须走 `tauri build`，不能直接 `cargo build --release`。
 *
 * 踩过这个坑：用 cargo 直接编出来的 exe 只有 3.1 MB，是个空壳 ——
 * 它编成了 dev 模式，运行时去连 tauri.conf.json 里的 devUrl（localhost:5183）。
 * 本机开着 vite 时看着正常，**换台电脑就是「无法访问此页面 ERR_CONNECTION_REFUSED」**。
 * tauri CLI 会设好环境变量，让 tauri-build 把 dist 整个嵌进二进制，
 * 体积因此涨到 4.6 MB，但双击就能跑，不依赖任何本地服务。
 *
 * 用 --no-bundle 跳过 nsis/msi：那一步要下 WiX/NSIS，慢且容易失败，
 * 而这里只需要一个单文件。
 *
 * 用法：node scripts/make-exe.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'TypeWake-0.1.0-win-x64.exe';
const EXE = path.join(ROOT, 'src-tauri/target/release/typewake.exe');
const OUT = path.join(ROOT, 'release', NAME);

// 空壳的体量在这个数量级；低于它多半是没嵌入 dist
const MIN_MB = 4;

const run = (cmd, args) => {
  console.log(`\n· ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`\n✗ 失败：${cmd}（退出码 ${r.status}）`);
    process.exit(1);
  }
};

// tauri build 自己会跑 beforeBuildCommand（npm run build），不用单独构建前端
run('npx', ['tauri', 'build', '--no-bundle']);

if (!fs.existsSync(EXE)) {
  console.error(`\n✗ 没找到 ${EXE}`);
  process.exit(1);
}

const size = fs.statSync(EXE).size;
const mb = size / 1048576;
if (mb < MIN_MB) {
  console.error(
    `\n✗ 产物只有 ${mb.toFixed(2)} MB，低于 ${MIN_MB} MB —— 多半没嵌入前端资源，`
    + '换台电脑会打开一片空白。检查是不是走了 cargo build。',
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.copyFileSync(EXE, OUT);
console.log(`\n✓ release/${NAME}  ${mb.toFixed(2)} MB`);
console.log('  换台电脑验证过再提交：把 exe 单独拷到另一个目录，双击看能不能进主界面。');
