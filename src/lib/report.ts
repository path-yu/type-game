/**
 * 打字体检：把「最近 60 次成绩 + 累计易错键 + 词掌握度」压成几组可执行结论。
 *
 * 设计原则：**报告必须给出判断，而不是罗列数据。**
 * 用户看到的应该是「你的瓶颈是准确率」，不是「准确率 91.2%，WPM 43」——
 * 后者他自己也会看，前者才需要分析。
 */
import type { Corpus } from './data';
import type { Progress } from './store';
import { BRANCH_KINDS } from './dialogue';

export interface Report {
  runs: number;
  minutes: number;
  avgWpm: number;
  bestWpm: number;
  avgAcc: number;
  avgCons: number;
  trend: number[];
  /** 易错键对：应打 → 实打 */
  topKeys: { from: string; to: string; n: number }[];
  /** 最该复习的词（按错误次数） */
  weakWords: { w: string; zh: string; er: number; m: number }[];
  /** 一句话诊断 */
  verdict: { title: string; detail: string; tone: 'good' | 'warn' | 'bad' };
  /** 三条建议 */
  tips: string[];
  /** 场景对话：和打字是两种能力，单独一块 */
  talk: TalkReport;
}

export interface TalkReport {
  played: number;      // 练过几场
  total: number;       // 语料一共几场（0 = 还没加载）
  bothWays: number;    // 两个角色都练过的
  live: number;        // 实战过的
  bestAvg: number;     // 「说台词」的平均最好成绩
  liveAvg: number;     // 实战接住率
  /** 两种能力的差距诊断；样本不够时为 null，不硬下结论 */
  verdict: { title: string; detail: string; tone: 'good' | 'warn' | 'bad' } | null;
  /** 按岔路类型分开统计：接住率低的排前面 */
  branches: BranchRow[];
  /** 最容易卡住的那一类；样本不足两场时为 null */
  weakBranch: BranchRow | null;
}

export interface BranchRow {
  kind: string;
  label: string;
  ok: number;
  n: number;
  rate: number;   // 0-100
}

const TARGET_WPM = [0, 26, 30, 36, 42, 48, 54, 60];

