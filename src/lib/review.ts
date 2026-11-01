/**
 * 夜巡队列：单词为主，夹一两句到期的句型。
 *
 * 单词和句型共用一套 FSRS，但入口只有一个 —— 用户不需要记两种复习节奏。
 * 到期的句型只在「已经学过」的里面挑：没学过的句子留给「句型复习」，
 * 那里有中文题干和首字母提示，是学新东西的地方；夜巡是检验。
 */
import { spreadConfusable } from './confuse';
import type { PhraseItem } from './phrases';
import type { WordStat } from './types';

export type ReviewItem =
  | { kind: 'word'; w: string }
  | { kind: 'phrase'; item: PhraseItem };

/**
 * 挑这一轮要复习的单词。
 *
 * 到期最优先，然后依次是「还没掌握」「打错过」「收藏过」。
 * 形近词要错开：affect 和 effect 同一批出现，两个都会被搅乱。
 */
export function buildWordQueue(
  mastery: Record<string, WordStat>,
  today: number,
  limit = 12
): string[] {
  const items = Object.entries(mastery)
    .map(([w, st]) => {
      const overdue = today - (st.due || 0);
      let pri = 99;
      if (overdue >= 0) pri = 0;          // 到期
      else if (st.m < 50) pri = 1;        // 还没掌握
      else if (st.er > 0) pri = 2;        // 打错过
      else if (st.lex) pri = 3;           // 收藏过
      return { w, st, pri };
    })
    .filter(x => x.pri < 99);

  items.sort((a, b) => (a.pri - b.pri) || (a.st.m - b.st.m));
  return spreadConfusable(items.map(x => x.w), limit);
}

/**
 * 到期的句型。
 *
 * 只要「学过并且到期」的 —— 没学过的句子不进夜巡，那是「句型复习」的活。
 */
export function duePhrases(
  pool: PhraseItem[],
  stats: Record<string, WordStat>,
  today: number,
  limit = 2
): PhraseItem[] {
  return pool
    .filter(p => stats[p.en] && stats[p.en].due <= today)
    .sort((a, b) => stats[a.en].due - stats[b.en].due)
    .slice(0, limit);
}

/**
 * 把句型插进单词队列里。
 *
 * 两个约束：**不放在最前面**（先来几个词热身，一上来就是长句很劝退），
 * 也**不堆在最后**（用户中途退出就永远练不到）。所以均匀铺开。
 */
export function mixItems(words: string[], phrases: PhraseItem[]): ReviewItem[] {
  const wordItems: ReviewItem[] = words.map(w => ({ kind: 'word', w }));
  if (!phrases.length) return wordItems;
  if (!words.length) return phrases.map(item => ({ kind: 'phrase', item }));

  const total = words.length + phrases.length;
  const slots = new Set<number>();
  for (let k = 0; k < phrases.length; k++) {
    let at = Math.round(((k + 1) * total) / (phrases.length + 1));
    at = Math.max(1, Math.min(total - 1, at));
    // 算出来的位置撞上了就往后挪一格，实在没位置就往前找
    while (slots.has(at) && at < total - 1) at++;
    while (slots.has(at) && at > 1) at--;
    slots.add(at);
  }

  const out: ReviewItem[] = [];
  let wi = 0;
  let pi = 0;
  for (let pos = 0; pos < total; pos++) {
    if (slots.has(pos) && pi < phrases.length) out.push({ kind: 'phrase', item: phrases[pi++] });
    else if (wi < words.length) out.push(wordItems[wi++]);
    else out.push({ kind: 'phrase', item: phrases[pi++] });
  }
  return out;
}

/**
 * 一整轮的队列。句型占用名额，总长度不变 ——
 * 12 个词的夜巡不会因为多了两句就变成 14 题。
 */
export function buildReviewQueue(
  mastery: Record<string, WordStat>,
  pool: PhraseItem[],
  phraseStats: Record<string, WordStat>,
  today: number,
  opts: { limit?: number; maxPhrases?: number } = {}
): ReviewItem[] {
  const limit = opts.limit ?? 12;
  const maxPhrases = opts.maxPhrases ?? 2;
  const phrases = duePhrases(pool, phraseStats, today, maxPhrases);
  const words = buildWordQueue(mastery, today, Math.max(0, limit - phrases.length));
  return mixItems(words, phrases);
}
