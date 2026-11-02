import type { Token } from '../lib/data';

export type CharState = 0 | 1 | 2; // 0 未打 · 1 已对 · 2 错误

export interface Snapshot {
  idx: number;
  combo: number;
  maxCombo: number;
  correct: number;
  errors: number;
  attempts: number;
  wpm: number;
  raw: number;
  acc: number;
  progress: number;
  elapsed: number;
  done: boolean;
  tick: number;
  shield: number;
  stage: 0 | 1 | 2 | 3;
}

/**
 * 打字引擎 —— 纯逻辑，零 DOM 依赖。
 * 由 TextStage 直接把 states 同步到 DOM，避免逐键触发 React 重渲染。
 */
export class TypingEngine {
  readonly chars: string[];
  readonly states: Uint8Array;
  readonly marks: Float64Array;       // 每个字符的时间戳（ms，相对开局）
  readonly words: Token[];
  readonly charWord: Int32Array;      // 字符下标 → 词序号
  readonly wordError: Set<number> = new Set();
  readonly wordErr: Uint16Array;
  /** 易错键对：`应打→实打` 的计数，用于体检报告找出「i 打成 e」这类固定混淆 */
  readonly charErr = new Map<string, number>();

  idx = 0;
  combo = 0;
  maxCombo = 0;
  correct = 0;
  errors = 0;
  attempts = 0;
  tick = 0;
  startAt = 0;
  endAt = 0;

  /**
   * 护盾：每 50 连击攒一个（上限 2），打错时顶掉一次、连击不断。
   *
   * 加它是因为原来的连击「只会掉、不会涨出东西」——玩家没有可失去的，
   * 也就没有保住它的紧张感。有了护盾，50 连击之后人才会真的开始屏住呼吸。
   */
  shield = 0;
  /** 这一下打错是被护盾顶掉的（combo 未减），UI 据此换个音效与颜色 */
  shieldBroke = false;
  /** 每次打错时的字符下标，用来做句子级「有无错」判定 */
  readonly errorAt: number[] = [];

  private stageOf(combo: number): 0 | 1 | 2 | 3 {
    if (combo >= 100) return 3;
    if (combo >= 60) return 2;
    if (combo >= 30) return 1;
    return 0;
  }

  /** 连击段位：0 平常 · 1 顺流 · 2 共鸣 · 3 无我 */
  flowStage(): 0 | 1 | 2 | 3 {
    return this.stageOf(this.combo);
  }

  /** 本局最高到过哪一段 —— 结算说他打到过「共鸣」，不能拿最后一键的连击去算 */
  maxFlowStage(): 0 | 1 | 2 | 3 {
    return this.stageOf(this.maxCombo);
  }

  /**
   * 一句的结算：用时、错字、字数。
   * 起点取「上一句最后一个字符完成的时间」，第一句从头算 —— 这样句子用时是真实阅读节奏，
   * 而不是把停顿都堆到最后一句上。
   */
  sentenceStat(start: number, end: number): { ms: number; errors: number; chars: number } {
    const t0 = start > 0 && this.marks[start - 1] >= 0 ? this.marks[start - 1] : 0;
    const t1 = end > 0 && this.marks[end - 1] >= 0 ? this.marks[end - 1] : this.elapsed();
    let errors = 0;
    for (const i of this.errorAt) if (i >= start && i < end) errors++;
    return { ms: Math.max(0, t1 - t0), errors, chars: end - start };
  }

  /** 每打完一个整词回调（用于实时朗读） */
  onWordEnd?: (key: string, raw: string) => void;

  private pausedAt = 0;
  private wordTimes: { w: number; dur: number; len: number }[] = [];
  private wordStartAt = new Map<number, number>();

  constructor(text: string, words: Token[]) {
    this.chars = Array.from(text);
    this.states = new Uint8Array(this.chars.length);
    this.marks = new Float64Array(this.chars.length).fill(-1);
    this.words = words;
    this.charWord = new Int32Array(this.chars.length).fill(-1);
    this.wordErr = new Uint16Array(words.length);
    for (let i = 0; i < words.length; i++) {
      for (let c = words[i].start; c < words[i].end; c++) this.charWord[c] = i;
    }
  }

  get length() { return this.chars.length; }

  private now() { return performance.now(); }

