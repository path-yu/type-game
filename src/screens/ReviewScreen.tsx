import { useEffect, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { lookup } from '../lib/data';
import { dayNo, useGame } from '../lib/store';
import { rivalsOf } from '../lib/confuse';
import { speak } from '../lib/speech';
import { chime, errorThud, keyClick } from '../lib/sfx';
import { diff, initials, loadDialogues, maskWords, type Scene } from '../lib/dialogue';
import { unlockedPhrases } from '../lib/phrases';
import type { PhraseItem } from '../lib/phrases';
import { buildReviewQueue, type ReviewItem } from '../lib/review';

/**
 * 夜巡 = 听写 + 少量句型。
 *
 * 单词只播发音，你把它敲出来；想不起来可以点「看提示」。
 * 中间会夹一两句到期的句型 —— 和单词共用一套 FSRS，
 * 这样「今天该复习什么」只有一个入口，不用记两套节奏。
 */

type Phase = 'ask' | 'right' | 'wrong';

export function ReviewScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const review = useGame(s => s.review);
  const reviewPhrase = useGame(s => s.reviewPhrase);
  const go = useGame(s => s.go);

  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<ReviewItem[] | null>(null);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('ask');
  const [hint, setHint] = useState(false);
  const [rightCount, setRightCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [wrongPhrases, setWrongPhrases] = useState<PhraseItem[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const input = useRef<HTMLInputElement | null>(null);

  /* 队列要在句型池载入之后再定：句型来自对话语料，是异步的 */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const bank = await loadDialogues();
      if (!alive) return;
      const all: Scene[] = [...p.customScenes, ...(bank?.scenes ?? [])];
      const pool = unlockedPhrases(all, p.scenes);
      setQueue(buildReviewQueue(p.mastery, pool, p.phrases ?? {}, dayNo()));
    })();
    return () => { alive = false; };
    // 只在进入夜巡时建一次队列 —— 之后每答一题都会改 mastery，重算会把题抽走
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const item = queue?.[i];
  const isPhrase = item?.kind === 'phrase';
  const word = item?.kind === 'word' ? item.w : '';
  const phrase = item?.kind === 'phrase' ? item.item : null;

  const entry = word ? lookup(corpus, word) : null;
  const target = word.replace(/[^a-z']/gi, '');
  // 答错时才找易混词：从「学过的词」里翻，几百个量级，逐词比编辑距离够快
  const rivals = phase === 'wrong' && word
    ? rivalsOf(target, Object.keys(p.mastery)).filter(w => w !== target)
    : [];
  const finished = !!queue && i >= queue.length;

  /* 换题时自动播一次：单词播单词，句型播整句 */
  const audio = item ? (item.kind === 'word' ? item.w : item.item.en) : '';
  useEffect(() => {
    if (!audio) return;
    const t = window.setTimeout(
      () => speak(audio, { accent: settings.voice, rate: settings.rate }),
      260
    );
    return () => window.clearTimeout(t);
  }, [i, audio, settings.voice, settings.rate]);

  const advance = () => {
    setI(v => v + 1);
    setTyped('');
    setHint(false);
    setPhase('ask');
  };

  /* ---------- 单词：键盘直接上去，不进输入框 ---------- */
  const submitWord = (val: string) => {
    const ok = val.toLowerCase() === target.toLowerCase();
    setPhase(ok ? 'right' : 'wrong');
    review(word, ok);
    if (ok) { chime(); setRightCount(c => c + 1); }
    else { errorThud(); setWrongWords(l => [...l, word]); }
    window.setTimeout(() => speak(word, { accent: settings.voice, rate: settings.rate }), 320);
    timer.current = window.setTimeout(advance, ok ? 900 : 1900);
  };

  useEffect(() => {
    if (finished || isPhrase) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { go('map'); return; }
      if (phase !== 'ask') return;
      if (ev.key === 'Backspace') { ev.preventDefault(); setTyped(v => v.slice(0, -1)); return; }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        speak(word, { accent: settings.voice, rate: settings.rate });
        return;
      }
      if (ev.repeat || ev.key.length !== 1) return;
      if (!/[a-zA-Z' -]/.test(ev.key)) return;
      ev.preventDefault();
      keyClick();
      const next = typed + ev.key;
      setTyped(next);
      if (next.length >= target.length) submitWord(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, phase, finished, target, isPhrase, word]);

  /* ---------- 句型：一句一提交，走输入框 ---------- */
  const submitPhrase = () => {
    if (!phrase) return;
    if (phase !== 'ask') { advance(); return; }
    const d = diff(phrase.en, typed);
    reviewPhrase(phrase.en, d.ok);
    if (d.ok) {
      chime();
      setRightCount(c => c + 1);
      setPhase('right');
      speak(phrase.en, { accent: settings.voice, rate: settings.rate });
      timer.current = window.setTimeout(advance, 1100);
    } else {
      errorThud();
      setWrongPhrases(l => [...l, phrase]);
      setPhase('wrong');
    }
  };

  useEffect(() => {
    if (isPhrase && phase === 'ask') input.current?.focus();
  }, [i, isPhrase, phase]);

  /* 句型判错后输入框已经不在了，回车要能从复盘页回到队列 —— 
     单词那条全局键盘监听在句型上是关掉的（键盘要留给输入框） */
  useEffect(() => {
    if (!isPhrase || finished) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { go('map'); return; }
      // !ev.defaultPrevented：输入框那次回车已经被 submitPhrase 处理过，
      // 同一个事件会继续冒泡到 window，不挡掉就会「判错 + 直接翻页」一次干完
      if (ev.key === 'Enter' && !ev.defaultPrevented && phase !== 'ask') {
        ev.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPhrase, phase, finished]);

  const again = () => {
    const st = useGame.getState().p;
    void (async () => {
      const bank = await loadDialogues();
      const all: Scene[] = [...st.customScenes, ...(bank?.scenes ?? [])];
      const pool = unlockedPhrases(all, st.scenes);
      setQueue(buildReviewQueue(st.mastery, pool, st.phrases ?? {}, dayNo()));
      setRound(r => r + 1);
      setI(0);
      setTyped('');
      setHint(false);
      setPhase('ask');
      setRightCount(0);
      setWrongWords([]);
      setWrongPhrases([]);
    })();
  };

  /* ---------- 队列还没建好 ---------- */
  if (!queue) {
    return (
      <div className="review">
        <div className="rv-top">
          <button className="icon-btn" onClick={() => go('map')} aria-label="退出夜巡">✕</button>
          <span>夜巡</span>
        </div>
      </div>
    );
  }

  /* ---------- 空状态 ---------- */
  if (!queue.length) {
    return (
      <div className="review">
        <div className="rv-top">
          <button className="icon-btn" onClick={() => go('map')} aria-label="退出夜巡">✕</button>
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
    const wrongTotal = wrongWords.length + wrongPhrases.length;
    return (
      <div className="review">
        <div className="rv-top">
          <button className="icon-btn" onClick={() => go('map')} aria-label="退出夜巡">✕</button>
          <span>夜巡 · 第 {round + 1} 轮结束</span>
        </div>
        <div className="rv-body">
          <div className="rv-card" style={{ minHeight: 0 }}>
            <div className="rv-done-title">{rightCount} / {queue.length} 拼对了</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-2)', textAlign: 'center', lineHeight: 1.7 }}>
              {wrongTotal === 0
                ? '全对。这批词下次见面会更牢。'
                : `${wrongTotal} 条已经排回队首，明天再听一次。`}
            </div>
            {wrongWords.length > 0 && (
              <div className="chips" style={{ justifyContent: 'center' }}>
                {wrongWords.map(w => (
                  <span key={w} className="chip" onClick={() => speak(w, { accent: settings.voice, rate: settings.rate })}>
                    {w} <span className="sp">🔊</span>
                  </span>
                ))}
              </div>
            )}
            {wrongPhrases.length > 0 && (
              <div className="rv-wrong-say">
                {wrongPhrases.map(ph => (
                  <div key={ph.en} className="rv-wrong-item" onClick={() => speak(ph.en, { accent: settings.voice, rate: settings.rate })}>
                    <b>{ph.en}</b>
                    <span>{ph.zh}</span>
                  </div>
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
        <button className="icon-btn" onClick={() => go('map')} aria-label="退出夜巡">✕</button>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{i + 1} / {queue.length}</span>
        <span style={{ opacity: 0.7 }}>{isPhrase ? '句型' : '听写'}</span>
        <div className="dots">
          {queue.map((_, k) => (
            <i key={k} className={k < i ? ' on' : ''} />
          ))}
        </div>
      </div>

      <div className="rv-body">
        <div className="rv-card">
          {isPhrase && phrase ? (
            <>
              <div className="rv-mode">
                {phase === 'right' ? '就是这句' : phase === 'wrong' ? '原句' : `看中文，把整句打出来 · ${phrase.sceneName}`}
              </div>

              {phase === 'wrong' ? (
                <div className="rv-say-fix">
                  {phrase.en.split('').map((ch, k) => {
                    const t = typed[k];
                    const cls = t === undefined ? 'miss' : t === ch ? 'on' : 'err';
                    return <span key={k} className={cls}>{ch}</span>;
                  })}
                </div>
              ) : (
                <>
                  <div className="rv-zh">{phrase.zh}</div>
                  <div className="rv-mask">
                    {hint ? (
                      <div className="rv-mask-hint">{initials(phrase.en)}</div>
                    ) : (
                      <div className="rv-mask-words">
                        {maskWords(phrase.en).map((m, k) => (
                          <span key={k} style={{ width: `${m.length}ch` }} />
                        ))}
                      </div>
                    )}
                    {!hint && phase === 'ask' && (
                      <button className="rv-speak" onClick={() => setHint(true)}>看首字母</button>
                    )}
                  </div>
                </>
              )}

              {phase !== 'wrong' && (
                <input
                  ref={input}
                  className={`rv-say-input${phase === 'right' ? ' ok' : ''}`}
                  value={typed}
                  readOnly={phase !== 'ask'}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  placeholder={phase === 'right' ? '' : '打出整句，回车确认'}
                  onChange={e => { if (phase === 'ask') setTyped(e.target.value); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); submitPhrase(); }
                  }}
                />
              )}

              {phase === 'wrong' && (
                <>
                  <div className="rv-hint">你打的：{typed || '（空）'}</div>
                  {phrase.tip && <div className="rv-hint">{phrase.tip}</div>}
                </>
              )}
              {phase === 'right' && <div className="rv-hint">{phrase.en}</div>}
            </>
          ) : (
            <>
              <div className="rv-mode">
                {phase === 'right' ? '拼对了' : phase === 'wrong' ? '正确拼写' : '听发音，写出这个词'}
              </div>

              {phase === 'wrong' ? (
                <>
                  <div className="rv-answer">{target}</div>
                  {rivals.length > 0 && (
                    <div className="rv-rival">
                      易混：{rivals.join(' / ')} —— 看清再打
                    </div>
                  )}
                </>
              ) : (
                <button
                  className="rv-play"
                  onClick={() => speak(word, { accent: settings.voice, rate: settings.rate })}
                  title="再听一次（Enter）"
                >
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
            </>
          )}
        </div>
      </div>

      <div className="rv-foot">
        {isPhrase
          ? phase === 'ask' ? 'Enter 再听一遍 · 打完整句回车确认' : phase === 'right' ? '记住这句' : '回车继续'
          : phase === 'ask' ? 'Enter 重听 · 想不起来就点「看提示」' : phase === 'right' ? '记住它' : '再听一次，然后继续'}
      </div>
    </div>
  );
}
