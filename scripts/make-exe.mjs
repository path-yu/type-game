/**
 * 一条命令做出可执行的 exe，并放到仓库里的 release/。
 *
 * 为什么不用 `tauri build`：它会在 Windows 上顺便打 nsis 和 msi，
 * 需要下载 WiX/NSIS，慢且容易失败；而我们要的只是一个双击就能跑的单文件。
 * 所以这里走 `npm run build` + `cargo build --release`，
 * Tauri 会把 dist 整个嵌进二进制，产物就是那个 exe。
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

const run = (cmd, args, cwd) => {
  console.log(`\n· ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`\n✗ 失败：${cmd}（退出码 ${r.status}）`);
    process.exit(1);
  }
};

// 1) 前端产物先进 dist —— Tauri 在编译期把它嵌进二进制，
//    顺序反了就会打进上一次的 dist，看起来「改了没生效」
run('npm', ['run', 'build'], ROOT);

// 2) 编译 exe（release profile 已经开了 lto + strip，体积可控）
run('cargo', ['build', '--release'], path.join(ROOT, 'src-tauri'));

if (!fs.existsSync(EXE)) {
  console.error(`\n✗ 没找到 ${EXE}`);
  process.exit(1);
}

// 3) 复制到 release/，那里不被 .gitignore 排除，能跟着仓库走
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.copyFileSync(EXE, OUT);

const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
console.log(`\n✓ release/${NAME}  ${mb} MB`);
console.log('  提交前建议双击跑一次，确认不是白屏。');
