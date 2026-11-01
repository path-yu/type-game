/**
 * 句型复习：把场景里那些「整块能直接用」的句子也纳入间隔重复。
 *
 * 单词有 FSRS，句型没有 —— 可口语里最该背的恰恰是整块的说法：
 * "Keep the change" 记住的是四个词连在一起，不是 keep + the + change。
 *
 * 池子的规矩：**练过那场对话，它的句型才进池**。
 * 一上来就把 40 个句型全塞进复习队列，只会让人第二天就放弃。
 */
import type { Scene } from './dialogue';
import type { SceneStat, WordStat } from './types';

export interface PhraseItem {
  /** 用英文原文当主键：同一句在不同场景里重复时只留一条 */
  en: string;
  zh: string;
  tip?: string;
  sceneId: string;
  sceneName: string;
}

/** 全部句型（按英文去重，保留第一次出现的那条） */
export function bankPhrases(scenes: Scene[]): PhraseItem[] {
  const out: PhraseItem[] = [];
  const seen = new Set<string>();
  for (const sc of scenes) {
    for (const ph of sc.phrases ?? []) {
      if (!ph.en || seen.has(ph.en)) continue;
      seen.add(ph.en);
      out.push({ en: ph.en, zh: ph.zh, tip: ph.tip, sceneId: sc.id, sceneName: sc.name });
    }
  }
  return out;
}

/** 已解锁的句型池：只算练过的那几场 */
export function unlockedPhrases(scenes: Scene[], stats: Record<string, SceneStat>): PhraseItem[] {
  const practiced = scenes.filter(sc => stats[sc.id]);
  return bankPhrases(practiced);
}

/**
 * 一次复习会抽哪些句子。
 *
 * 先补到期的（越快忘越靠前），不够再补没学过的新句 ——
 * 只考到期会让池子永远停在最初那几句。
 */
export function pickSession(
  pool: PhraseItem[],
  stats: Record<string, WordStat>,
  today: number,
  limit = 8
): PhraseItem[] {
  const due = pool
    .filter(p => stats[p.en] && stats[p.en].due <= today)
    .sort((a, b) => (stats[a.en].due - stats[b.en].due) || (stats[a.en].m - stats[b.en].m));
  const fresh = pool.filter(p => !stats[p.en]);

  return [...due, ...fresh].slice(0, limit);
}

/** 还有多少句等着复习（到期的 + 没学过的），用于入口上的数字 */
export function pendingCount(pool: PhraseItem[], stats: Record<string, WordStat>, today: number): number {
  return pool.filter(p => !stats[p.en] || stats[p.en].due <= today).length;
}

/** 这一池子里已经复习过几句 */
export function learnedCount(pool: PhraseItem[], stats: Record<string, WordStat>): number {
  return pool.filter(p => stats[p.en]).length;
}
