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
const DEFAULT_DIR = join(process.env.LOCALAPPDATA ?? homedir(), 'com.typewake.app');
/** 改过目录的话记在这里；配置文件永远放在默认目录，否则换了目录就找不到自己 */
const CONFIG = join(DEFAULT_DIR, 'config.json');

let dataDir = DEFAULT_DIR;

function readConfig(): { dataDir?: string } {
  const raw = readText(CONFIG);
  if (!raw) return {};
  try { return JSON.parse(raw) as { dataDir?: string }; } catch { return {}; }
}

function saveConfig(next: { dataDir?: string }) {
  if (!existsSync(DEFAULT_DIR)) mkdirSync(DEFAULT_DIR, { recursive: true });
  writeFileSync(CONFIG, JSON.stringify(next, null, 2), 'utf8');
}

(() => {
  const saved = readConfig().dataDir;
  // 目录被删了（移动硬盘拔了）就退回默认，别让整个桌面端起不来
  if (saved && existsSync(saved)) dataDir = saved;
})();

const fileIn = (name: string) => join(dataDir, name);

function ensureDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
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

export interface BridgeOptions {
  /** 由主进程注入：弹系统目录选择框。桥自己不认识 UI */
  pickDir?: (current: string) => Promise<string | null>;
}

export function startBridge(opts: BridgeOptions = {}): Bridge {
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
              dataDir,
              custom: dataDir !== DEFAULT_DIR,
              defaultDir: DEFAULT_DIR,
            };
            break;
          case 'load_progress':
            value = readText(fileIn('progress.json'));
            break;
          case 'save_progress':
            ensureDir();
            writeText(fileIn('progress.json'), String((body as { payload?: string }).payload ?? ''));
            break;
          case 'export_progress': {
            ensureDir();
            const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const out = fileIn(`progress-${stamp}.json`);
            writeFileSync(out, String((body as { payload?: string }).payload ?? ''), 'utf8');
            value = out;
            break;
          }
          case 'report_ready':
            ensureDir();
            writeFileSync(
              fileIn('ready.json'),
              JSON.stringify({ ...(body as object), ts: Date.now() }, null, 2),
              'utf8',
            );
            break;
          case 'append_run':
            ensureDir();
            appendFileSync(fileIn('runs.jsonl'), `${JSON.stringify((body as { record?: unknown }).record ?? {})}\n`, 'utf8');
            break;
          case 'open_data_dir':
            ensureDir();
            value = dataDir;
            break;

          /*
           * 换目录。桌面端才有对话框（opts.pickDir）；网页版走到这里也只会拿到 null，
           * 前端据此保持"不可用"，而不是假装切过去了。
           */
          case 'pick_data_dir': {
            const picked = await opts.pickDir?.(dataDir);
            if (picked && existsSync(picked)) {
              dataDir = picked;
              saveConfig({ dataDir });
              ensureDir();
              value = dataDir;
            }
            break;
          }
          case 'set_data_dir': {
            const dir = String((body as { dir?: string }).dir ?? '');
            if (dir && existsSync(dir)) {
              dataDir = dir;
              saveConfig({ dataDir });
              ensureDir();
              value = dataDir;
            }
            break;
          }
          case 'reset_data_dir':
            dataDir = DEFAULT_DIR;
            saveConfig({});
            ensureDir();
            value = dataDir;
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
