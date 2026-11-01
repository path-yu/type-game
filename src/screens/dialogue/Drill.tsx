import { useEffect, useMemo, useRef, useState } from 'react';
import { speak } from '../../lib/speech';
import { diff, errorWords, initials, linesOf, maskOf, type Role } from '../../lib/dialogue';
import { StepBar, type Mode, type PracticeProps } from './shared';

type Props = PracticeProps & {
  mode: Exclude<Mode, 'read' | 'speak' | 'live'>;
  role: Role;
  onExit: () => void;
};

export function Drill({ scene, mode, accent, rate, known, role, onExit, onFinish }: Props) {
  const mine = useMemo(() => linesOf(scene, role), [scene, role]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [hint, setHint] = useState(false);
  const [failed, setFailed] = useState<{ w: string; ok: boolean }[]>([]);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);

  const input = useRef<HTMLInputElement | null>(null);
  const saved = useRef(false);
  // 计数器另存一份 ref：setTimeout 里读 state 拿到的是旧值，最后一句会少算一分
  const rightRef = useRef(0);
  const failRef = useRef<{ w: string; ok: boolean }[]>([]);

  const line = mine[i];
  const at = line ? scene.lines.indexOf(line) : 0;
  const ctxBefore = at > 0 ? scene.lines[at - 1] : undefined;

  useEffect(() => {
    if (!finished) input.current?.focus();
  }, [i, finished]);

  const mark = (words: string[]) => {
    const usable = words.filter(known);
    if (!usable.length) return;
    failRef.current = [...failRef.current, ...usable.map(w => ({ w, ok: false }))];
    setFailed(failRef.current);
  };

  const finish = () => {
    setFinished(true);
    if (saved.current) return;
    saved.current = true;
    onFinish((rightRef.current / mine.length) * 100, failRef.current);
  };

  const next = () => {
    if (i + 1 >= mine.length) { finish(); return; }
    setI(i + 1);
    setTyped('');
    setStatus('idle');
    setHint(false);
  };

  const submit = () => {
    if (finished) return;
    if (status !== 'idle') { next(); return; }
    const d = diff(line.en, typed);
    if (d.ok) {
      rightRef.current += 1;
      setRight(rightRef.current);
      setStatus('ok');
      speak(line.en, { accent, rate });
      setTimeout(next, 900);
    } else {
      mark(errorWords(line.en, d.wrong));
      setStatus('bad');
    }
  };

  /** 直接看答案＝这句放弃了：按错记，顺手记下前三个内容词 */
  const reveal = () => {
    const all = errorWords(line.en, line.en.split('').map((_, k) => k));
    mark(all.slice(0, 3));
    setTyped('');
    setStatus('bad');
  };

  /* ---------------- 结算 ---------------- */
  if (finished) {
    const score = Math.round((right / mine.length) * 100);
    const words = [...new Set(failed.map(f => f.w))];
    return (
      <div className="dg-sum">
        <div className="dg-sum-score">{score}<em>%</em></div>
        <div className="dg-sum-line">
          {mine.length} 句里打对 {right} 句
          {words.length > 0 ? `，${words.length} 个词记下了，今晚夜巡会考你` : '，一个词都没错'}
        </div>

        {scene.phrases.length > 0 && (
          <div className="dg-phrases">
            <div className="dg-phrases-title">这场能带走的句子</div>
            {scene.phrases.map((ph, k) => (
              <div key={k} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
                <div className="dg-phrase-en">{ph.en}</div>
                <div className="dg-phrase-zh">{ph.zh}</div>
              </div>
            ))}
          </div>
        )}

        <div className="dg-sum-acts">
          <button className="btn btn-ghost" onClick={onExit}>回到场景列表</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              saved.current = false;
              rightRef.current = 0;
              failRef.current = [];
              setFinished(false);
              setI(0); setTyped(''); setStatus('idle'); setRight(0); setFailed([]); setHint(false);
            }}
          >
            再来一遍
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 答题 ---------------- */
  const chars = line.en.split('');
  const shown = mode === 'copy';

  return (
    <div className="dg-drill">
      <StepBar i={i} total={mine.length} />

      {ctxBefore && (
        <div className="dg-ctx">
          <span>{scene.roles[ctxBefore.r]}</span>
          {ctxBefore.en}
        </div>
      )}

      <div className="dg-main">
      <div className="dg-prompt">
        <div className={`dg-prompt-zh${shown ? ' sub' : ''}`}>{line.zh}</div>
      </div>

      {shown ? (
        <div className="dg-target">
          {chars.map((ch, k) => {
            const t = typed[k];
            const cls = t === undefined ? '' : t === ch ? 'on' : 'bad';
            return <span key={k} className={`dg-ch ${cls}`}>{ch}</span>;
          })}
        </div>
      ) : (
        <div className={`dg-mask${hint ? ' hinted' : ''}`}>
          {hint ? initials(line.en) : maskOf(line.en)}
          {!hint && status === 'idle' && (
            <button className="dg-hint-btn" onClick={() => setHint(true)}>看首字母</button>
          )}
        </div>
      )}

      <input
        ref={input}
        className={`dg-input${status === 'ok' ? ' ok' : status === 'bad' ? ' bad' : ''}`}
        value={typed}
        // 不能用 disabled：失去焦点的 input 收不到回车，答错后就没法「回车继续」了
        readOnly={status !== 'idle'}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder={status === 'bad' ? '' : '打出这句话，回车确认'}
        onChange={e => { if (status === 'idle') setTyped(e.target.value); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
        }}
      />

      {status === 'ok' && <div className="dg-fb ok">✓ 就是这句</div>}
      {status === 'bad' && (
        <div className="dg-fb bad">
          <div className="dg-fb-line">
            {chars.map((ch, k) => {
              const t = typed[k];
              const cls = t === undefined ? 'miss' : t === ch ? 'on' : 'err';
              return <span key={k} className={cls}>{ch}</span>;
            })}
          </div>
          <div className="dg-fb-tip">回车继续</div>
        </div>
      )}

      </div>

      <div className="dg-drill-foot">
        <button className="dg-link" onClick={() => speak(line.en, { accent, rate })}>听一遍</button>
        {mode === 'recall' && status === 'idle' && (
          <button className="dg-link" onClick={reveal}>看答案</button>
        )}
        <span className="dg-drill-hint">这句是{scene.roles[line.r]}要说的</span>
      </div>
    </div>
  );
}
