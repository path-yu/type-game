import { create } from 'zustand';
import type { Article, GhostFrame, RunResult, SceneStat, Screen, WordStat } from './types';
import { appendRun, isDesktop, loadNativeProgress, saveNativeProgress } from './native';
import { yesterdayKey } from './daily';
import { review, retrievability, type Grade } from './fsrs';
import { spreadConfusable } from './confuse';

const KEY = 'typewake:v1';
const DAY = 86400000;

export const dayNo = (t = Date.now()) => Math.floor(t / DAY);
export const todayStr = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

/** 旧调度阶梯，只用于把老数据迁移到 FSRS（s 曾是 0–5 的档位） */
const LEGACY_INTERVALS = [1, 3, 7, 16, 35, 75];

export interface Progress {
  mastery: Record<string, WordStat>;
  played: Record<string, number>;   // articleId -> 星级
  lvDone: Record<string, number>;   // 城区 -> 已完成条数
  ghost: Record<string, GhostFrame>;
  bestWpm: Record<string, number>;
  unlocked: number;
  streak: number;
  lastDay: string;
  recent: string[];
  totalSeconds: number;
  totalChars: number;
  runs: number;
  /** 最近 60 次的成绩，供体检报告画趋势 */
  history: { d: string; id: string; wpm: number; acc: number; cons: number; sec: number }[];
  /** 累计易错键对：`应打\u0000实打` → 次数 */
  keyErr: Record<string, number>;
  dailyDay: string;
  dailyArticle: string | null;
  dailyDone: boolean;      // 今日卷轴是否已完成
  dailyStreak: number;     // 连续完成每日卷轴的天数（与「任意练习」的 streak 区分）
  dailyLastDay: string;    // 最近一次完成每日卷轴的日期
  dailyWpm: number;        // 完成时的成绩（用于地图页回显）
  dailyStars: number;
  /** 场景对话：sceneId -> 练习记录 */
  scenes: Record<string, SceneStat>;
}

export interface Settings {
  voice: 'us' | 'uk';
  rate: number;        // 单词发音速度
  sound: boolean;      // 音效
  motion: boolean;
  autoSpeak: boolean;  // 打字时实时朗读刚打完的单词
  sentenceHelp: 'off' | 'gloss' | 'both'; // 打字时的句子解析
  clozeHint: 'none' | 'first' | 'both';   // 阅读填空的提示强度
  pretest: boolean;    // 开打前先过一遍生词（先测后学）
}

const emptyProgress = (): Progress => ({
  mastery: {},
  played: {},
  lvDone: {},
  ghost: {},
  bestWpm: {},
  unlocked: 1,
  streak: 0,
  lastDay: '',
  recent: [],
  totalSeconds: 0,
  totalChars: 0,
  runs: 0,
  history: [],
  keyErr: {},
  dailyDay: '',
  dailyArticle: null,
  dailyDone: false,
  dailyStreak: 0,
  dailyLastDay: '',
  dailyWpm: 0,
  dailyStars: 0,
  scenes: {},
});

const defaultSettings = (): Settings => ({ voice: 'us', rate: 1, sound: true, motion: true, autoSpeak: false, sentenceHelp: 'gloss', clozeHint: 'first', pretest: true });

interface State {
  ready: boolean;
  screen: Screen;
  article: Article | null;
  lastResult: RunResult | null;
  p: Progress;
  s: Settings;
  toast: string | null;

  boot: () => void;
  go: (s: Screen) => void;
  play: (a: Article) => void;
  finish: (r: RunResult) => void;
  review: (word: string, ok: boolean) => void;
  /** 阅读填空的结果：填对涨掌握度，填错记为错误并当天进夜巡 */
  applyCloze: (results: { word: string; ok: boolean }[]) => void;
  /** 场景对话练完一场：正确率入库，打错的词进夜巡。as=other 时写进换角成绩 */
  finishScene: (id: string, score: number, words: { w: string; ok: boolean }[], as?: 'you' | 'other') => void;
  markUnknown: (word: string) => void;
  toggleLex: (word: string) => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  /** 今日卷轴还没定或已跨天时，写入当天选中的文章 */
  ensureDaily: (id: string) => void;
  pushToast: (t: string) => void;
  reset: () => void;
}

/**
 * 一次作答落到词上：掌握度 + FSRS 记忆参数。
 *
 * 夜巡、预习卡、场景对话都走这一份 —— 三处各写一遍的话，
 * 「答错当天回炉」这种规则迟早会有一处漏掉。
 */
