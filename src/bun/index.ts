import { BrowserWindow } from 'electrobun/main'

/**
 * TypeWake 桌面端主进程。
 *
 * 应用本身是纯静态 SPA（进度存 localStorage），不需要 IPC、原生菜单或托盘，
 * 所以这里只做一件事：开一个窗口，把 views:// 里那份 Vite 构建产物挂上去。
 * 窗口尺寸与 Tauri 版保持一致（1280×840），免得迁移后版式要重调。
 */
const win = new BrowserWindow({
  title: '词醒 TypeWake',
  url: 'views://mainview/index.html',
  frame: {
    width: 1280,
    height: 840,
    x: 80,
    y: 60,
  },
})

// 窗口关掉之后 Bun 进程要跟着退出，否则任务管理器里会留一个僵尸进程。
win.on('close', () => {
  process.exit(0)
})
