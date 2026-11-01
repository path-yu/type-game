/**
 * 桌面端（Tauri）能力桥。
 * 浏览器环境下所有函数安全降级为 no-op —— 一套代码同时跑 Web 与桌面。
 */

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

/**
 * Tauri v2 有两个入口：
 *  - window.__TAURI_INTERNALS__.invoke  （core 注入，需依赖 @tauri-apps/api）
 *  - window.__TAURI__.core.invoke       （withGlobalTauri 开启后可用）
 * 两个都试，任一存在就算桌面端。
 */
function invokeFn(): InvokeFn | null {
  const w = window as unknown as {
    __TAURI_INTERNALS__?: { invoke?: InvokeFn };
    __TAURI__?: { core?: { invoke?: InvokeFn } };
  };
  return w.__TAURI_INTERNALS__?.invoke ?? w.__TAURI__?.core?.invoke ?? null;
}

export const isDesktop = (): boolean => !!invokeFn();

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  const fn = invokeFn();
  if (!fn) return null;
  try {
    return (await fn(cmd, args)) as T;
  } catch (e) {
    console.warn(`[native] ${cmd} 失败`, e);
    return null;
  }
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  dataDir: string;
  firstRun: boolean;
}

export async function appInfo(): Promise<AppInfo | null> {
  const r = await invoke<{
    version: string; platform: string; arch: string; data_dir: string; first_run: boolean;
  }>('app_info');
  if (!r) return null;
  return { version: r.version, platform: r.platform, arch: r.arch, dataDir: r.data_dir, firstRun: r.first_run };
}

export async function loadNativeProgress(): Promise<unknown | null> {
  const raw = await invoke<string | null>('load_progress');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveNativeProgress(payload: unknown): Promise<void> {
  await invoke('save_progress', { payload: JSON.stringify(payload) });
}

export async function exportProgress(payload: unknown): Promise<string | null> {
  return invoke<string>('export_progress', { payload: JSON.stringify(payload, null, 2) });
}

/** 启动自检：把实际加载到的数据量回写给桌面端，便于确认资源通路正常 */
export async function reportReady(articles: number, words: number): Promise<void> {
  await invoke('report_ready', { articles, words });
}

export async function appendRun(record: {
  articleId: string; wpm: number; accuracy: number; consistency: number; stars: number; elapsedMs: number;
}): Promise<void> {
  await invoke('append_run', {
    record: {
      article_id: record.articleId,
      wpm: record.wpm,
      accuracy: record.accuracy,
      consistency: record.consistency,
      stars: record.stars,
      elapsed_ms: record.elapsedMs,
      ts: Date.now(),
    },
  });
}
