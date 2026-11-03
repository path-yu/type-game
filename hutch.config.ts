export default {
  scripts: {
    // 纯前端调试（浏览器里跑），与桌面端无关。
    web: 'vite dev --port 5183',
  },
  electrobun: {
    // 与本机已缓存的 devkit 对齐，避免每次再走一遍网络下载。
    version: '2.0.4',
  },
}
