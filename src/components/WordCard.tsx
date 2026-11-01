import { useEffect, useRef, useState } from 'react';
import type { WordEntry } from '../lib/types';
import { speak } from '../lib/speech';
import { useGame } from '../lib/store';

const TAG_LABEL: Record<string, string> = {
  zk: '中考', gk: '高考', cet4: 'CET4', cet6: 'CET6',
  ky: '考研', ielts: '雅思', toefl: '托福', gre: 'GRE',
};

const SPEEDS = [0.5, 0.75, 1, 1.25];
const fmt = (v: number) => (v === 1 ? '1×' : `${v}×`);

interface Props {
  word: string;
  surface?: string;
  entry: WordEntry | null;
  anchor: { x: number; y: number; w: number; b: number } | null;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function WordCard({ word, surface, entry, anchor, saved, onClose, onSave }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const settings = useGame(s => s.s);
  const setSetting = useGame(s => s.setSetting);
  const [speedOpen, setSpeedOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (speedOpen) setSpeedOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, speedOpen]);

  useEffect(() => {
    if (!speedOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.speed-wrap')) setSpeedOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [speedOpen]);

  /**
   * 点外部关闭。
   * 用 pointerdown + 捕获阶段：比 click 更早，可以在打字区接管之前就收掉卡片。
   * 但落点在另一个词上时不管 —— 那种情况应该「换词」而不是「先关再开」，
   * 否则引擎会 resume 一次又立刻 pause，计时器白抖一下。
   */
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (ref.current?.contains(t)) return;
      if (t.closest('.w')) return;
      onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    let left = anchor.x + anchor.w / 2 - w / 2;
    left = Math.max(14, Math.min(left, window.innerWidth - w - 14));
    let top = anchor.b + 12;
    if (top + h > window.innerHeight - 14) top = anchor.y - h - 12;
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(68, top)}px`;
  }, [anchor, word]);

  const play = () => speak(word, { accent: settings.voice, rate: settings.rate });
  const tags = (entry?.g || []).map(t => TAG_LABEL[t]).filter(Boolean).slice(0, 3);
  const stars = entry?.c ? '★'.repeat(entry.c) + '☆'.repeat(Math.max(0, 5 - entry.c)) : '';

  return (
    <div className="card" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="hd">
        <div>
          <div className="hw">{surface || word}</div>
          <div className="ipa">
            {entry?.p ? `/${entry.p}/` : '—'}
            {surface && surface.toLowerCase() !== word.toLowerCase() && (
              <span className="lemma">原形 {word}</span>
            )}
          </div>
        </div>
        <div className="spk">
          <button title="朗读" onClick={play}>🔊</button>
          <div className="speed-wrap">
            <button
              className={`speed${speedOpen ? ' on' : ''}`}
              title="发音速度"
              onClick={() => setSpeedOpen(v => !v)}
            >
              {fmt(settings.rate)}
            </button>
            {speedOpen && (
              <div className="speed-menu">
                <div className="speed-title">发音速度</div>
                {SPEEDS.map(v => (
                  <button
                    key={v}
                    className={`speed-item${settings.rate === v ? ' on' : ''}`}
                    onClick={() => { setSetting('rate', v); setSpeedOpen(false); speak(word, { accent: settings.voice, rate: v }); }}
                  >
                    <span>{fmt(v)}</span>
                    {v === 1 && <em>正常</em>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="zh">{entry?.z || '词库中暂未收录这个词 · 可手动收藏'}</div>
      {entry?.e && <div className="en">{entry.e}</div>}

      {(entry?.t || tags.length > 0) && (
        <>
          <hr />
          <div className="meta">
            {entry?.t ? (
              <div>
                <span>频段</span>
                <em>Tier {entry.t}{stars ? ` · 柯林斯 ${stars}` : ''}</em>
              </div>
            ) : null}
            {tags.length > 0 && (
              <div>
                <span>标签</span>
                <em>{tags.join(' · ')}</em>
              </div>
            )}
          </div>
        </>
      )}

      <div className="ft">
        <button onClick={onClose}>关闭</button>
        <button className={`pri${saved ? ' saved' : ''}`} onClick={onSave}>
          {saved ? '✓ 已收藏' : '收藏到藏书阁'}
        </button>
      </div>
      <div className="pausetag">查词时计时已暂停</div>
    </div>
  );
}