function gradedWord(base: WordStat | undefined, ok: boolean, today: number): WordStat {
  const st: WordStat = base ?? { m: 0, s: 0, due: 0, seen: 0, ok: 0, er: 0 };
  const m = Math.max(0, Math.min(100, st.m + (ok ? 15 : -20)));
  const prev = st.d != null
    ? { s: st.s, d: st.d, due: st.due, last: st.last ?? 0, reps: st.reps ?? 1, lapses: st.lapses ?? 0 }
    : null;
  const mem = review(prev, ok ? 3 : 1, today);
  return {
    ...st,
    m,
    seen: st.seen + 1,
    ok: st.ok + (ok ? 1 : 0),
    er: st.er + (ok ? 0 : 1),
    s: mem.s,
    d: mem.d,
    last: mem.last,
    reps: mem.reps,
    lapses: mem.lapses,
    // 答错的词当晚就回炉，答对的按 FSRS 排期
    due: ok ? mem.due : today,
  };
}

/**
 * 老档迁移：`s` 曾经是 0–5 的阶梯档位，FSRS 要求它是「稳定度天数」。
 * 不迁移的话，所有老词的 s 都是个位数，会被当成快要忘光的词，一夜之间全涌进夜巡。
 */
function migrateMastery(mastery: Record<string, WordStat>): Record<string, WordStat> {
  let migrated = 0;
  const out: Record<string, WordStat> = {};
  for (const [w, st] of Object.entries(mastery)) {
    if (st.d != null) { out[w] = st; continue; }
    const tier = Math.max(0, Math.min(5, Math.round(st.s || 0)));
    const days = LEGACY_INTERVALS[tier] ?? 1;
    out[w] = {
      ...st,
      s: days,
      d: 5,                                   // 未知难度，先给中位值
      reps: st.seen,
      lapses: st.er,
      last: Math.max(0, (st.due || 0) - days),
    };
    migrated++;
  }
  if (migrated) console.info(`[typewake] 已把 ${migrated} 个词的旧稳定度迁移到 FSRS`);
  return out;
}

function load(): { p: Progress; s: Settings } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { p: emptyProgress(), s: defaultSettings() };
    const j = JSON.parse(raw);
    const p = { ...emptyProgress(), ...(j.p || {}) };
    p.mastery = migrateMastery(p.mastery || {});
    return { p, s: { ...defaultSettings(), ...(j.s || {}) } };
  } catch {
    return { p: emptyProgress(), s: defaultSettings() };
  }
}

const initial = load();

