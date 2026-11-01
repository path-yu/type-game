import { useEffect, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { lookup, recommend } from '../lib/data';
import { useGame } from '../lib/store';
import { speak } from '../lib/speech';
import { chime } from '../lib/sfx';
import { IconStar } from '../components/Icons';
import { aliveDailyStreak, todayKey } from '../lib/daily';

const LEVEL_NAME = ['', 'A1.1', 'A1.2', 'A2', 'B1', 'B1+', 'B2', 'C1'];
const LEVEL_TITLE = ['', '石阶巷', '灯火市集', '钟楼区', '雾港', '档案馆', '星图台', '无名塔'];

export function ResultScreen() {
  const corpus = useCorpus();
  const r = useGame(s => s.lastResult);
  const p = useGame(s => s.p);
  const s = useGame(s => s.s);
  const go = useGame(s => s.go);
  const play = useGame(s => s.play);
  const article = useGame(s => s.article);

  const [shown, setShown] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!r) return;
    let cur = 0;
    const target = r.wpm;
    const step = () => {
      cur += Math.max(1, Math.round((target - cur) / 7));
      if (cur >= target) cur = target;
      setShown(cur);
      if (cur < target) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    chime();
    return () => cancelAnimationFrame(raf.current);
  }, [r]);

  if (!r) {
    return <div className="empty">还没有记录</div>;
  }

  const delta = r.prevWpm == null ? null : r.wpm - r.prevWpm;
  const doneAtLevel = p.lvDone[r.lv] ?? 0;

  const next = () => {
    if (article) {
      const a = recommend(corpus, p.mastery, article.lv, p.recent);
      play(a);
    } else {
      go('map');
    }
  };

  return (
    <div className="result">
      <div className="stars">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`star${i >= r.stars ? ' off' : ''}`}
            style={{ animationDelay: `${i * 160}ms`, opacity: 0 }}
          >
            <IconStar filled={i < r.stars} />
          </span>
        ))}
      </div>

      {p.dailyDay === todayKey() && p.dailyArticle === r.articleId && p.dailyDone && (
        <div className="daily-done">
          今日卷轴 ✓
          {aliveDailyStreak(p) > 1 ? ` · 每日连续 ${aliveDailyStreak(p)} 天` : ' · 今天的第一篇'}
        </div>
      )}

      <div className="wpm-big">
        {shown}
        <u>WPM</u>
      </div>
      <div className="sub">
        准确率 <b>{r.acc.toFixed(1)}%</b> · 一致性 <b>{r.consistency}%</b> · 用时{' '}
        <b>
          {Math.floor(r.elapsed / 60000)}:
          {String(Math.floor((r.elapsed % 60000) / 1000)).padStart(2, '0')}
        </b>
      </div>
      <div className="delta">
        {delta == null
          ? '第一条记录已刻下 —— 下次来追它'
          : delta > 0
            ? `↑ 比上次快 ${delta} WPM · 你超越了昨天的自己`
            : delta === 0
              ? '和上次一样快 · 再稳一点就能超车'
              : `比幽灵慢了 ${-delta} WPM · 它只领先一点点`}
      </div>

      {r.newWords.length > 0 && (
        <div className="panel">
          <div className="ph">本局新词 · {r.newWords.length}</div>
          <div className="chips">
            {r.newWords.map(w => {
              const e = lookup(corpus, w);
              return (
                <span key={w} className="chip" onClick={() => speak(w, { accent: s.voice, rate: 0.9 })}>
                  {w} <span className="sp">🔊</span>
                  {e?.z ? <span style={{ fontSize: 11, color: 'var(--tx-dim)', fontFamily: 'var(--sans)' }}>{e.z.split('\n')[0].slice(0, 12)}</span> : null}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {r.errorWords.length > 0 && (
        <div className="panel">
          <div className="ph">回声练习 · {r.errorWords.length} 个错词</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--tx-muted)', flex: 1 }}>
              {r.errorWords.slice(0, 8).join(' · ')}
            </div>
            <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5 }} onClick={() => go('review')}>
              练这几个词
            </button>
          </div>
        </div>
      )}

      <div className="district-line">
        <span>{LEVEL_TITLE[r.lv]} · {LEVEL_NAME[r.lv]}</span>
        <span className="dotbar"><i style={{ width: `${Math.min(100, (doneAtLevel / 8) * 100)}%` }} /></span>
        <span>已点亮 {doneAtLevel} / 8</span>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={next}>再来一条<span className="kbd">Enter</span></button>
        <button className="btn btn-ghost" onClick={() => go('map')}>回地图</button>
        <button className="btn btn-ghost" onClick={() => go('lexicon')}>藏书阁</button>
      </div>
    </div>
  );
}
