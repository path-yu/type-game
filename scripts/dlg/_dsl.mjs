/**
 * 写语料用的小 DSL。
 *
 * 语料是「一千场」这个量级，用完整对象字面量写会有一半的 token 花在
 * 冒号、引号和字段名上。这里把重复结构压成位置参数：
 *
 *   L(1, 'Hot or iced?', '热的还是冰的？')              一句台词
 *   V('赶时间', '早高峰…', { 3: ['…', '…'], 5: ['…', '…'] }, 1)   一个变体
 *   B(7, 'change', '给出替代方案', S('…','…'), [O(S(..), S(..))])  一条岔路
 *
 * 可读性靠的是「同一份文件里到处都是一样的形状」，不是字段名。
 */

/** 一句台词。note 是这个项目里最有价值的部分：说清「为什么这么说」。 */
export const L = (r, en, zh, note) => (note ? { r, en, zh, note } : { r, en, zh });

/**
 * 一个变体。
 * @param tag     名字后缀（「赶时间」→ 咖啡店点单 · 赶时间）
 * @param setting 这一场的情境描述（卡片上显示的那两行）
 * @param swap    { 骨架行下标: [en, zh] | [en, zh, note] }，只替换这几句
 * @param br      用骨架的第几条岔路（默认 0）
 */
export const V = (tag, setting, swap, br) => ({ tag, setting, swap, br });

/** 岔路里的一句 */
export const S = (en, zh, note) => (note ? { en, zh, note } : { en, zh });

/** 岔路的一个选项：你怎么接 + 对方怎么反应 */
export const O = (say, react) => ({ say, react });

/**
 * 一条岔路。
 * @param at      接在你第几句之后（0 起算，必须正好是你的台词）
 * @param kind    short 东西没了 / cost 要加钱 / change 流程变了 / probe 被追问 / offer 对方提议
 */
export const B = (at, kind, task, prompt, options) => ({ at, kind, task, prompt, options });

/** 句型（会进「句型复习」的池子） */
export const P = (en, zh, tip) => ({ en, zh, tip });

/** 把 [en, zh, note] 数组补成对象 —— 只在引擎里调 */
export function normSwap(swap) {
  if (!swap) return {};
  const out = {};
  for (const [k, v] of Object.entries(swap)) {
    out[k] = Array.isArray(v)
      ? { en: v[0], zh: v[1], ...(v[2] ? { note: v[2] } : {}) }
      : v;
  }
  return out;
}
