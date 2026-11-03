/**
 * 桌面端能力桥。
 *
 * 原来是 Tauri 的 invoke；弃用 Tauri 后改成打本机 HTTP 桥
 * （src/bun/bridge.ts，随窗口一起起来，只监听 127.0.0.1，带一次性 token）。
 *
 * 判断"我在桌面壳里"只看窗口 URL 上有没有 `?api=`：
 * 网页版没有这个参数，所有函数安全降级成 no-op，
 * 一套代码同时跑 Web 与桌面，构建产物也不用分两份。
 */

interface Bridge {
  base: string;
  token: string;
}

function bridge(): Bridge | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search);
  const api = q.get('api');
  const token = q.get('token');
  if (!api || !token) return null;
  return { base: `http://${api}`, token };
}

export const isDesktop = (): boolean => !!bridge();

async function call<T>(cmd: string, body?: unknown): Promise<T | null> {
  const b = bridge();
  if (!b) return null;
  try {
    const res = await fetch(`${b.base}/${cmd}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', 'x-bridge-token': b.token },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { value?: T };
    return (json.value ?? null) as T | null;
  } catch (e) {
    console.warn(`[native] ${cmd} 失败`, e);
    return null;
  }
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  /** 当前生效的数据目录 */
  dataDir: string;
  /** 用户是否改过目录（HTTP 桥不支持改，恒为 false） */
  custom: boolean;
  /** 默认目录，用于「恢复默认」时显示 */
  defaultDir: string;
}

export async function appInfo(): Promise<AppInfo | null> {
  return call<AppInfo>('app_info');
}

/*
 * 数据目录的「选择 / 重置」原本靠 Tauri 的目录选择框。
 * HTTP 桥没有原生对话框，这里如实返回 null ——
 * 调用方（DataDirGroup）会显示成不可用，而不是假装切过去了。
 */
export async function pickDataDir(): Promise<string | null> {
  return null;
}

export async function setDataDir(_dir: string): Promise<string | null> {
  return null;
}

export async function resetDataDir(): Promise<string | null> {
  return null;
}

/** 在文件管理器里打开数据目录（返回路径，由渲染层显示给用户） */
export async function openDataDir(): Promise<string | null> {
  return call<string>('open_data_dir');
}

export async function loadNativeProgress(): Promise<unknown | null> {
  const raw = await call<string>('load_progress');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveNativeProgress(payload: unknown): Promise<void> {
  await call('save_progress', { payload: JSON.stringify(payload) });
}

export async function exportProgress(payload: unknown): Promise<string | null> {
  return call<string>('export_progress', { payload: JSON.stringify(payload, null, 2) });
}

/** 启动自检：把实际加载到的数据量回写给桌面端，便于确认资源通路正常 */
export async function reportReady(articles: number, words: number): Promise<void> {
  await call('report_ready', { articles, words });
}

export async function appendRun(record: {
  articleId: string; wpm: number; accuracy: number; consistency: number; stars: number; elapsedMs: number;
}): Promise<void> {
  await call('append_run', {
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
