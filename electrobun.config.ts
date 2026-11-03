import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: '词醒 TypeWake',
    identifier: 'com.typewake.app',
    version: '0.1.0',
  },
  build: {
    mainProcess: 'bun',
    bun: {
      entrypoint: 'src/bun/index.ts',
      minify: true,
    },
    // vite build 产出 dist/（base:'./'），整棵树映射到 views/mainview。
    // data/ 与 covers/ 必须一起带过去：应用运行时是 fetch('data/...') 读的，
    // 只拷 index.html 和 assets 会白屏。
    copy: {
      'dist/index.html': 'views/mainview/index.html',
      'dist/assets': 'views/mainview/assets',
      'dist/data': 'views/mainview/data',
      'dist/covers': 'views/mainview/covers',
      'dist/fonts': 'views/mainview/fonts',
      'dist/favicon.svg': 'views/mainview/favicon.svg',
      'dist/favicon-32.png': 'views/mainview/favicon-32.png',
      'assets/app-icon.ico': 'app-icon.ico',
    },
    watchIgnore: ['dist/**'],
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
      icon: 'assets/app-icon.ico',
    },
  },
} satisfies ElectrobunConfig
