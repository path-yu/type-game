import { BrowserWindow } from 'electrobun/main'
import { startBridge } from './bridge'

/**
 * TypeWake 桌面端主进程。
 *
 * 应用本身是个静态 SPA（进度存 localStorage），窗口只负责把 views:// 里那份
 * Vite 产物挂上去；另起一个只监听 127.0.0.1 的 HTTP 桥，用来把进度落盘 ——
 * 这部分原来是 Rust 的命令，弃用 Tauri 后由 bridge.ts 接手。
 *
 * 窗口尺寸与旧版保持一致（1280×840），免得迁移后版式要重调。
 */
const bridge = startBridge()

const win = new BrowserWindow({
  title: '词醒 TypeWake',
  // 带上 api 与 token：渲染层据此判断"我在桌面壳里"，才去读写文件
  url: `views://mainview/index.html?api=${bridge.host}&token=${encodeURIComponent(bridge.token)}`,
  frame: {
    width: 1280,
    height: 840,
    x: 80,
    y: 60,
  },
})

// 窗口关掉之后 Bun 进程要跟着退出，否则任务管理器里会留一个僵尸进程。
win.on('close', () => {
  bridge.close()
  process.exit(0)
})
