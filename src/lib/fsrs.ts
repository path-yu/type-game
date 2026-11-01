/**
 * FSRS-4.5（Free Spaced Repetition Scheduler）—— 记忆调度内核。
 *
 * 原来的调度是一张固定阶梯 `[1,3,7,16,35,75]` 天：不管这个词是 born 还是 antidisestablishmentarianism，
 * 打对两次都排到 7 天后。FSRS 换成 DSR 三变量模型：
 *
 *   Difficulty    这个词本身有多难记住（1–10，随每次作答更新）
 *   Stability     记忆稳定度（天）—— 保持率降到 90% 所需的时间
 *   Retrievability 此刻还记得住的概率，由上次复习到现在的时间推出来
 *
 * 三条规律（都来自实测记忆数据，不是拍脑袋）：
 *   1. 材料越难，稳定度涨得越慢
 *   2. 稳定度越高，再涨越难（stabilization decay）
 *   3. 复习时越接近遗忘，涨得越多（stabilization curve，也就是"必要难度"）
 *
 * 权重用 FSRS-4.5 的公开默认值，没在个人数据上重训 —— 单机应用收不到几十万条复习日志。
 * 参考：https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

/** w0–w16 */
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, // w0-3  初始稳定度：Again / Hard / Good / Easy
  5.1618, 1.2298, 0.8975, 0.031,   // w4-7  初始难度、难度更新、均值回归
  1.6474, 0.1367, 1.0461, 2.1072,  // w8-11 记得时的稳定度增长
  0.0793, 0.3246, 1.587, 0.2272,   // w12-14 忘记后的稳定度
  2.8755, 1.0,                     // w15-16 Hard 惩罚 / Easy 奖励（w16 由调用方按需覆盖）
] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81;

/** 1=again 2=hard 3=good 4=easy */
export type Grade = 1 | 2 | 3 | 4;

export interface Memory {
  /** 稳定度，天 */
  s: number;
  /** 难度 1–10，越大越难 */
  d: number;
  /** 下次复习的「天序号」 */
  due: number;
  /** 上次复习的天序号 */
  last: number;
  reps: number;
  lapses: number;
}

const clampD = (d: number) => Math.min(10, Math.max(1, d));

/** 初次作答后的稳定度：Again 半天、Good 三点七天、Easy 十三点八天 */
export const initStability = (g: Grade) => Math.max(0.1, W[g - 1]);

/**
 * 初次作答后的难度：D0(G) = w4 − (G−3)·w5（FSRS-4.5 沿用 v4 的线性式）。
 * 注意别用 FSRS-5 草稿里的指数式 `w4 − e^(w5(G−1)) + 1` —— 那个在 G≥3 时会被
 * clamp 到 1（最简单档），增长率直接拉满，连打三次就能排到两年后。
 */
export const initDifficulty = (g: Grade) => clampD(W[4] - (g - 3) * W[5]);

/** t 天之后还记得住的概率 */
export const retrievability = (elapsed: number, s: number) =>
  Math.pow(1 + (FACTOR * Math.max(0, elapsed)) / Math.max(0.1, s), DECAY);

/** 让保持率回到 r 需要多少天 */
export const intervalFor = (s: number, r = 0.9) =>
  Math.max(1, Math.round((s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1)));

/** 难度更新 + 向「答对时的初始难度」轻度回归，防止越答越难的死循环 */
export function nextDifficulty(d: number, g: Grade) {
  const raw = d - W[6] * (g - 3);
  return clampD(W[7] * W[4] + (1 - W[7]) * raw);
}

/** 记得时的稳定度增长 —— 核心：复习时 r 越低（越接近遗忘），涨得越多 */
export function stabilityAfterRecall(d: number, s: number, r: number, g: Grade) {
  const bonus = g === 2 ? W[15] : g === 4 ? W[16] : 1;
  const gain = Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1);
  return Math.max(0.1, s * (1 + gain * bonus));
}

/** 忘记后的稳定度 —— 不会比原来更强 */
export function stabilityAfterForget(d: number, s: number, r: number) {
  const next = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
  return Math.max(0.1, Math.min(s, next));
}

/** 一次作答 → 新的记忆状态 */
export function review(prev: Memory | null, g: Grade, today: number): Memory {
  if (!prev || !prev.reps) {
    const s = initStability(g);
    return { s, d: initDifficulty(g), due: today + intervalFor(s), last: today, reps: 1, lapses: g === 1 ? 1 : 0 };
  }
  const elapsed = Math.max(0, today - (prev.last ?? today));
  const r = retrievability(elapsed, prev.s);
  const s = g === 1 ? stabilityAfterForget(prev.d, prev.s, r) : stabilityAfterRecall(prev.d, prev.s, r, g);
  const d = nextDifficulty(prev.d, g);
  return {
    s,
    d,
    due: today + intervalFor(s),
    last: today,
    reps: prev.reps + 1,
    lapses: prev.lapses + (g === 1 ? 1 : 0),
  };
}

/** 给 UI 用的一句话状态 */
export function memoryLabel(m: Memory, today: number): string {
  const left = m.due - today;
  if (left <= 0) return '今天该复习了';
  if (left === 1) return '明天复习';
  if (left < 7) return `${left} 天后复习`;
  if (left < 30) return `${Math.round(left / 7)} 周后复习`;
  if (left < 365) return `${Math.round(left / 30)} 个月后复习`;
  return '记得很牢';
}
