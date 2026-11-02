import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { lookup, masteryOf, tokenize, type Corpus, type Token } from '../lib/data';
import { LEVEL_NAME } from '../lib/levels';
import { bookHasZh, bookZh } from '../lib/book-titles';
import { splitSentences } from '../lib/sentences';
import { speak, stopSpeaking } from '../lib/speech';
import { useGame } from '../lib/store';
import { translationsFor } from '../lib/trans';
import { WordCard } from '../components/WordCard';
import { hasFullBook } from '../lib/fullbooks';
import { FullBookReader } from './FullBookReader';

/**
 * 阅读页：先把文章看完，再决定要不要打。
 *
 * 文库原来点一行直接进打字页 —— 想「先看看这篇讲什么」的用户没有办法，
 * 只能进打字页看着一屏黑字发愣，或者去点词卡。阅读是独立的一件事，
 * 它需要的是完整全文、句末译文和可以停留的节奏，不是倒计时和连击。
 *
 * 版式照书来：一页一屏、不滚动，翻页而不是滚轮。分页交给 CSS 多栏 ——
 * 容器宽 = 栏宽，浏览器自己把正文切成若干栏，翻页就是把整块往左推一栏。
 * 自己算「一页能放几句」会按字体、译文开关、窗口宽度不停出错，多栏不会。
 */
