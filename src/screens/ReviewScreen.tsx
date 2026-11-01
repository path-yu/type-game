import { useEffect, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { lookup } from '../lib/data';
import { dayNo, useGame } from '../lib/store';
import { speak } from '../lib/speech';
import { chime, errorThud, keyClick } from '../lib/sfx';
import type { WordStat } from '../lib/types';

/**
 * 夜巡 = 听写。
 * 抽一批「该复习的词」，只播发音，你把它敲出来。
 * 想不起来可以点「看提示」，看中文释义 —— 不算错，只是这条会排在更前面。
 */
function buildQueue(mastery: Record<string, WordStat>, limit = 12): string[] {
  const today = dayNo();
  const items = Object.entries(mastery)
    .map(([w, st]) => {
      const overdue = today - (st.due || 0);
      let pri = 99;
      if (overdue >= 0) pri = 0;          // 到期
      else if (st.m < 50) pri = 1;        // 还没掌握
      else if (st.er > 0) pri = 2;        // 打错过
      else if (st.lex) pri = 3;           // 收藏过
      return { w, st, pri, overdue };
    })
    .filter(x => x.pri < 99);

  items.sort((a, b) => (a.pri - b.pri) || (a.st.m - b.st.m));
  return items.slice(0, limit).map(x => x.w);
}

type Phase = 'ask' | 'right' | 'wrong';

export function ReviewScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const review = useGame(s => s.review);
  const go = useGame(s => s.go);

  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<string[]>(() => buildQueue(p.mastery));
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('ask');
  const [hint, setHint] = useState(false);
  const [rightCount, setRightCount] = useState(0);
  const [wrongList, setWrongList] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const word = queue[i] ?? '';
  const entry = word ? lookup(corpus, word) : null;
  const target = word.replace(/[^a-z']/gi, '');
  const finished = i >= queue.length;

  const replay = () => speak(word, { accent: settings.voice, rate: settings.rate });

  // 换题时自动播一次
  useEffect(() => {
    if (finished || !word) return;
    const t = window.setTimeout(replay, 260);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, word, finished]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (val: string) => {
    const ok = val.toLowerCase() === target.toLowerCase();
    setPhase(ok ? 'right' : 'wrong');
    review(word, ok);
    if (ok) { chime(); setRightCount(c => c + 1); }
    else { errorThud(); setWrongList(l => [...l, word]); }
    window.setTimeout(replay, 320);
    timer.current = window.setTimeout(() => {
      setI(v => v + 1);
      setTyped('');
      setHint(false);
      setPhase('ask');
    }, ok ? 900 : 1900);
  };

  useEffect(() => {
    if (finished) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { go('map'); return; }
      if (phase !== 'ask') return;
      if (ev.key === 'Backspace') { ev.preventDefault(); setTyped(v => v.slice(0, -1)); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); replay(); return; }
      if (ev.repeat || ev.key.length !== 1) return;
      if (!/[a-zA-Z' -]/.test(ev.key)) return;
      ev.preventDefault();
      keyClick();
      const next = typed + ev.key;
      setTyped(next);
      if (next.length >= target.length) submit(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, phase, finished, target]);

  const again = () => {
    setQueue(buildQueue(useGame.getState().p.mastery));
    setRound(r => r + 1);
    setI(0);
    setTyped('');
    setHint(false);
    setPhase('ask');
    setRightCount(0);
    setWrongList([]);
  };

  /* ---------- 空状态 ---------- */
  if (!queue.length) {
    return (
      <div className="review">
        <div className="rv-top">
          <button className="icon-btn" onClick={() => go('map')}>✕</button>
          <span>夜巡</span>
        </div>
        <div className="empty">
          <div className="icon">🌙</div>
          <div className="t">还没有可以复习的词</div>
          <div className="d">去打一条卷轴，遇到不认识的词点一下 —— 它就会进夜巡队列。</div>
          <button className="btn btn-primary" onClick={() => go('map')}>去城市</button>
        </div>
      </div>
    );
  }

  /* ---------- 结算 ---------- */
  if (finished) {
    const allRight = wrongList.length === 0;
    return (
      <div className="review">
        <div className="rv-top">
          <button className="icon-btn" onClick={() => go('map')}>✕</button>
          <span>夜巡 · 第 {round + 1} 轮结束</span>
        </div>
        <div className="rv-body">
          <div className="rv-card" style={{ minHeight: 0 }}>
            <div className="rv-done-title">{rightCount} / {queue.length} 拼对了</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', textAlign: 'center', lineHeight: 1.7 }}>
              {allRight ? '全对。这批词下次见面会更牢。' : `${wrongList.length} 个词已经排回队首，明天再听一次。`}
            </div>
            {wrongList.length > 0 && (
              <div className="chips" style={{ justifyContent: 'center' }}>
                {wrongList.map(w => (
                  <span key={w} className="chip" onClick={() => speak(w, { accent: settings.voice, rate: settings.rate })}>
                    {w} <span className="sp">🔊</span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => go('map')}>回城市</button>
              <button className="btn btn-primary" onClick={again}>再来一轮</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 答题 ---------- */
  return (
    <div className="review">
      <div className="rv-top">
        <button className="icon-btn" onClick={() => go('map')}>✕</button>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{i + 1} / {queue.length}</span>
        <span style={{ opacity: 0.7 }}>听写</span>
        <div className="dots">
          {queue.map((_, k) => (
            <i key={k} className={k < i ? ' on' : ''} />
          ))}
        </div>
      </div>

      <div className="rv-body">
        <div className="rv-card">
          <div className="rv-mode">
            {phase === 'right' ? '拼对了' : phase === 'wrong' ? '正确拼写' : '听发音，写出这个词'}
          </div>

          {phase === 'wrong' ? (
            <div className="rv-answer">{target}</div>
          ) : (
            <button className="rv-play" onClick={replay} title="再听一次（Enter）">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
              </svg>
            </button>
          )}

          <div className="rv-slots">
            {Array.from({ length: Math.max(target.length, typed.length) }).map((_, k) => {
              const c = typed[k];
              const isWrong = phase === 'wrong' || (c && c.toLowerCase() !== target[k]?.toLowerCase());
              return (
                <span
                  key={k}
                  className={`rv-slot${c ? (isWrong ? ' e' : ' f') : ''}${k === typed.length && phase === 'ask' ? ' cur' : ''}`}
                >
                  {c || ''}
                </span>
              );
            })}
          </div>

          {hint && phase === 'ask' && (
            <div className="rv-hint">{entry?.z ? entry.z.split('\n')[0] : '（这个词没有中文释义）'}</div>
          )}

          {phase === 'ask' && !hint && (
            <button className="rv-speak" onClick={() => setHint(true)}>看提示</button>
          )}
          {phase === 'wrong' && entry?.z && (
            <div className="rv-hint">{entry.z.split('\n')[0]}</div>
          )}
          {phase === 'right' && (
            <div className="rv-hint">{entry?.z ? entry.z.split('\n')[0] : ''}</div>
          )}
        </div>
      </div>

      <div className="rv-foot">
        {phase === 'ask' ? 'Enter 重听 · 想不起来就点「看提示」' : phase === 'right' ? '记住它' : '再听一次，然后继续'}
      </div>
    </div>
  );
}