export const useGame = create<State>((set, get) => ({
  ready: false,
  screen: 'map',
  article: null,
  lastResult: null,
  p: initial.p,
  s: initial.s,
  toast: null,

  boot: () => {
    // 桌面端优先读本地档案（卸载重装不丢档）
    if (isDesktop()) {
      void loadNativeProgress().then((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const d = raw as { p?: Partial<Progress>; s?: Partial<Settings> };
        set({
          p: { ...emptyProgress(), ...(d.p || {}) },
          s: { ...defaultSettings(), ...(d.s || {}) },
        });
      });
    }
    const { p } = get();
    const today = todayStr();
    if (p.lastDay && p.lastDay !== today) {
      const gap = dayNo() - dayNo(new Date(p.lastDay).getTime());
      if (gap > 1) set({ p: { ...p, streak: 0 } });
    }
    set({ ready: true });
  },

  go: (screen) => set({ screen }),

  play: (article) => set({ article, screen: 'play' }),

  finish: (r) => {
    const { p } = get();
    const today = todayStr();
    const mastery = { ...p.mastery };

    // 掌握度：首次打对 +12/次，重复 +4/次，打错 -6/次
    for (const w of Object.keys(r.detail)) {
      const d = r.detail[w];
      const st = mastery[w] ?? { m: d.p ?? 0, s: 0, due: 0, seen: 0, ok: 0, er: 0 };
      // 一次干净打对 +30，之后 +15 / +6 —— 半熟的词一次就能"会"，生僻词要反复
      const step = st.seen === 0 ? 30 : st.seen < 3 ? 15 : 6;
      const gain = step * Math.min(d.ok, 2);
      const loss = 8 * d.er;
      const m = Math.max(0, Math.min(100, st.m + gain - loss));
      const seen2 = st.seen + d.ok + d.er;

      // 复习间隔交给 FSRS：每个词有自己的难度和稳定度，不再共用一张 [1,3,7,16,35,75] 阶梯
      const grade: Grade =
        d.er === 0 ? (st.seen === 0 ? 4 : 3)   // 一次没错：首见算 easy，否则 good
        : d.ok > d.er ? 2                       // 错了但整体还是对得多：hard
        : 1;                                    // 错得比对得多：again
      const prev = st.d != null
        ? { s: st.s, d: st.d, due: st.due, last: st.last ?? 0, reps: st.reps ?? 1, lapses: st.lapses ?? 0 }
        : null;
      const mem = review(prev, grade, dayNo());
      // 打错的词当天就回炉（当晚夜巡就能捞回来），其余按 FSRS 排期
      const due = grade === 1 ? dayNo() : mem.due;

      mastery[w] = {
        ...st,
        m,
        seen: seen2,
        ok: st.ok + d.ok,
        er: st.er + d.er,
        s: mem.s,
        d: mem.d,
        last: mem.last,
        reps: mem.reps,
        lapses: mem.lapses,
        due,
      };
    }

    const played = { ...p.played, [r.articleId]: Math.max(p.played[r.articleId] ?? 0, r.stars) };

    const ghost = { ...p.ghost };
    const bestWpm = { ...p.bestWpm };
    const prevWpm = p.bestWpm[r.articleId] ?? null;
    if (!prevWpm || r.wpm > prevWpm) {
      bestWpm[r.articleId] = r.wpm;
      ghost[r.articleId] = { marks: r.marks, wpm: r.wpm };
    }

    // 解锁：本城区完成 ≥8 条即可进入下一城区
    const lvDone = { ...p.lvDone };
    if (!(r.articleId in p.played)) lvDone[r.lv] = (lvDone[r.lv] ?? 0) + 1;
    let unlocked = p.unlocked;
    if ((lvDone[r.lv] ?? 0) >= 8 && unlocked <= r.lv && r.lv < 7) unlocked = r.lv + 1;

    const streak = p.lastDay !== today ? p.streak + 1 : p.streak;

    // 体检报告的数据源：逐次成绩 + 累计易错键对
    const history = [
      ...p.history,
      { d: today, id: r.articleId, wpm: r.wpm, acc: r.acc, cons: r.consistency, sec: Math.round(r.elapsed / 1000) },
    ].slice(-60);
    const keyErr = { ...p.keyErr };
    for (const [k, n] of Object.entries(r.charErr ?? {})) keyErr[k] = (keyErr[k] ?? 0) + n;
    const recent = [r.articleId, ...p.recent.filter(x => x !== r.articleId)].slice(0, 12);

    // 今日卷轴：只有打的是今天那一篇才算完成
    const isDaily = p.dailyDay === today && p.dailyArticle === r.articleId;
    const dailyDone = isDaily ? true : p.dailyDone;
    // 每日连续：昨天做过就 +1，今天重复打不重复计，断了从 1 重来
    const dailyStreak = !isDaily
      ? p.dailyStreak
      : p.dailyLastDay === today
        ? p.dailyStreak
        : p.dailyLastDay === yesterdayKey()
          ? p.dailyStreak + 1
          : 1;
    const dailyLastDay = isDaily ? today : p.dailyLastDay;
    const dailyWpm = isDaily ? Math.max(p.dailyWpm, r.wpm) : p.dailyWpm;
    const dailyStars = isDaily ? Math.max(p.dailyStars, r.stars) : p.dailyStars;

    set({
      p: {
        ...p,
        mastery,
        dailyDone,
        dailyStreak,
        dailyLastDay,
        dailyWpm,
        dailyStars,
        played,
        lvDone,
        ghost,
        bestWpm,
        unlocked,
        streak,
        lastDay: today,
        recent,
        totalSeconds: p.totalSeconds + Math.round(r.elapsed / 1000),
        totalChars: p.totalChars + Math.round((r.wpm * r.elapsed) / 60000 * 5),
        runs: p.runs + 1,
        history,
        keyErr,
      },
      lastResult: r,
      screen: 'result',
    });
    save();
    void appendRun({
      articleId: r.articleId,
      wpm: r.wpm,
      accuracy: r.acc,
      consistency: r.consistency,
      stars: r.stars,
      elapsedMs: Math.round(r.elapsed),
    });
  },

  applyCloze: (results) => {
    const { p } = get();
    const mastery = { ...p.mastery };
    let right = 0;
    for (const { word, ok } of results) {
      const st = mastery[word] ?? { m: 0, s: 0, due: 0, seen: 0, ok: 0, er: 0 };
      if (ok) {
        right++;
        const m = Math.min(100, st.m + 12);
        mastery[word] = {
          ...st,
          m,
          seen: st.seen + 1,
          ok: st.ok + 1,
          s: Math.max(st.s, Math.min(5, Math.floor((st.ok + 1) / 2))),
        };
      } else {
        // 填错：掌握度小幅回落，并排进今晚的夜巡
        mastery[word] = {
          ...st,
          m: Math.max(0, st.m - 8),
          seen: st.seen + 1,
          er: st.er + 1,
          due: dayNo(),
        };
      }
    }
    set({
      p: {
        ...p,
        mastery,
        totalSeconds: p.totalSeconds + 30,
        lastDay: p.lastDay,
        streak: p.streak,
      },
      toast: `填空完成 · ${right}/${results.length} 正确`,
    });
    save();
  },

  review: (word, ok) => {
    const { p } = get();
    const mastery = { ...p.mastery, [word]: gradedWord(p.mastery[word], ok, dayNo()) };
    set({ p: { ...p, mastery } });
    save();
  },

  finishScene: (id, score, words, as = 'you') => {
    const { p } = get();
    const today = todayStr();
    const day = dayNo();
    const mastery = { ...p.mastery };
    // 只把真正打错的词记一笔 —— 整句八个词全记一遍，掌握度就没意义了
    for (const { w, ok } of words) mastery[w] = gradedWord(mastery[w], ok, day);

    const prev = p.scenes[id];
    const hit = Math.round(score);
    // 两个角色的成绩分开记 —— 换角打了满分，不该把「你」的最好成绩刷掉
    const scenes: Record<string, SceneStat> = {
      ...p.scenes,
      [id]: {
        best: as === 'other' ? (prev?.best ?? 0) : Math.max(prev?.best ?? 0, hit),
        swapBest: as === 'other' ? Math.max(prev?.swapBest ?? 0, hit) : prev?.swapBest,
        at: today,
        runs: (prev?.runs ?? 0) + 1,
      },
    };
    const streak = p.lastDay !== today ? p.streak + 1 : p.streak;
    set({
      p: { ...p, mastery, scenes, streak, lastDay: today, totalSeconds: p.totalSeconds + 90 },
      toast: `${as === 'other' ? '换角' : '这一场'}练完了 · 正确率 ${Math.round(score)}%`,
    });
    save();
  },

  markUnknown: (word) => {
    const { p } = get();
    const st = p.mastery[word];
    const today = dayNo();
    // 查了词＝承认不认识：掌握度打回 25，并让它当晚就进复习队列。
    // 这里不记 reps —— 用户只是看了一眼释义，没有真正作答。
    if (!st) {
      set({ p: { ...p, mastery: { ...p.mastery, [word]: { m: 25, s: 0.5, due: today, seen: 0, ok: 0, er: 0 } } } });
    } else if (st.m > 25 || st.due > today) {
      set({ p: { ...p, mastery: { ...p.mastery, [word]: { ...st, m: 25, due: today } } } });
    }
    save();
  },

  toggleLex: (word) => {
    const { p } = get();
    const st = p.mastery[word] ?? { m: 0, s: 0, due: dayNo() + 1, seen: 0, ok: 0, er: 0 };
    const lex = !st.lex;
    set({
      p: {
        ...p,
        mastery: { ...p.mastery, [word]: { ...st, lex, due: lex && !st.due ? dayNo() + 1 : st.due } },
      },
    });
    save();
  },

  ensureDaily: (id) => {
    const { p } = get();
    const today = todayStr();
    // 同一天且已经选过就不动 —— 中途解锁新城区也不该把今日卷轴换掉
    if (p.dailyDay === today && p.dailyArticle === id) return;
    set({
      p: { ...p, dailyDay: today, dailyArticle: id, dailyDone: false, dailyWpm: 0, dailyStars: 0 },
    });
    save();
  },

  setSetting: (k, v) => {
    const { s } = get();
    set({ s: { ...s, [k]: v } });
    save();
  },

  pushToast: (toast) => {
    set({ toast });
    setTimeout(() => set({ toast: null }), 2000);
  },

  reset: () => {
    set({ p: emptyProgress(), s: defaultSettings(), screen: 'map', article: null, lastResult: null });
    save();
  },
}));

let saveTimer: number | undefined;
export function save() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const { p, s } = useGame.getState();
    try {
      localStorage.setItem(KEY, JSON.stringify({ p, s }));
    } catch { /* 忽略配额错误 */ }
    if (isDesktop()) void saveNativeProgress({ p, s });
  }, 240);
}

/** 到期复习词 */
export function dueWords(mastery: Record<string, WordStat>, limit = 12): string[] {
  const today = dayNo();
  const out: { w: string; pri: number }[] = [];
  for (const [w, st] of Object.entries(mastery)) {
    if (!st.lex && !st.seen) continue;
    if (st.m >= 95) continue;
    if (today < (st.due || 0)) continue;      // 还没到期
    // 到期的词按「此刻还记得住的概率」排序 —— 越快忘的越先复习。
    // 旧版按「掌握度 + 逾期天数」排，逾期久的反而排后面，顺序是反的。
    const r = retrievability(today - (st.last ?? today), st.s || 0.5);
    out.push({ w, pri: r });
  }
  out.sort((a, b) => a.pri - b.pri);
  // 形近词别挤在同一批：affect 和 effect 一起复习会互相干扰
  return spreadConfusable(out.map(x => x.w), limit);
}