export function ReaderScreen() {
  const corpus = useCorpus();
  const article = useGame(s => s.article);
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const setSetting = useGame(s => s.setSetting);
  const openArticle = useGame(s => s.read);
  const play = useGame(s => s.play);
  const go = useGame(s => s.go);
  const markUnknown = useGame(s => s.markUnknown);
  const toggleLex = useGame(s => s.toggleLex);

  const [tr, setTr] = useState<string[] | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [trTried, setTrTried] = useState(false);
  const [fullOk, setFullOk] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [card, setCard] = useState<{
    key: string; surface: string; anchor: { x: number; y: number; w: number; b: number }; saved: boolean;
  } | null>(null);

  const id = article?.id;

  useEffect(() => {
    setTr(null);
    setTrTried(false);
    if (!id) return;
    let alive = true;
    void translationsFor(id).then(t => {
      if (!alive) return;
      setTr(t);
      setTrTried(true);
    });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => () => { stopSpeaking(); }, []);

  /* 每次换篇目回到第一页 */
  useEffect(() => { setPage(0); }, [id]);

  /* 量一次可视区；窗口缩放、译文开关都会改变分页，所以跟着 ResizeObserver 走 */
  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* 这本书有没有全书译文：决定要不要给「读全书」入口 */
  useEffect(() => {
    let alive = true;
    if (!article) return;
    void hasFullBook(article.s).then(ok => { if (alive) setFullOk(ok); });
    return () => { alive = false; };
  }, [article?.s]);

  const sents = useMemo(() => (article ? splitSentences(article.tx) : []), [article]);
  const toks = useMemo(() => (article ? tokenize(corpus, article.tx) : []), [corpus, article]);

  /** 每个 token 归到它所在的那一句。句子是切好的，token 是全文的，这里对一次表。 */
  const perSent = useMemo(() => {
    const arr: typeof toks[] = sents.map(() => []);
    let si = 0;
    for (const t of toks) {
      while (si < sents.length - 1 && t.start >= sents[si].end) si++;
      if (sents[si] && t.start >= sents[si].start && t.end <= sents[si].end) arr[si].push(t);
    }
    return arr;
  }, [sents, toks]);

  /* 分页：多栏容器的 scrollWidth ÷ 栏宽 = 页数 */
  useLayoutEffect(() => {
    const el = pageRef.current?.querySelector('.rd-body') as HTMLElement | null;
    if (!el || !box.w) return;
    const n = Math.max(1, Math.round(el.scrollWidth / box.w));
    setPages(n);
    setPage(p => Math.min(p, n - 1));
  }, [box.w, box.h, sents.length, settings.readerZh, tr]);

  // 只标「词库里有释义、但还没掌握」的词。
  // 词库外的多是专名（Æsop / Holmes）—— 标了也查不到东西，只是制造噪音
  const hardCount = useMemo(
    () => toks.filter(t => corpus.dict.has(t.key) && masteryOf(corpus, p.mastery, t.key) < 40).length,
    [toks, corpus, p.mastery],
  );

  /** 同一本书的其它段：读完这段顺势往下读，比回文库重新找省事 */
  const sibs = useMemo(() => {
    if (!article) return [];
    return corpus.articles
      .filter(a => a.s === article.s)
      .sort((x, y) => (x.ord ?? 0) - (y.ord ?? 0));
  }, [corpus, article]);

  const at = sibs.findIndex(a => a.id === article?.id);
  const prev = at > 0 ? sibs[at - 1] : null;
  const next = at >= 0 && at < sibs.length - 1 ? sibs[at + 1] : null;

  /*
   * 翻页：到底了就翻篇。
   * 真书不会在段落末尾停住让人回目录 —— 读到最后一页再往后，就是下一段。
   */
  const turn = useCallback((d: number) => {
    setPage(cur => {
      const nx = cur + d;
      if (nx >= pages) {
        if (next) { openArticle(next); return 0; }
        return cur;
      }
      if (nx < 0) {
        if (prev) { openArticle(prev); return 0; }
        return cur;
      }
      return nx;
    });
  }, [pages, next, prev, openArticle]);

  /* 左右键翻页 —— 读书时手不该离开键盘旁边的位置 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { turn(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { turn(-1); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  const toggleRead = useCallback(() => {
    if (!article) return;
    if (reading) { stopSpeaking(); setReading(false); return; }
    setReading(true);
    speak(article.tx, {
      accent: settings.voice,
      rate: settings.rate,
      onEnd: () => setReading(false),
    });
  }, [article, reading, settings.voice, settings.rate]);

  const onWord = (e: React.MouseEvent<HTMLElement>, key: string, surface: string) => {
    e.stopPropagation();   // 否则会同时触发整句朗读
    const r = e.currentTarget.getBoundingClientRect();
    stopSpeaking();
    setReading(false);
    setCard({ key, surface, anchor: { x: r.left, y: r.top, w: r.width, b: r.bottom }, saved: !!p.mastery[key]?.lex });
    markUnknown(key);
  };

  const speakLine = (text: string) => {
    stopSpeaking();
    setReading(false);
    speak(text, { accent: settings.voice, rate: settings.rate });
  };

  if (!article) {
    return (
      <div className="page">
        <div className="empty">还没有选中的文章，去<a onClick={() => go('library')}>文库</a>挑一篇。</div>
      </div>
    );
  }

  const showZh = settings.readerZh;
  const noTr = trTried && !tr;

  /* 全书模式：整本通读（只对翻完的书开放） */
  if (fullOpen) return <FullBookReader title={article.s} onExit={() => setFullOpen(false)} />;
  const entry = lookup(corpus, card?.key ?? '');

  return (
    <div className="page rd">
      <div className="page-head rd-head">
        <div className="rd-head-main">
          <button className="icon-btn" onClick={() => go('library')} title="回文库">←</button>
          <div>
            <h1 className="page-title rd-title">
              {bookZh(article.s)}
              {bookHasZh(article.s) && <em className="rd-en-title">{article.s}</em>}
              {article.ord && article.tot ? <em className="ttl-part">· 第 {article.ord}/{article.tot} 段</em> : null}
            </h1>
            <div className="page-sub">
              {LEVEL_NAME[article.lv] ?? `L${article.lv}`} · {article.w} 词 · {sents.length} 句
              {hardCount > 0 ? ` · ${hardCount} 个生词（带下划线）` : ''}
            </div>
          </div>
        </div>
        <div className="rd-head-acts">
          <button className={`btn btn-ghost${reading ? ' on' : ''}`} onClick={toggleRead}>
            {reading ? '停止朗读' : '朗读全文'}
          </button>
          <button
            className={`btn btn-ghost${showZh ? ' on' : ''}`}
            onClick={() => setSetting('readerZh', !showZh)}
            title={noTr ? '这篇还没有译文' : '在每句英文下方显示中文'}
            aria-pressed={showZh}
          >
            {showZh ? '中英' : '原文'}
          </button>
          {fullOk && (
            <button className="btn btn-ghost" onClick={() => setFullOpen(true)} title="整本通读，全部句子都有译文">
              读全书
            </button>
          )}
          <button className="btn btn-primary" onClick={() => play(article)}>开始打字</button>
        </div>
      </div>

      {showZh && trTried && !tr && (
        <div className="rd-notice">这篇还没有译文，只显示原文。点句子可以听读音，点词可以看释义。</div>
      )}

      <div className="rd-book">
        {/* 书眉：左边书名，右边读到第几段 —— 真书翻开也是这样 */}
        <div className="rd-run">
          <span>{bookZh(article.s)}</span>
          <span>{article.ord && article.tot ? `第 ${article.ord}/${article.tot} 段` : ''}</span>
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
            {sents.map((s, i) => (
              <div className="rd-sent" key={s.start}>
                <p className="rd-en" onClick={() => speakLine(s.text)} title="点这一句可以朗读">
                  {renderLine(article.tx, s.start, s.end, perSent[i], corpus, p.mastery, onWord)}
                </p>
                {showZh && tr?.[i] && <p className="rd-zh">{tr[i]}</p>}
              </div>
            ))}
          </article>

          <button
            className="rd-turn prev"
            onClick={() => turn(-1)}
            disabled={page === 0}
            aria-label="上一页"
          >‹</button>
          <button
            className="rd-turn next"
            onClick={() => turn(1)}
            disabled={page >= pages - 1 && !next}
            aria-label="下一页"
          >›</button>
        </div>

        <div className="rd-pagefoot">
          <span className="rd-pageno">{page + 1} / {pages}</span>
          <span className="rd-hint">← → 翻页 · 点句子听读 · 点词看释义</span>
        </div>
      </div>

      <div className="rd-foot">
        <button className="rd-navbtn" disabled={!prev} onClick={() => prev && openArticle(prev)}>
          <span>‹ 上一段</span>
          {prev && <em>{prev.ord && prev.tot ? `${prev.ord}/${prev.tot}` : prev.s.slice(0, 14)}</em>}
        </button>
        <button className="rd-navbtn next" disabled={!next} onClick={() => next && openArticle(next)}>
          <span>下一段 ›</span>
          {next && <em>{next.ord && next.tot ? `${next.ord}/${next.tot}` : next.s.slice(0, 14)}</em>}
        </button>
      </div>

      {card && (
        <WordCard
          word={card.key}
          surface={card.surface}
          entry={entry}
          anchor={card.anchor}
          saved={card.saved}
          onClose={() => setCard(null)}
          onSave={() => {
            toggleLex(card.key);
            setCard({ ...card, saved: !card.saved });
          }}
        />
      )}
    </div>
  );
}

/**
 * 把一句渲染成「词 span + 间隙文本」。
 * 词才可点（查释义），间隙只负责把空格和标点原样放回去 —— 不能用 split(' ')，会吃掉标点。
 */
function renderLine(
  tx: string,
  start: number,
  end: number,
  toks: Token[],
  corpus: Corpus,
  mastery: Record<string, { m: number }>,
  onWord: (e: React.MouseEvent<HTMLElement>, key: string, surface: string) => void,
) {
  const out: React.ReactNode[] = [];
  let i = start;
  let gap = '';
  const flush = () => {
    if (!gap) return;
    out.push(<span key={`g${i}-${gap.length}`}>{gap}</span>);
    gap = '';
  };

  for (const t of toks) {
    if (t.start > i) gap += tx.slice(i, t.start);
    if (gap) flush();
    const hard = corpus.dict.has(t.key) && masteryOf(corpus, mastery, t.key) < 40;
    out.push(
      <span
        key={`w${t.start}`}
        className={`rd-w${hard ? ' hard' : ''}`}
        onClick={e => onWord(e, t.key, tx.slice(t.start, t.end))}
      >
        {tx.slice(t.start, t.end)}
      </span>,
    );
    i = t.end;
  }
  if (i < end) gap += tx.slice(i, end);
  if (gap) out.push(<span key={`t${end}`}>{gap}</span>);
  return out;
}