  input(ch: string): 'ok' | 'err' | 'end' {
    if (this.idx >= this.length) return 'end';
    const t = this.now();
    if (!this.startAt) this.startAt = t;

    const expected = this.chars[this.idx];
    this.attempts++;
    this.tick++;
    this.shieldBroke = false;

    if (ch === expected) {
      this.states[this.idx] = 1;
      this.marks[this.idx] = t - this.startAt;
      this.correct++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      // 每 50 连击攒一个护盾：连得越久，越有本钱冒一次险
      if (this.combo % 50 === 0 && this.shield < 2) this.shield++;

      const wi = this.charWord[this.idx];
      if (wi >= 0) {
        if (!this.wordStartAt.has(wi)) this.wordStartAt.set(wi, t);
        if (this.words[wi].end - 1 === this.idx) {
          const st = this.wordStartAt.get(wi)!;
          this.wordTimes.push({ w: wi, dur: Math.max(1, t - st), len: this.words[wi].end - this.words[wi].start });
        }
      }

      this.idx++;
      {
        const done = this.charWord[this.idx - 1];
        if (done >= 0 && this.words[done].end === this.idx) {
          this.onWordEnd?.(this.words[done].key, this.words[done].raw);
        }
      }
      if (this.idx >= this.length) {
        this.endAt = t;
        return 'end';
      }
      return 'ok';
    }

    this.states[this.idx] = 2;
    this.marks[this.idx] = t - this.startAt;
    this.errors++;
    this.errorAt.push(this.idx);
    {
      // 记录「本该打什么、实际打成什么」：只记字母和空格，标点噪声不入统计
      const k = `${expected}\u0000${ch}`;
      this.charErr.set(k, (this.charErr.get(k) ?? 0) + 1);
    }
    if (this.shield > 0) {
      // 护盾顶一次：错还是记的，但连击保住 —— 这就是攒它的意义
      this.shield--;
      this.shieldBroke = true;
    } else {
      this.combo = Math.max(0, this.combo - 30);
    }
    const wi = this.charWord[this.idx];
    if (wi >= 0) { this.wordError.add(wi); this.wordErr[wi]++; }
    return 'err';
  }

  /** 退格：若当前处于错误态，只清错；否则回退一格 */
  backspace(): boolean {
    if (this.idx <= 0 && this.states[this.idx] !== 2) return false;
    this.tick++;
    if (this.states[this.idx] === 2) {
      this.states[this.idx] = 0;
      this.marks[this.idx] = -1;
      return true;
    }
    this.idx--;
    if (this.states[this.idx] === 1) this.correct = Math.max(0, this.correct - 1);
    this.states[this.idx] = 0;
    this.marks[this.idx] = -1;
    this.combo = 0;
    return true;
  }

  pause() {
    if (this.startAt && !this.pausedAt) this.pausedAt = this.now();
  }

  resume() {
    if (this.pausedAt) {
      const d = this.now() - this.pausedAt;
      this.startAt += d;
      this.pausedAt = 0;
    }
  }

  get paused() { return this.pausedAt > 0; }

  elapsed(): number {
    if (!this.startAt) return 0;
    if (this.endAt) return this.endAt - this.startAt;
    return (this.pausedAt || this.now()) - this.startAt;
  }

  wpm(): number {
    const ms = Math.max(this.elapsed(), 500); // 极短文本也给出合理值，不显示 0
    return Math.round((this.correct / 5) / (ms / 60000));
  }

  raw(): number {
    const ms = Math.max(this.elapsed(), 500);
    return Math.round((this.attempts / 5) / (ms / 60000));
  }

  acc(): number {
    if (!this.attempts) return 100;
    return Math.round((this.correct / this.attempts) * 1000) / 10;
  }

  /** 节奏一致性：每词速度的变异系数，1 = 完全匀速 */
  consistency(): number {
    const arr = this.wordTimes.filter(x => x.dur > 60).map(x => (x.len / 5) / (x.dur / 60000));
    if (arr.length < 4) return 100;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (mean <= 0) return 100;
    const varr = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    const cv = Math.sqrt(varr) / mean;
    return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
  }

  snapshot(): Snapshot {
    return {
      idx: this.idx,
      combo: this.combo,
      maxCombo: this.maxCombo,
      correct: this.correct,
      errors: this.errors,
      attempts: this.attempts,
      wpm: this.wpm(),
      raw: this.raw(),
      acc: this.acc(),
      progress: this.idx / Math.max(1, this.length),
      elapsed: this.elapsed(),
      done: this.idx >= this.length,
      tick: this.tick,
      shield: this.shield,
      stage: this.flowStage(),
    };
  }

  tokenMarks(): number[] {
    return Array.from(this.marks);
  }
}

/** 幽灵回放：按时间戳推算"昨天的你"当前应该打到第几个字符 */
export function ghostIndex(marks: number[], elapsed: number): number {
  if (!marks.length) return 0;
  for (let i = 0; i < marks.length; i++) {
    if (marks[i] < 0 || marks[i] > elapsed) return i;
  }
  return marks.length;
}
