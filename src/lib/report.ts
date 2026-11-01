/**
 * 打字体检：把「最近 60 次成绩 + 累计易错键 + 词掌握度」压成几组可执行结论。
 *
 * 设计原则：**报告必须给出判断，而不是罗列数据。**
 * 用户看到的应该是「你的瓶颈是准确率」，不是「准确率 91.2%，WPM 43」——
 * 后者他自己也会看，前者才需要分析。
 */
import type { Corpus } from './data';
import type { Progress } from './store';

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
}

const TARGET_WPM = [0, 26, 30, 36, 42, 48, 54, 60];

export function buildReport(p: Progress, corpus: Corpus, unlocked: number): Report {
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
  if (tips.length < 2) tips.push('每天打一篇比周末打十篇有用——连续天数比总时长更能带走能力。');

  return { runs, minutes, avgWpm, bestWpm, avgAcc, avgCons, trend, topKeys, weakWords, verdict, tips };
}
