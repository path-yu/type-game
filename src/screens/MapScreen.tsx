import { useEffect, useMemo } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { estimateVocab, newWordRate, recommend } from '../lib/data';
import { useGame } from '../lib/store';
import type { Article } from '../lib/types';
import { aliveDailyStreak, peekTomorrow, pickDaily, todayKey } from '../lib/daily';
import { DISTRICTS, THEME } from '../lib/districts';

const TARGET = [0, 26, 30, 36, 42, 48, 54, 60];

export function MapScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const play = useGame(s => s.play);
  const pushToast = useGame(s => s.pushToast);
  const go = useGame(s => s.go);

  const ensureDaily = useGame(s => s.ensureDaily);
  const vocab = estimateVocab(p.mastery, corpus);
  const level = Math.min(7, Math.max(1, p.unlocked));

  const next: Article = useMemo(
    () => recommend(corpus, p.mastery, level, p.recent),
    [corpus, p.mastery, p.recent, level]
  );

  const info = useMemo(() => newWordRate(corpus, next, p.mastery), [corpus, next, p.mastery]);

  /* 每日卷轴：当天第一次进入时定稿，之后固定 */
  const today = todayKey();
  const picked = useMemo(() => pickDaily(corpus, p.unlocked, today), [corpus, p.unlocked, today]);
  useEffect(() => {
    if (p.dailyDay !== today) ensureDaily(picked.id);
  }, [p.dailyDay, today, picked.id, ensureDaily]);

  const daily = useMemo(
    () => corpus.articles.find(a => a.id === p.dailyArticle) ?? picked,
    [corpus, p.dailyArticle, picked]
  );
  const dailyDone = p.dailyDay === today && p.dailyDone;
  const dailyStreak = aliveDailyStreak(p, today);
  const tomorrow = useMemo(() => peekTomorrow(corpus, p.unlocked), [corpus, p.unlocked]);
  const dailyInfo = useMemo(() => newWordRate(corpus, daily, p.mastery), [corpus, daily, p.mastery]);
  const totalDone = Object.keys(p.played).length;

  const startAt = (lv: number) => {
    if (lv > p.unlocked) {
      pushToast(`先完成${DISTRICTS[lv - 2]?.name ?? '上一城区'}的 8 条卷轴`);
      return;
    }
    play(recommend(corpus, p.mastery, lv, p.recent));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">城市</h1>
          <div className="page-sub">
            已解锁 {p.unlocked} / 7 城区 · 完成 {totalDone} 条卷轴 · 词汇量 {vocab.toLocaleString()}
          </div>
        </div>
        <span className="head-right">
          <button className="ghost-btn" onClick={() => go('library')}>
            全部 {corpus.articles.length} 篇 ›
          </button>
          <span className="pill-badge">{p.streak > 0 ? `连续 ${p.streak} 天` : '今天还没开张'}</span>
        </span>
      </div>

      <div className="hero">
        <div className="h-body">
          <div className="h-label">接着打</div>
          <div className="h-title">
            {next.s}
            {next.ord && next.tot ? <em className="h-part">· 第 {next.ord}/{next.tot} 段</em> : null}
          </div>
          <div className="h-meta">
            <span>{DISTRICTS[next.lv - 1].name}</span>
            <span>{DISTRICTS[next.lv - 1].cefr}</span>
            <span>{THEME[next.th] ?? '阅读'}</span>
            <span>{next.w} 词</span>
            <span>生词 <em>{info.unknown.length}</em></span>
            <span>目标 {TARGET[next.lv]} WPM</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => play(next)}>
          开始打字<span className="kbd">Enter</span>
        </button>
      </div>

      <button className={`daily-row${dailyDone ? ' done' : ''}`} onClick={() => play(daily)}>
        <span className="daily-mark">{dailyDone ? '✓' : '✦'}</span>
        <span className="daily-body">
          <span className="daily-label">
            今日卷轴 · {today}
            {dailyStreak > 0 && <em className="daily-streak">连续 {dailyStreak} 天</em>}
          </span>
          <span className="daily-title">{daily.s}</span>
          <span className="daily-meta">
            {DISTRICTS[daily.lv - 1].name} · {THEME[daily.th] ?? '阅读'} · {daily.w} 词 · 生词 {dailyInfo.unknown.length}
            {daily.ord && daily.tot ? ` · 第 ${daily.ord}/${daily.tot} 段` : ''}
            {/* 上限保护：正常人手打不会超过 300 WPM，超出多半是脚本或无头测试 */}
            {dailyDone && p.dailyWpm > 0 && p.dailyWpm <= 300 ? ` · 今日最好 ${p.dailyWpm} WPM` : ''}
          </span>
          {dailyDone && <span className="daily-next">明日 · {tomorrow.s}</span>}
        </span>
        <span className="daily-go">{dailyDone ? '再打一次' : '开始'}</span>
      </button>

      <div className="dist-list">
        {DISTRICTS.map(d => {
          const done = p.lvDone[d.lv] ?? 0;
          const locked = d.lv > p.unlocked;
          const finished = done >= 8;
          return (
            <button
              key={d.lv}
              className={`dist-row${locked ? ' locked' : ''}${d.lv === p.unlocked ? ' cur' : ''}${finished ? ' done' : ''}`}
              onClick={() => startAt(d.lv)}
            >
              <span className="dist-idx">{finished ? '✓' : d.lv}</span>
              <span className="dist-main">
                <span className="dist-name">
                  {d.name}
                  <span className="pill-badge">{d.cefr}</span>
                  {d.lv === p.unlocked && <span className="pill-badge gold">进行中</span>}
                </span>
                <span className="dist-meta">
                  {d.desc} · {done}/8
                </span>
              </span>
              <span className="dist-bar"><i style={{ width: `${Math.min(100, (done / 8) * 100)}%` }} /></span>
              <span className={`dist-go${locked ? ' muted' : ''}`}>
                {locked ? '锁定' : finished ? '重打' : '进入'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
