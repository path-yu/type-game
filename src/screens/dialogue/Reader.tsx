import { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../../lib/speech';
import type { Scene } from '../../lib/dialogue';

export function Reader({ scene, accent, rate }: { scene: Scene; accent: 'us' | 'uk'; rate: number }) {
  const [at, setAt] = useState(-1);
  const stop = useRef(false);

  useEffect(() => () => { stop.current = true; }, []);

  const say = (en: string) => {
    stop.current = true;   // 手动点一句就打断连播
    setAt(-1);
    speak(en, { accent, rate });
  };

  const playAll = () => {
    if (at >= 0) { stop.current = true; setAt(-1); stopSpeaking(); return; }
    stop.current = false;
    const step = (i: number) => {
      if (stop.current || i >= scene.lines.length) { setAt(-1); return; }
      setAt(i);
      speak(scene.lines[i].en, {
        accent,
        rate,
        onEnd: () => { if (!stop.current) step(i + 1); },
      });
    };
    step(0);
  };

  return (
    <>
      <div className="dg-toolrow">
        <button className="btn btn-ghost" onClick={playAll}>
          {at >= 0 ? '■ 停止' : `▶ 连播全篇（${scene.lines.length} 句）`}
        </button>
        <span className="dg-toolhint">点任意一句可以单独听</span>
      </div>

      <div className="dg-thread">
        {scene.lines.map((l, i) => (
          <div
            key={i}
            className={`dg-bub${l.r === scene.you ? ' me' : ''}${at === i ? ' speaking' : ''}`}
            onClick={() => say(l.en)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); say(l.en); } }}
          >
            <div className="dg-who">{scene.roles[l.r]}</div>
            <div className="dg-en">{l.en}</div>
            <div className="dg-zh">{l.zh}</div>
            {l.note && <div className="dg-note">{l.note}</div>}
          </div>
        ))}
      </div>

      {scene.phrases.length > 0 && (
        <div className="dg-phrases">
          <div className="dg-phrases-title">带走这几句</div>
          {scene.phrases.map((ph, i) => (
            <div key={i} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
              <div className="dg-phrase-en">{ph.en}</div>
              <div className="dg-phrase-zh">{ph.zh}</div>
              {ph.tip && <div className="dg-tip">{ph.tip}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
