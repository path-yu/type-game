import { useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { estimateVocab, newWordRate, recommend } from '../lib/data';
import { dayNo, dayNoOfKey, sceneStale, useGame } from '../lib/store';
import type { Article } from '../lib/types';
import { aliveDailyStreak, peekTomorrow, pickDaily, pickDailyScene, todayKey } from '../lib/daily';
import { loadDialogues, type Scene } from '../lib/dialogue';
import { DISTRICTS, THEME } from '../lib/districts';

const TARGET = [0, 26, 30, 36, 42, 48, 54, 60];

export function MapScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const play = useGame(s => s.play);
  const pushToast = useGame(s => s.pushToast);
  const go = useGame(s => s.go);

  const ensureDaily = useGame(s => s.ensureDaily);
  const openScene = useGame(s => s.openScene);
  const openSceneList = useGame(s => s.openSceneList);
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

  /* 今日对话：语料单独拉一次（有缓存），没加载好就先只显示文章 */
  const [scenes, setScenes] = useState<Scene[] | null>(null);
  useEffect(() => {
    let alive = true;
    void loadDialogues().then(b => { if (alive && b) setScenes(b.scenes); });
    return () => { alive = false; };
  }, []);
  const dailyScenePicked = useMemo(
    () => (scenes ? pickDailyScene(scenes, p.unlocked, today) : null),
    [scenes, p.unlocked, today]
  );
  const dailyScene = useMemo(
    () => (dailyScenePicked && p.dailyScene
      ? scenes?.find(s => s.id === p.dailyScene) ?? dailyScenePicked
      : dailyScenePicked),
    [scenes, p.dailyScene, dailyScenePicked]
  );

  // 不按「跨天才写」来判：对话语料比文章晚到一帧，第一次写入时可能还没有场景 id。
  // ensureDaily 内部会比对当前值，没变化就直接返回，所以这里可以每次都调。
  useEffect(() => {
    ensureDaily(picked.id, dailyScenePicked?.id);
  }, [p.dailyDay, today, picked.id, dailyScenePicked, ensureDaily]);

  const daily = useMemo(
    () => corpus.articles.find(a => a.id === p.dailyArticle) ?? picked,
    [corpus, p.dailyArticle, picked]
  );
  const dailyDone = p.dailyDay === today && p.dailyDone;
  const dailySceneDone = p.dailyDay === today && p.dailySceneDone;
  const todayDone = (dailyDone ? 1 : 0) + (dailySceneDone ? 1 : 0);
  const dailyStreak = aliveDailyStreak(p, today);
  const tomorrow = useMemo(() => peekTomorrow(corpus, p.unlocked), [corpus, p.unlocked]);
  const dailyInfo = useMemo(() => newWordRate(corpus, daily, p.mastery), [corpus, daily, p.mastery]);

  /**
   * 该重温的对话：练过、但超过 SCENE_REVIEW_DAYS 没再练。
   * 条数只用到存档里的日期（语料没到也算得出），名字要语料到了才补，按最久没练排前面。
   */
  const dueIds = useMemo(() => {
    const today = dayNo();
    return Object.keys(p.scenes)
      .filter(id => sceneStale(p.scenes[id], today))
      .sort((a, b) => dayNoOfKey(p.scenes[a].at) - dayNoOfKey(p.scenes[b].at));
  }, [p.scenes]);
  const dueSceneN = dueIds.length;
  const dueScenes = useMemo(
    () => (scenes ? dueIds.map(id => scenes.find(s => s.id === id)).filter((s): s is Scene => !!s) : []),
    [scenes, dueIds],
  );
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

      {dailyScene && (
        <button
          className={`daily-row scene${dailySceneDone ? ' done' : ''}`}
          onClick={() => openScene(dailyScene.id)}
        >
          <span className="daily-mark">{dailySceneDone ? '✓' : '❝'}</span>
          <span className="daily-body">
            <span className="daily-label">
              今日对话 · {dailyScene.cat}
              <em className="daily-streak">今日 {todayDone} / 2</em>
            </span>
            <span className="daily-title">{dailyScene.name}</span>
            <span className="daily-meta">
              {dailyScene.cefr} · 你 {dailyScene.lines.filter(l => l.r === dailyScene.you).length} 句台词
              · {dailyScene.phrases.length} 个句型 · 1 处岔路
            </span>
          </span>
          <span className="daily-go">{dailySceneDone ? '再练一次' : '去练'}</span>
        </button>
      )}

      {dueSceneN > 0 && (
        <button className="daily-row due" onClick={() => openSceneList('due')}>
          <span className="daily-mark">↺</span>
          <span className="daily-body">
            <span className="daily-label">
              该重温 · 对话
              <em className="daily-streak">{dueSceneN} 场超过两周没练</em>
            </span>
            <span className="daily-title">
              {dueScenes[0] ? dueScenes[0].name : '把练过的对话翻回去再过一遍'}
              {dueScenes.length > 1 ? ` 等 ${dueScenes.length} 场` : ''}
            </span>
            <span className="daily-meta">
              {dueScenes[0]
                ? `最久的一场 ${dayNo() - dayNoOfKey(p.scenes[dueScenes[0].id].at)} 天没练 · `
                : ''}
              两周不开口就会生，翻回去比练新的省力
            </span>
          </span>
          <span className="daily-go">翻回去</span>
        </button>
      )}

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
