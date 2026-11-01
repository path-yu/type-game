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
  m: number;    // 掌握度 0-100
  s: number;    // 记忆稳定度 0-5
  due: number;  // 下次复习时间戳（天）
  seen: number;
  ok: number;
  er: number;
  lex?: boolean; // 已收藏
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
}

export interface GhostFrame {
  marks: number[];
  wpm: number;
}

export type Screen = 'map' | 'play' | 'result' | 'review' | 'lexicon' | 'library' | 'report' | 'cloze' | 'settings';
