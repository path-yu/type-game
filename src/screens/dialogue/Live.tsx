import { useEffect, useMemo, useRef, useState } from 'react';
import { speak } from '../../lib/speech';
import {
  diff, errorWords, initials, maskOf, scoreSay, timelineOf, typedSteps,
} from '../../lib/dialogue';
import { StepBar, type PracticeProps } from './shared';

type Props = PracticeProps & { onExit: () => void };

export function Live({ scene, accent, rate, known, onExit, onFinish }: Props) {
  const steps = useMemo(() => timelineOf(scene), [scene]);
  const total = useMemo(() => typedSteps(scene), [scene]);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'ok' | 'bad' | 'react'>('ask');
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [credited, setCredited] = useState(false);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);

  const rightRef = useRef(0);
  const failRef = useRef<{ w: string; ok: boolean }[]>([]);
  const saved = useRef(false);
  const input = useRef<HTMLInputElement | null>(null);

  const step = steps[i];

  useEffect(() => {
    if (phase === 'ask' && step && (step.kind === 'branch' || step.line.r === scene.you)) {
      input.current?.focus();
    }
  }, [i, phase, step, scene.you]);

  const mark = (words: string[]) => {
    const usable = words.filter(known);
    if (!usable.length) return;
    failRef.current = [...failRef.current, ...usable.map(w => ({ w, ok: false }))];
  };

  const finish = () => {
    setFinished(true);
    if (saved.current) return;
    saved.current = true;
    onFinish((rightRef.current / total) * 100, failRef.current);
  };

  const next = () => {
    if (i + 1 >= steps.length) { finish(); return; }
    setI(i + 1);
    setPhase('ask');
    setTyped('');
    setHint(false);
    setPick(null);
    setCredited(false);
  };

  const submitLine = (en: string) => {
    const d = diff(en, typed);
    if (d.ok) {
      rightRef.current += 1;
      setRight(rightRef.current);
      setPhase('ok');
      speak(en, { accent, rate });
      setTimeout(next, 900);
    } else {
      mark(errorWords(en, d.wrong));
      setPhase('bad');
    }
  };

  const submitBranch = (line: { options: { say: { en: string } }[] }) => {
    // 两条路都算一遍，取更像的那条；0.7 以上才认
    const scored = line.options.map(o => scoreSay(o.say.en, typed).ratio);
    const best = Math.max(...scored);
    if (best >= 0.7) {
      rightRef.current += 1;
      setRight(rightRef.current);
      setPick(scored.indexOf(best));
      setCredited(true);
      setPhase('react');
    } else {
      setCredited(false);
      const at = steps[i];
      if (at?.kind === 'branch') {
        // 打错的地方按「离你最近的那个选项」记词，不惩罚你没学过另一种说法
        const near = line.options[scored.indexOf(best)].say.en;
        mark(errorWords(near, diff(near, typed).wrong));
      }
      setPhase('bad');
    }
  };

  const chooseOption = (k: number) => {
    setPick(k);
    setPhase('react');
  };

  if (finished) {
    const score = Math.round((right / total) * 100);
    return (
      <div className="dg-sum">
        <div className="dg-sum-score">{score}<em>%</em></div>
        <div className="dg-sum-line">
          {total} 处开口，接住 {right} 处
          {right === total
            ? '，一处都没掉'
            : failRef.current.length > 0 ? `，${failRef.current.length} 个词今晚夜巡会考你` : ''}
        </div>
        <div className="dg-phrases">
          <div className="dg-phrases-title">这场最该带走的一句</div>
          {scene.branch && (
            <div className="dg-phrase">
              <div className="dg-phrase-en">{scene.branch.options[0].say.en}</div>
              <div className="dg-phrase-zh">{scene.branch.options[1].say.en}</div>
            </div>
          )}
          {scene.phrases.slice(0, 2).map((ph, k) => (
            <div key={k} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
              <div className="dg-phrase-en">{ph.en}</div>
              <div className="dg-phrase-zh">{ph.zh}</div>
            </div>
          ))}
        </div>
        <div className="dg-sum-acts">
          <button className="btn btn-ghost" onClick={onExit}>回到场景列表</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              saved.current = false;
              rightRef.current = 0;
              failRef.current = [];
              setFinished(false);
              setI(0); setPhase('ask'); setTyped(''); setRight(0); setPick(null); setHint(false); setCredited(false);
            }}
          >
            再走一遍
          </button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  /* —— 对方说话：只能听 —— */
  if (step.kind === 'line' && step.line.r !== scene.you) {
    return (
      <div className="dg-drill">
        <StepBar i={i} total={steps.length} />
        <div className="dg-main">
          <div className="dg-listen">
            <div className="dg-speak-who">{scene.roles[step.line.r]}说</div>
            <div className="dg-listen-en" onClick={() => speak(step.line.en, { accent, rate })}>
              {step.line.en}
            </div>
            <div className="dg-branch-zh">{step.line.zh}</div>
            {step.line.note && <div className="dg-listen-note">{step.line.note}</div>}
          </div>
        </div>
        <div className="dg-drill-foot">
          <button className="dg-link" onClick={() => speak(step.line.en, { accent, rate })}>听一遍</button>
          <button className="btn btn-primary dg-go" autoFocus onClick={next}>继续</button>
        </div>
      </div>
    );
  }

  /* —— 该你说话 —— */
  if (step.kind === 'line') {
    const en = step.line.en;
    const chars = en.split('');
    return (
      <div className="dg-drill">
        <StepBar i={i} total={steps.length} />
        <div className="dg-main">
          <div className="dg-prompt-zh">{step.line.zh}</div>
          <div className={`dg-mask${hint ? ' hinted' : ''}`}>
            {hint ? initials(en) : maskOf(en)}
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
            placeholder={phase === 'bad' ? '' : '该你说了，回车确认'}
            onChange={e => { if (phase === 'ask') setTyped(e.target.value); }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (phase === 'ask') submitLine(en);
                else next();
              }
            }}
          />
        </div>
        {phase === 'ok' && <div className="dg-fb ok">✓ 接上了</div>}
        {phase === 'bad' && (
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
        <div className="dg-drill-foot">
          <button className="dg-link" onClick={() => speak(en, { accent, rate })}>听一遍</button>
          <span className="dg-drill-hint">这句是{scene.roles[step.line.r]}要说的</span>
        </div>
      </div>
    );
  }

  /* —— 岔路 —— */
  const b = step.branch;
  const chosen = pick != null ? b.options[pick] : null;

  if (phase === 'react' && chosen) {
    return (
      <div className="dg-drill">
        <StepBar i={i} total={steps.length} />
        <div className="dg-branch">
          <div className={`dg-branch-tag${credited ? ' up' : ''}`}>
            {credited ? '岔路 · 你接住了' : '岔路 · 换成参考说法继续'}
          </div>
          {credited
            ? <div className="dg-branch-said">你说：{chosen.say.en}</div>
            : (
              <>
                {typed.trim() && <div className="dg-branch-said">你打了：{typed}</div>}
                <div className="dg-branch-said">参考说法：{chosen.say.en} · {chosen.say.zh}</div>
              </>
            )}
          <div className="dg-branch-who">{scene.roles[1 - scene.you]}说</div>
          <div className="dg-listen-en" onClick={() => speak(chosen.react.en, { accent, rate })}>
            {chosen.react.en}
          </div>
          <div className="dg-branch-zh">{chosen.react.zh}</div>
        </div>
        <div className="dg-sum-acts">
          <button className="btn btn-primary" autoFocus onClick={next}>继续</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dg-drill">
      <StepBar i={i} total={steps.length} />
      <div className="dg-branch">
        <div className="dg-branch-tag">岔路 · 对方没按剧本来</div>
        <div className="dg-branch-who">{scene.roles[1 - scene.you]}说</div>
        <div className="dg-listen-en" onClick={() => speak(b.prompt.en, { accent, rate })}>
          {b.prompt.en}
        </div>
        <div className="dg-branch-zh">{b.prompt.zh}</div>
        {b.prompt.note && <div className="dg-listen-note">{b.prompt.note}</div>}
        <div className="dg-branch-task">你的目标 · {b.task}</div>

        <input
          ref={input}
          className={`dg-input${phase === 'bad' ? ' bad' : ''}`}
          value={typed}
          readOnly={phase !== 'ask'}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          placeholder={phase === 'bad' ? '' : '用一句英语接上去，回车确认'}
          onChange={e => { if (phase === 'ask') setTyped(e.target.value); }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (phase === 'ask') submitBranch(b);
            }
          }}
        />

        {phase === 'bad' && (
          <>
            <div className="dg-options-title">两种常见应对，挑你要的那句</div>
            <div className="dg-options">
              {b.options.map((o, k) => (
                <button key={k} className="dg-option" onClick={() => chooseOption(k)}>
                  <b>{o.say.en}</b>
                  <span>{o.say.zh}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="dg-drill-foot">
        <button className="dg-link" onClick={() => speak(b.prompt.en, { accent, rate })}>再听一遍</button>
        {phase === 'ask' && (
          <button className="dg-link" onClick={() => setPhase('bad')}>想不出来</button>
        )}
        <span className="dg-drill-hint">这句没人教过你，凭目标自己接</span>
      </div>
    </div>
  );
}
