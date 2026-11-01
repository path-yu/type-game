import { useEffect, useRef, useState } from 'react';
import { diff, initials, maskOf } from '../../lib/dialogue';
import type { PhraseItem } from '../../lib/phrases';
import { useGame } from '../../lib/store';
import { speak } from '../../lib/speech';
import { StepBar } from './shared';

/**
 * 句型复习：看中文，把整句话打出来。
 *
 * 和背打同一套交互（打字是最容易量化的产出方式），但对象换成了「句型」：
 * 这里不考单词，考的是"这句话整块怎么说"。
 */
export function PhraseDrill({
  items,
  accent,
  rate,
  onExit,
}: {
  items: PhraseItem[];
  accent: 'us' | 'uk';
  rate: number;
  onExit: () => void;
}) {
  const reviewPhrase = useGame(s => s.reviewPhrase);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'ask' | 'ok' | 'bad'>('ask');
  const [hint, setHint] = useState(false);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);

  const rightRef = useRef(0);
  const input = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!done) input.current?.focus();
  }, [i, done]);

  const item = items[i];

  const next = () => {
    if (i + 1 >= items.length) { setDone(true); return; }
    setI(i + 1);
    setTyped('');
    setPhase('ask');
    setHint(false);
  };

  const submit = () => {
    if (phase !== 'ask') { next(); return; }
    const d = diff(item.en, typed);
    reviewPhrase(item.en, d.ok);
    if (d.ok) {
      rightRef.current += 1;
      setRight(rightRef.current);
      setPhase('ok');
      speak(item.en, { accent, rate });
      setTimeout(next, 900);
    } else {
      setPhase('bad');
    }
  };

  if (!items.length) {
    return (
      <div className="dg dg-scene">
        <div className="page-head">
          <div>
            <h1 className="page-title">句型复习</h1>
            <div className="page-sub">还没有可复习的句型 —— 先练完一场对话</div>
          </div>
          <button className="btn btn-ghost" onClick={onExit}>返回</button>
        </div>
      </div>
    );
  }

  if (done) {
    const score = Math.round((right / items.length) * 100);
    return (
      <div className="dg dg-scene">
        <div className="dg-sum">
          <div className="dg-sum-score">{score}<em>%</em></div>
          <div className="dg-sum-line">
            {items.length} 句里说对 {right} 句
            {right === items.length ? '，都记住了' : '，说错的明天还会再来'}
          </div>
          <div className="dg-sum-acts">
            <button className="btn btn-ghost" onClick={onExit}>回到对话</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                rightRef.current = 0;
                setRight(0);
                setDone(false);
                setI(0);
                setTyped('');
                setPhase('ask');
                setHint(false);
              }}
            >
              再练一遍
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chars = item.en.split('');

  return (
    <div className="dg dg-scene">
      <div className="dg-drill">
        <StepBar i={i} total={items.length} />

        <div className="dg-ctx">
          <span>句型 · {item.sceneName}</span>
        </div>

        <div className="dg-main">
          <div className="dg-prompt-zh">{item.zh}</div>
          <div className={`dg-mask${hint ? ' hinted' : ''}`}>
            {hint ? initials(item.en) : maskOf(item.en)}
            {!hint && phase === 'ask' && (
              <button className="dg-hint-btn" onClick={() => setHint(true)}>看首字母</button>
            )}
          </div>
          <input
            ref={input}
            className={`dg-input${phase === 'ok' ? ' ok' : phase === 'bad' ? ' bad' : ''}`}
            value={typed}
            readOnly={phase !== 'ask'}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder={phase === 'bad' ? '' : '把这句话打出来，回车确认'}
            onChange={e => { if (phase === 'ask') setTyped(e.target.value); }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        {phase === 'ok' && <div className="dg-fb ok">✓ 就是这句</div>}
        {phase === 'bad' && (
          <div className="dg-fb bad">
            <div className="dg-fb-line">
              {chars.map((ch, k) => {
                const t = typed[k];
                const cls = t === undefined ? 'miss' : t === ch ? 'on' : 'err';
                return <span key={k} className={cls}>{ch}</span>;
              })}
            </div>
            {item.tip && <div className="dg-fb-tip">{item.tip}</div>}
            <div className="dg-fb-tip">回车继续</div>
          </div>
        )}

        <div className="dg-drill-foot">
          <button className="dg-link" onClick={() => speak(item.en, { accent, rate })}>听一遍</button>
          <button className="dg-link" onClick={onExit}>退出</button>
          <span className="dg-drill-hint">来自「{item.sceneName}」</span>
        </div>
      </div>
    </div>
  );
}
