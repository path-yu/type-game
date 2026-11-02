import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import type { TypingEngine } from '../engine/TypingEngine';

interface Props {
  engine: TypingEngine;
  ghost: number;
  onWordClick: (el: HTMLElement, key: string, raw: string) => void;
  onWordHover: (el: HTMLElement | null, key: string) => void;
}

export interface StageHandle {
  sync: () => void;
  ghost: (index: number) => void;
}

const LH = 60;

export const TextStage = forwardRef<StageHandle, Props>(function TextStage(
  { engine, ghost, onWordClick, onWordHover },
  ref
) {
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const prevIdx = useRef(0);

  const isSpace = useMemo(() => engine.chars.map(c => /\s/.test(c)), [engine]);

  const nodes = useMemo(() => {
    const out: React.ReactNode[] = [];
    const chars = engine.chars;
    const words = engine.words;
    let i = 0;
    let wi = 0;

    const chSpan = (idx: number) => (
      <span
        key={`c${idx}`}
        className={`ch${isSpace[idx] ? ' sp' : ''}`}
        ref={(el) => { els.current[idx] = el; }}
      >
        {chars[idx]}
      </span>
    );

    while (i < chars.length) {
      const w = words[wi];
      if (w && i === w.start) {
        // 标点跟着前面的词走。`.w` 是 nowrap，标点单独成 span 的话，
        // 行尾放不下会在空格处断行，句号就被挤到下一行行首（" . You do not..."）。
        let end = w.end;
        while (end < chars.length && !isSpace[end] && !/[A-Za-z0-9]/.test(chars[end])) end++;
        const kids: React.ReactNode[] = [];
        for (let c = w.start; c < end; c++) kids.push(chSpan(c));
        out.push(
          <span key={`w${w.start}`} className="w" data-key={w.key} data-word={w.raw}>
            {kids}
          </span>
        );
        i = end;
        wi++;
      } else {
        out.push(chSpan(i));
        i++;
      }
    }
    return out;
  }, [engine, isSpace]);

  const sync = () => {
    const e = engine;
    const a = Math.min(prevIdx.current, e.idx);
    const b = Math.max(prevIdx.current, e.idx);
    for (let i = Math.max(0, a - 1); i <= Math.min(e.chars.length - 1, b + 1); i++) {
      const el = els.current[i];
      if (!el) continue;
      const st = e.states[i];
      if (st === 1) {
        el.classList.add('done');
        el.classList.remove('err');
      } else if (st === 2) {
        if (!el.classList.contains('err')) {
          el.classList.add('err', 'shake');
          window.setTimeout(() => el.classList.remove('shake'), 190);
        }
      } else {
        el.classList.remove('done', 'err');
      }
    }
    prevIdx.current = e.idx;

    const caret = caretRef.current;
    const inner = innerRef.current;
    if (!caret || !inner) return;
    const at = Math.min(e.idx, e.chars.length - 1);
    const t = els.current[at];
    if (!t) return;
    const x = e.idx >= e.chars.length ? t.offsetLeft + t.offsetWidth : t.offsetLeft;
    const y = t.offsetTop;
    caret.style.transform = `translate3d(${x}px, ${y + 13}px, 0)`;
    const vline = Math.round(y / LH);
    inner.style.transform = `translateY(${-Math.max(0, vline - 1) * LH}px)`;
  };

  const ghostAt = (index: number) => {
    const g = ghostRef.current;
    if (!g) return;
    if (index < 0) { g.style.opacity = '0'; return; }
    const gt = els.current[Math.min(index, engine.chars.length - 1)];
    if (!gt) return;
    g.style.opacity = '1';
    g.style.transform = `translate3d(${gt.offsetLeft}px, ${gt.offsetTop + 15}px, 0)`;
  };

  useImperativeHandle(ref, () => ({ sync, ghost: ghostAt }));

  useLayoutEffect(() => {
    prevIdx.current = 0;
    sync();
    ghostAt(ghost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    const onResize = () => { prevIdx.current = -1; sync(); prevIdx.current = engine.idx; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const handleOver = (ev: React.MouseEvent) => {
    const el = (ev.target as HTMLElement).closest('.w') as HTMLElement | null;
    if (!el) { onWordHover(null, ''); return; }
    onWordHover(el, el.dataset.key || '');
  };

  const handleClick = (ev: React.MouseEvent) => {
    const el = (ev.target as HTMLElement).closest('.w') as HTMLElement | null;
    if (el) onWordClick(el, el.dataset.key || '', el.dataset.word || '');
  };

  return (
    <div className="stage">
      <div
        className="inner"
        ref={innerRef}
        onMouseOver={handleOver}
        onMouseLeave={() => onWordHover(null, '')}
        onClick={handleClick}
      >
        {nodes}
        <div className="caret" ref={caretRef} />
        <div className="ghost-caret" ref={ghostRef} style={{ opacity: 0 }} />
      </div>
    </div>
  );
});
