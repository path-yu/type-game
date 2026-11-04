import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  base: './',
  clearScreen: false,
  server: { port: 5183, strictPort: false },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    /*
     * 交给 scripts/prebuild.mjs 清，不让 vite 自己清。
     * vite 会一次性 rmSync 掉 dist 里的每一个子目录（含 55 个封面的 dist/covers），
     * 而本机的安全删除钩子单次上限是 50 个文件 —— 会中途失败，
     * 留下空的 assets 和指向不存在文件的 index.html。
     */
    emptyOutDir: false,
  },
});
