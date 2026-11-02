export interface WordEntry {
  w: string;
  p?: string;   // 音标
  z?: string;   // 中文释义（多义项换行）
  e?: string;   // 英文释义
  c?: number;   // 柯林斯星级
  g?: string[]; // 考试标签
  t: number;    // Tier 1-5
  x?: string;   // exchange 词形
}

export interface Article {
  id: string;
  tx: string;
  s: string;    // 来源标题
  lv: number;   // 1-7
  sc: number;   // 难度分
  w: number;    // 词数
  st: number;   // 句数
  avg: number;  // 平均句长
  nw: number;   // 一级词之外的词数
  th: string;   // 主题
  lic: string;
  u: string;
  /** 在原书里排第几段（维基条目为 0） */
  ord?: number;
  /** 这本书一共切出多少段 */
  tot?: number;
}

export interface WordStat {
  m: number;    // 掌握度 0-100（UI 口径，词汇量统计也用它）
  s: number;    // FSRS 稳定度：保持率降到 90% 所需的天数
  d?: number;   // FSRS 难度 1-10，越大越难记住
  due: number;  // 下次复习时间戳（天）
  last?: number; // 上次复习的天序号
  reps?: number;
  lapses?: number;
  seen: number;
  ok: number;
  er: number;
  lex?: boolean; // 已收藏
}

export interface SceneStat {
  best: number;        // 「你」的最高正确率 0-100
  at: string;          // 最近一次完成的日期
  runs: number;        // 练过几遍
  /** 角色互换（练对方台词）的最高正确率。没练过就没有这个字段 */
  swapBest?: number;
  /** 实战（含岔路，整场走一遍）的接住率。和上面两项测的不是一种能力 */
  liveBest?: number;
}

export interface RunResult {
  articleId: string;
  lv: number;
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  elapsed: number;
  errors: number;
  stars: number;
  newWords: string[];
  errorWords: string[];
  detail: Record<string, { ok: number; er: number; p?: number }>;
  marks: number[];
  /** 易错键对，键形如 `e\u0000i`（应打 e，打成 i） */
  charErr: Record<string, number>;
  beatGhost: boolean;
  prevWpm: number | null;
  /** 一句没错的句子数 / 总句数 —— 结算页用它说「这篇有几句是干净的」 */
  perfect?: number;
  sentences?: number;
  /** 本局攒到的连击峰值段落（0–3） */
  stage?: number;
}

export interface GhostFrame {
  marks: number[];
  wpm: number;
  /** 这条幽灵是哪天记下的（ISO）。老档案没有这个字段，标签就只说「上次」 */
  at?: string;
}

export type Screen = 'map' | 'play' | 'result' | 'review' | 'lexicon' | 'library' | 'report' | 'cloze' | 'dialogue' | 'settings';
