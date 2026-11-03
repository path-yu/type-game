/**
 * 一键全量校验：数据层 + 界面层，一条命令跑完。
 *
 * 用法：npm test
 *
 * 顺序是有讲究的：
 *   1. verify  —— 结构（句数对齐 / 无空句）。数据错位时，后面所有测试都无意义，先跑它。
 *   2. qa      —— 内容（空句 / 机翻痕迹 / 非中文 / 病句）。只对硬错误失败。
 *   3. e2e     —— 界面（49 项交互断言）
 *   4. speech  —— 语音（7 项取消行为）
 *
 * 为什么合并：数据和代码是两条独立的改动路径。改了 tr.json 只跑 e2e 会全绿——
 * 因为 e2e 断言的是交互，不看译文；改了组件只跑 verify 也会全绿。两条都得跑才算验过。
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 4173;

const steps = [
  { name: '结构校验', cmd: 'node', args: ['scripts/verify-tr.mjs'], desc: '句数对齐 / 无空句' },
  { name: '内容质检', cmd: 'node', args: ['scripts/qa-tr.mjs', '--check'], desc: '空句 / 机翻痕迹 / 病句' },
  { name: '全书质检', cmd: 'node', args: ['scripts/qa-full.mjs'], desc: '21 本全书译文 / 空译 / 照抄' },
  { name: '释义贴合', cmd: 'node', args: ['scripts/test-gloss.mjs'], desc: '22 项义项 / 全库哨兵' },
  { name: '推荐顺序', cmd: 'node', args: ['scripts/test-recommend.mjs'], desc: '6 项续读 / 确定性' },
  { name: '记忆调度', cmd: 'node', args: ['scripts/test-fsrs.mjs'], desc: '14 项 FSRS 行为' },
  { name: '易混词', cmd: 'node', args: ['scripts/test-confuse.mjs'], desc: '23 项判定 / 错开' },
  { name: '端到端', cmd: 'node', args: ['scripts/e2e.mjs'], desc: '49 项交互断言', needsServer: true },
  { name: '每日卷轴', cmd: 'node', args: ['scripts/test-daily.mjs'], desc: '14 项确定性 / 连续 / 预告', needsServer: true },
  { name: '今日对话', cmd: 'node', args: ['scripts/test-daily-scene.mjs'], desc: '27 项抽取 / 直达 / 记账 / 待重温', needsServer: true },
  { name: '对话语料体检', cmd: 'node', args: ['scripts/audit-dialogue.mjs'], desc: '重复句 / 难度失真 / 岔路覆盖 / 体积', needsServer: false },
  { name: '词库覆盖', cmd: 'node', args: ['scripts/audit-words.mjs'], desc: '对话台词 100% 有释义', needsServer: false },
  { name: '场景等级', cmd: 'node', args: ['scripts/audit-level.mjs'], desc: '等级分布 / 词汇画像 / 阈值', needsServer: false },
  { name: '资源路径', cmd: 'node', args: ['scripts/audit-assets.mjs'], desc: '构建产物里的引用是否都存在', needsServer: false },
  { name: '续读链路', cmd: 'node', args: ['scripts/test-seq.mjs'], desc: '6 项段号 / 同书续读', needsServer: true },
  { name: '预习卡', cmd: 'node', args: ['scripts/test-pretest.mjs'], desc: '12 项先测后学', needsServer: true },
  { name: '打字手感', cmd: 'node', args: ['scripts/test-flow.mjs'], desc: '14 项连击段位 / 护盾 / 句末结算', needsServer: true },
  { name: '文库浏览', cmd: 'node', args: ['scripts/test-library.mjs'], desc: '12 项全库 / 筛选 / 进入阅读', needsServer: true },
  { name: '阅读页', cmd: 'node', args: ['scripts/test-reader.mjs'], desc: '16 项全文 / 译文位置 / 生词 / 跳转', needsServer: true },
  { name: '场景对话', cmd: 'node', args: ['scripts/test-dialogue.mjs'], desc: '114 项语料 / 搜索 / 收藏 / 进度 / 排序 / 岔路', needsServer: true },
  { name: '自定义对话', cmd: 'node', args: ['scripts/test-custom.mjs'], desc: '49 项解析 / 岔路 / 导入 / 删除', needsServer: true },
  { name: '句型复习', cmd: 'node', args: ['scripts/test-phrase.mjs'], desc: '25 项收池 / 到期 / 复习', needsServer: true },
  { name: '夜巡扩容', cmd: 'node', args: ['scripts/test-review.mjs'], desc: '38 项混排 / 轮次 / 回写', needsServer: true },
  { name: '背单词', cmd: 'node', args: ['scripts/test-worddrill.mjs'], desc: '30 项跟读 / 默写 / 听写 / 写回', needsServer: true },
  { name: '阅读填空', cmd: 'node', args: ['scripts/test-cloze.mjs'], desc: '20 项出题 / 提示 / 回写', needsServer: true },
  { name: '体检报告', cmd: 'node', args: ['scripts/test-report.mjs'], desc: '40 项统计 / 诊断 / 岔路分类', needsServer: true },
  { name: '语音', cmd: 'node', args: ['scripts/test-speech.mjs'], desc: '7 项语音取消', needsServer: true },
  { name: '进度备份', cmd: 'node', args: ['scripts/test-backup.mjs'], desc: '44 项导出 / 校验 / 覆盖', needsServer: true },
];

// 注意：vite preview 默认只监听 IPv6（::1），用 127.0.0.1 探测会误判为「不可达」。
// 这里用 localhost，让系统按 hosts 顺序解析。
const reachable = () => new Promise(resolve => {
  const req = http.get({ host: 'localhost', port: PORT, path: '/', timeout: 1200 }, res => {
    res.resume();
    resolve(true);
  });
  req.on('error', () => resolve(false));
  req.on('timeout', () => { req.destroy(); resolve(false); });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 目录里最新的修改时间（用来判断构建产物是不是比源码旧） */
