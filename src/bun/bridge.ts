/**
 * 本地桥：把「进度落盘」这件事从 Rust 手里接过来。
 *
 * 弃用 Tauri 之后，src/lib/native.ts 在桌面端降级成了 no-op ——
 * 进度只剩 localStorage，换机器或清浏览器数据就没了。
 * 这里在 Bun 主进程起一个只监听 127.0.0.1 的 HTTP 服务，
 * 渲染层带着 token 打过来读写同一个文件。
 *
 * 为什么不用 Electrobun 的 RPC：那套要把 devkit 的 view SDK 拉进 Vite 打包，
 * 网页版会被一起拖进来。走 HTTP 的话，网页构建一个字节都不用改 ——
 * 只有窗口 URL 上带了 `?api=` 参数时才认为自己是桌面端。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** 与 Tauri 版同一个目录，老用户的 ready.json 还能接着用 */
const DATA_DIR = join(process.env.LOCALAPPDATA ?? homedir(), 'com.typewake.app');
const PROGRESS = join(DATA_DIR, 'progress.json');
const READY = join(DATA_DIR, 'ready.json');
const RUNS = join(DATA_DIR, 'runs.jsonl');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readText(file: string): string | null {
  try {
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  } catch {
    return null;
  }
}

function writeText(file: string, text: string) {
  ensureDir();
  // 先写临时文件再改名：写到一半断电也不能把进度写成半截 JSON
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, file);
}

export interface Bridge {
  host: string;
  token: string;
  close: () => void;
}

export function startBridge(): Bridge {
  const token = crypto.randomUUID();

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const cors = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type,x-bridge-token',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
      };
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

      const url = new URL(req.url);
      const cmd = url.pathname.slice(1);
      if (req.headers.get('x-bridge-token') !== token) {
        return Response.json({ error: 'bad token' }, { status: 403, headers: cors });
      }

      const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
      let value: unknown = null;
      try {
        switch (cmd) {
          case 'app_info':
            value = {
              version: '0.1.0',
              platform: process.platform,
              arch: process.arch,
              dataDir: DATA_DIR,
              // 桥不支持换目录，custom 恒为 false，前端就不会显示「恢复默认」
              custom: false,
              defaultDir: DATA_DIR,
            };
            break;
          case 'load_progress':
            value = readText(PROGRESS);
            break;
          case 'save_progress':
            ensureDir();
            writeText(PROGRESS, String((body as { payload?: string }).payload ?? ''));
            break;
          case 'export_progress': {
            ensureDir();
            const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const out = join(DATA_DIR, `progress-${stamp}.json`);
            writeFileSync(out, String((body as { payload?: string }).payload ?? ''), 'utf8');
            value = out;
            break;
          }
          case 'report_ready':
            ensureDir();
            writeFileSync(
              READY,
              JSON.stringify({ ...(body as object), ts: Date.now() }, null, 2),
              'utf8',
            );
            break;
          case 'append_run':
            ensureDir();
            appendFileSync(RUNS, `${JSON.stringify((body as { record?: unknown }).record ?? {})}\n`, 'utf8');
            break;
          case 'open_data_dir':
            ensureDir();
            value = DATA_DIR;
            break;
          default:
            return Response.json({ error: 'unknown command' }, { status: 404, headers: cors });
        }
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 500, headers: cors });
      }
      return Response.json({ value }, { headers: cors });
    },
  });

  return {
    host: `127.0.0.1:${server.port}`,
    token,
    close: () => server.stop(true),
  };
}
