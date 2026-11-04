import { useEffect, useRef, useState } from 'react';
import type { WordEntry } from '../lib/types';
import { speak } from '../lib/speech';
import { dayNo, useGame } from '../lib/store';
import { memoryLabel } from '../lib/fsrs';
import { syncRoute } from '../lib/route';
import { splitEmphasis } from '../lib/rich';

/*
 * 精讲单独一份（84KB），第一次点词时才取，取过常驻。
 * 阅读器本来只用 dict.json 那份老词库，不该为了看一眼精讲
 * 去拉 26 个字母分片（最大 3.4MB）。
 */
interface Cur {
  note?: string;
  ex?: { en: string; zh: string }[];
  see?: string[];
  /** 精讲词的正确义项顺序（老词典那条常常反着排，比如 miss 的第一条是「失误」） */
  zh?: { p: string; t: string }[];
}
let curPromise: Promise<Record<string, Cur>> | null = null;
function loadCurated(): Promise<Record<string, Cur>> {
  if (!curPromise) {
    const base = import.meta.env.BASE_URL || '/';
    curPromise = fetch(`${base}data/lex/curated.json`)
      .then(r => (r.ok ? r.json() : { words: {} }))
      .then((j: { words?: Record<string, Cur> }) => j.words ?? {})
      .catch(() => ({}));
  }
  return curPromise;
}

const TAG_LABEL: Record<string, string> = {
  zk: '中考', gk: '高考', cet4: 'CET4', cet6: 'CET6',
  ky: '考研', ielts: '雅思', toefl: '托福', gre: 'GRE',
};

const SPEEDS = [0.5, 0.75, 1, 1.25];
const fmt = (v: number) => (v === 1 ? '1×' : `${v}×`);

/** 词性缩写：卡片窄，一个字的标签就够 */
const POS_SHORT: Record<string, string> = {
  n: '名', v: '动', a: '形', r: '副',
  pron: '代', conj: '连', prep: '介', art: '冠', aux: '助', part: '不', int: '叹',
};

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
  const stat = useGame(s => s.p.mastery[word]);
  const setSetting = useGame(s => s.setSetting);
  const go = useGame(s => s.go);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [cur, setCur] = useState<Cur | null>(null);

  // 换词就换精讲；这一份取过一次就常驻，翻页时不重复请求
  useEffect(() => {
    let alive = true;
    loadCurated().then(all => { if (alive) setCur(all[word] ?? null); });
    return () => { alive = false; };
  }, [word]);

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
   *
   * 两种词节点都要认：打字页是 .w（TextStage），阅读页与全书是 .rd-w。
   * 只认 .w 的时候，读书时点相邻的词会先把自己关掉再弹一张新的，闪一下。
   */
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (ref.current?.contains(t)) return;
      if (t.closest('.w, .rd-w')) return;
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
    // cur 是异步到的，精讲一插进来卡片就变高了 —— 得重新算一次位置，否则会出屏
  }, [anchor, word, cur]);

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

      <div className="zh">
        {cur?.zh?.length ? (
          cur.zh.map((s, i) => (
            <div key={i} className="zh-row">
              <em>{POS_SHORT[s.p] ?? s.p ?? '—'}</em>
              <span>{s.t}</span>
            </div>
          ))
        ) : (
          entry?.z || '词库中暂未收录这个词 · 可手动收藏'
        )}
      </div>
      {entry?.e && <div className="en">{entry.e}</div>}

      {/*
       * 精讲是这套书真正的难点：词认得、义选错。卡片地方小，
       * 只放那段解析，不堆例句 —— 想看全的，按钮直接跳到词库那一条。
       */}
      {cur?.note ? (
        <div className="card-cur">
          <div className="card-cur-hd">
            <span>精讲</span>
            <button
              className="card-cur-more"
              onClick={() => {
                syncRoute('words', word);
                go('words');
                onClose();
              }}
            >
              在词库细看 →
            </button>
          </div>
          <p>
            {splitEmphasis(cur.note).map((seg, i) =>
              seg.b ? <b key={i}>{seg.text}</b> : <span key={i}>{seg.text}</span>,
            )}
          </p>
        </div>
      ) : null}

      {(entry?.t || tags.length > 0 || stat?.d != null) && (
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
            {/* 记忆状态来自 FSRS：这个词的稳定度、难度，以及排到哪一天复习 */}
            {stat?.d != null && (
              <div>
                <span>记忆</span>
                <em>
                  {memoryLabel(
                    { s: stat.s, d: stat.d, due: stat.due, last: stat.last ?? 0, reps: stat.reps ?? 1, lapses: stat.lapses ?? 0 },
                    dayNo()
                  )}
                  {` · 难度 ${Math.round(stat.d)}/10`}
                </em>
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