function newestMtime(dir) {
  let max = 0;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  for (const ent of ents) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) max = Math.max(max, newestMtime(p));
    else {
      try { max = Math.max(max, fs.statSync(p).mtimeMs); } catch { /* 忽略 */ }
    }
  }
  return max;
}

/**
 * 界面测试跑的是 vite preview，也就是 dist/ 里的构建产物 —— 不是源码。
 *
 * 这件事踩过一次：public/data/dialogues.json 已经一千多场，dist 里还是十场的旧版本，
 * 于是三个依赖真实语料的测试全部失败，看起来像代码坏了，其实只是没重新构建。
 * 所以每次跑测试前先比对时间戳，旧了就构建，构建失败直接退出（继续跑没有意义）。
 */
function ensureBuild() {
  if (process.env.SKIP_BUILD === '1') return true;
  const distHtml = path.join(ROOT, 'dist/index.html');
  const distData = path.join(ROOT, 'dist/data/dialogues.json');
  const builtAt = Math.min(
    fs.existsSync(distHtml) ? fs.statSync(distHtml).mtimeMs : 0,
    fs.existsSync(distData) ? fs.statSync(distData).mtimeMs : 0,
  );
  const srcAt = Math.max(
    newestMtime(path.join(ROOT, 'src')),
    newestMtime(path.join(ROOT, 'public')),
    newestMtime(path.join(ROOT, 'index.html')),
  );
  if (builtAt && srcAt <= builtAt + 1000) return true;

  console.log(
    builtAt === 0
      ? '· 还没有构建产物，先构建（界面测试要跑 dist，不是源码）'
      : '· 构建产物比源码旧，先重新构建',
  );
  const r = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'build'],
    { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (r.status !== 0) {
    console.log('· 构建失败，界面测试会跑在旧产物上 —— 先修编译错误');
    return false;
  }
  return true;
}

/** 单次探测可能受连接排队影响，连续试 3 次再判定 */
async function reachableRetry() {
  for (let i = 0; i < 3; i++) {
    if (await reachable()) return true;
    if (i < 2) await sleep(300);
  }
  return false;
}

async function main() {
  const built = ensureBuild();
  let server = null;
  if (!(await reachable())) {
    console.log(`· 预览服务未启动，正在拉起 vite preview（:${PORT}）`);
    server = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['vite', 'preview', '--port', String(PORT), '--strictPort'],
      { cwd: ROOT, stdio: 'ignore', shell: process.platform === 'win32' }
    );
    // 轮询等端口起来，最多 20 秒
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      if (await reachable()) break;
    }
    if (!(await reachable())) console.log('· 预览服务启动失败，界面测试会跳过');
  }

  const results = [];
  for (const s of steps) {
    if (s.needsServer && !(await reachableRetry())) {
      results.push({ ...s, ok: false, note: '预览服务不可达' });
      console.log(`\n▶ ${s.name} —— 跳过（预览服务不可达，先执行 npm run preview）`);
      continue;
    }
    console.log(`\n▶ ${s.name} —— ${s.desc}`);
    const r = spawnSync(s.cmd, s.args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
    results.push({ ...s, ok: r.status === 0 });
  }

  if (!built) {
    console.log('\n注意：本次构建失败，界面相关结果是旧产物跑出来的。');
    process.exitCode = 1;
  }

  if (server) {
    // Windows 下 npx 会派生子进程，直接 kill 可能留下孤儿；用 taskkill 收干净
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log('\n' + '='.repeat(52));
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name.padEnd(8)} ${r.desc}`);
  console.log('='.repeat(52));
  console.log(failed.length ? `❌ ${failed.length} 项失败` : '全部通过');
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
