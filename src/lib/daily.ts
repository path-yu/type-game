/**
 * 每日卷轴：每天固定一篇，当天不变。
 *
 * 设计要点：
 *  1. **确定性**——同一天、同一解锁进度，抽到的必须是同一篇。用日期做种子，
 *     而不是 Math.random()，否则刷新页面就换一篇，"每日"就失去意义了。
 *  2. **可回退**——一旦选中就写进 progress（dailyArticle），当天不再重算。
 *     这样玩家中途解锁了新城区，今日的卷轴也不会突然换掉。
 *  3. **难度贴合**——从当前城区及以下里选，避免新手第一天抽到 C1。
 */
import type { Article } from './types';
import type { Corpus } from './data';

/** 本地日期 YYYY-MM-DD（不能用 UTC，否则夜里 8 点后换日） */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** FNV-1a：把日期字符串揉成一个稳定的整数 */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 抽出今天的卷轴。
 * 优先在当前城区选；该城区只有几篇时，混入上一档，保证有变化。
 */
export function pickDaily(corpus: Corpus, unlocked: number, day: string): Article {
  const lv = Math.min(7, Math.max(1, unlocked));
  const primary = corpus.byLevel[lv] ?? [];
  const pool = primary.length >= 12 ? primary : [...primary, ...(corpus.byLevel[lv - 1] ?? [])];
  const list = pool.length ? pool : corpus.articles;
  return list[hash(day) % list.length];
}

/** 该日卷轴是否已完成 */
export function isDailyDone(
  p: { dailyDay: string; dailyArticle: string | null; dailyDone: boolean },
  day: string
): boolean {
  return p.dailyDay === day && p.dailyDone;
}

/** 昨天的日期键 */
export function yesterdayKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return todayKey(y);
}

/**
 * 当前的「每日连续」天数。
 * 今天已完成 → 直接用；昨天完成过 → 也算（今天还没打不算断）；
 * 更早 → 断了，显示 0。
 */
export function aliveDailyStreak(
  p: { dailyStreak: number; dailyLastDay: string },
  today = todayKey()
): number {
  if (p.dailyLastDay === today) return p.dailyStreak;
  if (p.dailyLastDay === yesterdayKey()) return p.dailyStreak;
  return 0;
}

/** 明日卷轴的预告（按今天的解锁进度算，只是展示用） */
export function peekTomorrow(corpus: Corpus, unlocked: number): Article {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return pickDaily(corpus, unlocked, todayKey(t));
}
