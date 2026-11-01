/**
 * 进度备份：把 localStorage 里那一个键变成可以带走的文件。
 *
 * 全部学习记录（5446 句译文对应的熟练度、FSRS 排期、场景成绩、自建对话）
 * 只存在一个 localStorage 键里 —— 清一次站点数据就全没了，换台机器也带不走。
 * 这一层只做「存 / 取 / 校验」，不碰 DOM 也不碰 store，可以在 Node 里直接测。
 */
import type { Progress, Settings } from './store';

export interface Backup {
  app: 'typewake';
  v: number;
  at: string;
  p: Progress;
  s: Settings;
}

export interface Summary {
  at: string;
  words: number;      // 有记录的词
  learned: number;    // 掌握度 ≥ 70 的词
  runs: number;       // 打过的篇数
  scenes: number;     // 练过的对话场数
  custom: number;     // 自建的对话场数
  streak: number;     // 连续天数
}

export interface Parsed {
  ok: boolean;
  /** 失败时给人看的一句话 */
  error?: string;
  /** 成功时用于二次确认的摘要 */
  summary?: Summary;
  /** 能导入但要提醒的（例如旧格式、空档案） */
  warnings: string[];
  data?: Backup;
}

export const BACKUP_VERSION = 1;

export function buildBackup(p: Progress, s: Settings, now = new Date()): Backup {
  return {
    app: 'typewake',
    v: BACKUP_VERSION,
    at: now.toISOString(),
    p,
    s,
  };
}

export function summarize(b: Backup): Summary {
  const words = Object.values(b.p?.mastery ?? {});
  return {
    at: b.at,
    words: words.length,
    learned: words.filter(w => (w?.m ?? 0) >= 70).length,
    runs: b.p?.runs ?? 0,
    scenes: Object.keys(b.p?.scenes ?? {}).length,
    custom: (b.p?.customScenes ?? []).length,
    streak: b.p?.dailyStreak ?? 0,
  };
}

/** 文件名：typewake-2026-11-02.json */
export function fileName(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `typewake-${now.getFullYear()}-${m}-${d}.json`;
}

/**
 * 解析并校验一个备份文件。
 *
 * 校验刻意宽松一点：能救回数据比守格式重要。所以没有版本标记、但结构像
 * `{ p: { mastery } }` 的文件也接受（给一条提醒），真正拒收的只有
 * 「解析不了」「不是本应用的档案」「里面没有任何学习数据」三种。
 */
export function parseBackup(text: string): Parsed {
  const warnings: string[] = [];

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '这不是一个 JSON 文件（解析失败）', warnings };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: '文件内容不是一个对象', warnings };
  }

  const o = raw as Record<string, unknown>;
  const p = o.p as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object' || Array.isArray(p)) {
    return { ok: false, error: '文件里没有学习记录（缺 p 字段）', warnings };
  }
  if (!p.mastery || typeof p.mastery !== 'object') {
    return { ok: false, error: '学习记录里没有词表（缺 p.mastery）', warnings };
  }

  if (o.app !== 'typewake') {
    warnings.push('文件没有应用标记，按兼容格式导入 —— 请确认它确实是词醒的备份');
  }
  if (typeof o.v === 'number' && o.v > BACKUP_VERSION) {
    return {
      ok: false,
      error: `备份来自更新的版本（v${o.v}），当前版本读不了`,
      warnings,
    };
  }
  if (typeof o.v !== 'number') {
    warnings.push('文件没有版本号，按 v1 处理');
  }

  const data: Backup = {
    app: 'typewake',
    v: typeof o.v === 'number' ? o.v : BACKUP_VERSION,
    at: typeof o.at === 'string' ? o.at : '',
    p: p as unknown as Progress,
    s: (o.s && typeof o.s === 'object' ? o.s : {}) as Settings,
  };

  const sum = summarize(data);
  if (!sum.words && !sum.runs && !sum.scenes) {
    warnings.push('这份备份是空的：没有任何单词、成绩或对话记录');
  }

  return { ok: true, summary: sum, warnings, data };
}

/** 「3 天前」这种相对时间，给确认框用 */
export function whenLabel(at: string, now = new Date()): string {
  if (!at) return '时间未知';
  const t = new Date(at);
  if (Number.isNaN(t.getTime())) return '时间未知';
  const days = Math.floor((now.getTime() - t.getTime()) / 86400000);
  if (days <= 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days} 天前`;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
