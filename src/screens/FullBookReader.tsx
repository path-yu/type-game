import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { masteryOf, tokenize } from '../lib/data';
import { bookZh } from '../lib/book-titles';
import { speak, stopSpeaking } from '../lib/speech';
import { useGame } from '../lib/store';
import { WordCard } from '../components/WordCard';
import { lookup } from '../lib/data';

/**
 * 全书阅读：整本书的英文 + 全书译文，一屏一页地翻。
 *
 * 和阅读页（选段版）分开写，是为了不把那条已经稳定的路径改坏：
 * 选段版只读 1 篇、几百词；这里要读 1300 多句、上百页，索引、分页、
 * 词卡锚点都不一样。共用的是样式（.rd-page / .rd-sent / .rd-zh）和分页思路。
 *
 * 数据来自 public/data/full/<slug>.json（scripts/tr/export.mjs 生成），
 * 只有 100% 翻完的书才会出现这个入口。
 */
export function FullBookReader({ title, onExit }: { title: string; onExit: () => void }) {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const setSetting = useGame(s => s.setSetting);
  const markUnknown = useGame(s => s.markUnknown);
  const toggleLex = useGame(s => s.toggleLex);

  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<{ n: number; src: string[]; tr: string[] } | null>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [reading, setReading] = useState(false);
  const [card, setCard] = useState<{
    key: string; surface: string; anchor: { x: number; y: number; w: number; b: number }; saved: boolean;
  } | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const base = import.meta.env.BASE_URL || '/';

  /* 先查索引：这本书有没有全书译文 */
  useEffect(() => {
    let alive = true;
    fetch(`${base}data/full/index.json`)
      .then(r => (r.ok ? r.json() : { books: {} }))
      .then(j => {
        if (!alive) return;
        const books = (j.books ?? {}) as Record<string, { title: string; n: number }>;
        const hit = Object.entries(books).find(([, v]) => v.title === title);
        setSlug(hit ? hit[0] : null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [title, base]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    fetch(`${base}data/full/${slug}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug, base]);

  useEffect(() => () => { stopSpeaking(); }, []);

  const showZh = settings.readerZh;

  /* 每句单独分词：全书一万句不可能每句都拿全文下标去对 */
  const blocks = useMemo(() => {
    if (!data) return [];
    return data.src.map((en, i) => ({
      start: i,
      en,
      zh: data.tr[i] ?? '',
      toks: tokenize(corpus, en),
    }));
  }, [data, corpus]);

  /*
   * 量可视区。依赖 data：书页容器是在 data 到手后才渲染出来的，
   * 挂载时量一次只会量到空，分页就会永远停在「1 / 1」。
   */
  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  useLayoutEffect(() => {
    const el = pageRef.current?.querySelector('.rd-body') as HTMLElement | null;
    if (!el || !box.w) return;
    const n = Math.max(1, Math.round(el.scrollWidth / box.w));
    setPages(n);
    setPage(v => Math.min(v, n - 1));
  }, [box.w, box.h, blocks.length, showZh]);

  const turn = (d: number) => setPage(v => Math.max(0, Math.min(pages - 1, v + d)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { turn(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { turn(-1); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages]);

  const onWord = (e: React.MouseEvent<HTMLElement>, key: string, surface: string) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    stopSpeaking();
    setReading(false);
    setCard({ key, surface, anchor: { x: r.left, y: r.top, w: r.width, b: r.bottom }, saved: !!p.mastery[key]?.lex });
    markUnknown(key);
  };

  if (!data) {
    return (
      <div className="page rd">
        <div className="empty">这本书还没有全书译文。<a onClick={onExit}>回到选段</a></div>
      </div>
    );
  }

  return (
    <div className="page rd">
      <div className="page-head rd-head">
        <div className="rd-head-main">
          <button className="icon-btn" onClick={onExit} title="回到选段">←</button>
          <div>
            <h1 className="page-title rd-title">
              {bookZh(title)}
              <em className="ttl-part">· 全书 {data.n} 句</em>
            </h1>
            <div className="page-sub">整本通读 · 一屏一页 · 全部句子都有译文</div>
          </div>
        </div>
        <div className="rd-head-acts">
          <button
            className={`btn btn-ghost${reading ? ' on' : ''}`}
            onClick={() => {
              if (reading) { stopSpeaking(); setReading(false); return; }
              const rest = data.src.slice(page * 6).join(' ');
              setReading(true);
              speak(rest.slice(0, 1200), {
                accent: settings.voice, rate: settings.rate, onEnd: () => setReading(false),
              });
            }}
          >
            {reading ? '停止朗读' : '朗读'}
          </button>
          <button
            className={`btn btn-ghost${showZh ? ' on' : ''}`}
            onClick={() => setSetting('readerZh', !showZh)}
            aria-pressed={showZh}
          >
            {showZh ? '中英' : '原文'}
          </button>
        </div>
      </div>

      <div className="rd-book">
        <div className="rd-run">
          <span>{bookZh(title)} · 全书</span>
          <span>第 {page + 1} 页</span>
        </div>

        <div className="rd-page" ref={pageRef}>
          <article
            className="rd-body"
            style={{
              columnWidth: box.w ? `${box.w}px` : undefined,
              height: box.h || undefined,
              transform: `translateX(${-page * box.w}px)`,
            }}
          >
            {blocks.map((s, i) => (
              /* 长句允许跨页断开：整句不许断会让长段落后面留出半页空白，翻起来很跳 */
              <div className="rd-sent" key={s.start} style={s.en.length > 260 ? { breakInside: 'auto' } : undefined}>
                <p
                  className="rd-en"
                  onClick={() => { stopSpeaking(); speak(s.en, { accent: settings.voice, rate: settings.rate }); }}
                  title="点这一句可以朗读"
                >
                  {renderWords(s.en, s.toks, corpus, p.mastery, onWord)}
                </p>
                {showZh && s.zh && <p className="rd-zh">{s.zh}</p>}
                {i === 0 && <span className="rd-hidden" />}
              </div>
            ))}
          </article>
          <button className="rd-turn prev" onClick={() => turn(-1)} disabled={page === 0} aria-label="上一页">‹</button>
          <button className="rd-turn next" onClick={() => turn(1)} disabled={page >= pages - 1} aria-label="下一页">›</button>
        </div>

        <div className="rd-pagefoot">
          <span className="rd-pageno">{page + 1} / {pages}</span>
          <span className="rd-hint">← → 翻页 · 点词看释义</span>
        </div>
      </div>

      {card && (
        <WordCard
          word={card.key}
          surface={card.surface}
          entry={lookup(corpus, card.key)}
          anchor={card.anchor}
          saved={card.saved}
          onClose={() => setCard(null)}
          onSave={() => { toggleLex(card.key); setCard({ ...card, saved: !card.saved }); }}
        />
      )}
    </div>
  );
}

/** 一句渲染成「词 span + 间隙文本」；下标是相对这一句的 */
function renderWords(
  text: string,
  toks: { start: number; end: number; key: string }[],
  corpus: ReturnType<typeof useCorpus>,
  mastery: Record<string, { m: number }>,
  onWord: (e: React.MouseEvent<HTMLElement>, key: string, surface: string) => void,
) {
  const out: React.ReactNode[] = [];
  let i = 0;
  for (const t of toks) {
    if (t.start > i) out.push(<span key={`g${t.start}`}>{text.slice(i, t.start)}</span>);
    const hard = corpus.dict.has(t.key) && masteryOf(corpus, mastery, t.key) < 40;
    out.push(
      <span
        key={`w${t.start}`}
        className={`rd-w${hard ? ' hard' : ''}`}
        onClick={e => onWord(e, t.key, text.slice(t.start, t.end))}
      >
        {text.slice(t.start, t.end)}
      </span>,
    );
    i = t.end;
  }
  if (i < text.length) out.push(<span key="tail">{text.slice(i)}</span>);
  return out;
}