export function buildReport(p: Progress, corpus: Corpus, unlocked: number, opts: { scenes?: number } = {}): Report {
  const all = p.history ?? [];
  // 超过 300 WPM 基本是脚本/自动化输入（人类纪录约 210），混进平均值会让报告失真
  const usable = all.filter(x => x.wpm > 0 && x.wpm <= 300);
  const h = usable.length ? usable : all;
  const runs = h.length;
  const minutes = Math.round(p.totalSeconds / 60);

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const avgWpm = avg(h.map(x => x.wpm));
  const avgAcc = h.length ? Math.round((h.reduce((a, x) => a + x.acc, 0) / h.length) * 10) / 10 : 0;
  const avgCons = avg(h.map(x => x.cons));
  const bestWpm = Math.max(0, ...Object.values(p.bestWpm ?? {}).filter(w => w <= 300), ...h.map(x => x.wpm));
  const trend = h.slice(-30).map(x => x.wpm);

  const topKeys = Object.entries(p.keyErr ?? {})
    .map(([k, n]) => {
      const [from, to] = k.split('\u0000');
      return { from: from ?? '', to: to ?? '', n };
    })
    .filter(k => k.from && k.to)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  const weakWords = Object.entries(p.mastery ?? {})
    .filter(([, st]) => st.er > 0)
    .map(([w, st]) => ({
      w,
      zh: (corpus.dict.get(w)?.z ?? '').split('\n')[0]?.replace(/^[a-z]+\.\s*/i, '') ?? '',
      er: st.er,
      m: Math.round(st.m),
    }))
    .sort((a, b) => b.er - a.er || a.m - b.m)
    .slice(0, 8);

  /* ---------- 场景对话：说台词 vs 临场接话 ---------- */
  const sceneStats = Object.values(p.scenes ?? {});
  const talkBest = sceneStats.map(st => st.best).filter(n => n > 0);
  const talkLive = sceneStats.map(st => st.liveBest).filter((n): n is number => typeof n === 'number');
  const bestAvg = avg(talkBest);
  const liveAvg = avg(talkLive);

  // 只在两样都练过几场之后才下结论 —— 一场的分差说明不了任何事
  let talkVerdict: TalkReport['verdict'] = null;
  if (talkLive.length >= 2 && talkBest.length >= 1) {
    const gap = bestAvg - liveAvg;
    if (gap >= 20) {
      talkVerdict = {
        title: '台词背得下来，临场接不住',
        detail: `说台词最好 ${bestAvg}%，实战接住率只有 ${liveAvg}%。差的不是发音也不是词，是没人给稿子时想不出怎么接。`,
        tone: 'warn',
      };
    } else if (liveAvg < 60) {
      talkVerdict = {
        title: '实战还没上手',
        detail: `实战接住率 ${liveAvg}%。先把整场的句子用「背打」走熟，再来碰岔路——同时练两件事反而都练不进去。`,
        tone: 'bad',
      };
    } else if (gap <= 8) {
      talkVerdict = {
        title: '既能背，也能接',
        detail: `说台词 ${bestAvg}%、实战 ${liveAvg}%，两条线差不多齐——说明你不只是在背句子，是真的能换一种说法接上去。`,
        tone: 'good',
      };
    }
  }

  /* ---------- 岔路：哪一类意外最容易卡住 ---------- */
  const bs = p.branchStats ?? {};
  const branches: BranchRow[] = Object.entries(BRANCH_KINDS)
    .map(([kind, label]) => {
      const st = bs[kind] ?? { ok: 0, n: 0 };
      return { kind, label, ok: st.ok, n: st.n, rate: st.n ? Math.round((st.ok / st.n) * 100) : 0 };
    })
    .filter(b => b.n > 0)
    // 只练过一次的类型排到最后：样本不够，看了也不能下结论，
    // 排在前面反而会把「真正最弱的那类」挤下去
    .sort((a, b) => (Number(a.n < 2) - Number(b.n < 2)) || (a.rate - b.rate) || (b.n - a.n));
  // 只练过一次就下结论是碰运气；至少两次、且接住率不过半，才值得让人专门去补
  const weakBranch = branches.find(b => b.n >= 2 && b.rate < 50) ?? null;

  const talk: TalkReport = {
    played: sceneStats.length,
    total: opts.scenes ?? 0,
    bothWays: sceneStats.filter(st => st.best > 0 && st.swapBest != null).length,
    live: talkLive.length,
    bestAvg,
    liveAvg,
    verdict: talkVerdict,
    branches,
    weakBranch,
  };

  const target = TARGET_WPM[Math.min(7, Math.max(1, unlocked))];
  const totalErr = topKeys.reduce((s, k) => s + k.n, 0);

  /* ---------- 诊断 ---------- */
  let verdict: Report['verdict'];
  if (runs === 0) {
    verdict = { title: '还没有数据', detail: '先打三条卷轴，报告才有东西可看。', tone: 'warn' };
  } else if (avgAcc < 94) {
    verdict = {
      title: '瓶颈是准确率，不是手速',
      detail: `平均准确率 ${avgAcc}%，每 100 个字符错 ${Math.round(100 - avgAcc)} 个。改错要停下来重找位置，这才是慢的原因。`,
      tone: 'bad',
    };
  } else if (avgCons < 55) {
    verdict = {
      title: '节奏不稳：忽快忽慢',
      detail: `一致性 ${avgCons}%。匀速比冲刺更省力——你的峰值 ${bestWpm} WPM 说明手能跟上，是节奏把它浪费了。`,
      tone: 'warn',
    };
  } else if (avgWpm < target) {
    verdict = {
      title: '准确率够用，速度还差一段',
      detail: `平均 ${avgWpm} WPM，当前城区目标 ${target} WPM。差 ${target - avgWpm} 个词/分钟，靠熟练度能补上。`,
      tone: 'warn',
    };
  } else {
    verdict = {
      title: '状态很好',
      detail: `平均 ${avgWpm} WPM、准确率 ${avgAcc}%，已经超过当前城区目标 ${target} WPM。可以往更难的城区走。`,
      tone: 'good',
    };
  }

  /* ---------- 建议 ---------- */
  const tips: string[] = [];
  if (totalErr > 0 && topKeys[0]) {
    tips.push(`最容易打错的是「应打 ${topKeys[0].from}、打成 ${topKeys[0].to}」——${topKeys[0].n} 次。先盯住这一对，比盲目多打有效。`);
  }
  if (weakWords.length) {
    tips.push(`有 ${weakWords.length} 个词反复打错（最多的 ${weakWords[0].w}），夜巡会自动把它们排进队。`);
  }
  if (runs >= 3 && avgCons < 60) {
    tips.push('一致性低于 60% 时，把目标从「更快」改成「不停顿」——匀速的 40 WPM 比忽快忽慢的 50 更省力。');
  }
  if (avgAcc >= 98 && avgWpm >= target) {
    tips.push(`准确率 ${avgAcc}% 已经很高，可以试着打比当前城区高一档的文本找新瓶颈。`);
  }
  if (weakBranch) {
    tips.push(
      `岔路里「${weakBranch.label}」这一类你只接住 ${weakBranch.ok}/${weakBranch.n} —— ` +
      '去对话里专挑这类练，换一种说法是练出来的，不是临场想出来的。'
    );
  }
  if (talkVerdict?.tone === 'warn' && talkLive.length >= 2) {
    tips.push('实战分数低不代表背得差，缺的是「换一种说法」的储备——去对话里专挑岔路练，记住那几句能救场的短句。');
  }
  if (tips.length < 2) tips.push('每天打一篇比周末打十篇有用——连续天数比总时长更能带走能力。');

  return { runs, minutes, avgWpm, bestWpm, avgAcc, avgCons, trend, topKeys, weakWords, verdict, tips, talk };
}
