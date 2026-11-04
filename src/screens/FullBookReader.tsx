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
  /* 索引查完没有？没查完之前不能下「这本书没有全书译文」的结论 */
  const [idxDone, setIdxDone] = useState(false);
  const [data, setData] = useState<{ n: number; src: string[]; tr: string[] } | null>(null);
  /* 正文请求失败（404 / 网络断）与「本来就没有」要分开，否则一并显示成没有译文 */
  const [loadFailed, setLoadFailed] = useState(false);
  /* 失败后点「重试」重新拉一次 */
  const [nonce, setNonce] = useState(0);
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
        setIdxDone(true);
      })
      .catch(() => { if (alive) setIdxDone(true); });
    return () => { alive = false; };
  }, [title, base]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoadFailed(false);
    fetch(`${base}data/full/${slug}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!alive) return;
        if (j) setData(j);
        else setLoadFailed(true);
      })
      .catch(() => { if (alive) setLoadFailed(true); });
    return () => { alive = false; };
  }, [slug, base, nonce]);

  useEffect(() => () => { stopSpeaking(); }, []);

  const showZh = settings.readerZh;

  /*
   * 句子先只存纯文本，不在这里分词。
   *
   * 原来每句都跑一次 tokenize、渲染成一个词一个 span：一本 9000 句的书会生成
   * 十几万个内联节点，排版一次要十几秒、内存也跟着涨。
   * 现在只渲染 <p>文本</p>，等版面量出来、知道哪几句落在当前屏，
   * 再只给那几句套上可点的词 span —— 一屏也就几十个。
   */
  /*
   * 只挂前 MOUNT_STEP 句，翻到接近末尾再接着挂。
   *
   * 12 秒、421MB 的根源不是分词，是这一屏多栏布局本身：9000 句一次性流进
   * 一个 column 容器，Chrome 要为每一栏算行盒，排版对象一大堆。
   * 分批挂载后首屏只要几百句的排版量，没读到的部分根本不建。
   */
  const MOUNT_STEP = 400;
  const [mounted, setMounted] = useState(MOUNT_STEP);
  useEffect(() => { setMounted(MOUNT_STEP); }, [data]);

  const blocks = useMemo(() => {
    if (!data) return [];
    return data.src.slice(0, mounted).map((en, i) => ({ start: i, en, zh: data.tr[i] ?? '' }));
  }, [data, mounted]);

  /* 每句落在第几屏：排完版量一次 offsetLeft 就知道，翻页时不用重算 */
  const [sentPage, setSentPage] = useState<number[] | null>(null);
  const sentPageRef = useRef<number[] | null>(null);

  /*
   * 两种读法：一屏一页（横翻）和竖向无限滚动。
   * 分页适合"读完一屏正好一口"，但想跳着找某章某段就不顺手；
   * 滚动更像真的在看书，放在设置里选，默认仍然是一屏一页。
   */
  const [mode, setMode] = useState<'page' | 'scroll'>(
    () => (localStorage.getItem('tw-fullmode') === 'scroll' ? 'scroll' : 'page'),
  );
  const pickMode = (m: 'page' | 'scroll') => {
    setMode(m);
    localStorage.setItem('tw-fullmode', m);
  };
  const [tocOpen, setTocOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * 目录：从英文原句里认章节标题。
   * 公版书的写法不统一 —— 「CHAPTER IV.」「PART ONE」「IV.」都见过，
   * 认不出来就当这本书没有目录（目录面板会显示"没找到章节"），不硬编一个。
   */
  const chapters = useMemo(() => {
    if (!data) return [];
    const isHead = (t: string) =>
      /^(CHAPTER|Chapter|BOOK|Book|PART|Part)\s+([IVXLCDM]+|\d+|[A-Z][A-Za-z]*)\b/.test(t)
      || /^第[一二三四五六七八九十百]+[章部卷]/.test(t)
      || /^[IVXLCDM]+\.?$/.test(t.trim());
    const out: { i: number; label: string }[] = [];
    for (let i = 0; i < data.src.length; i++) {
      const t = data.src[i].trim();
      if (t.length > 60 || !isHead(t)) continue;
      const zh = (data.tr[i] ?? '').trim();
      // 有中文章名就用中文（"第一章"），没有就退回原文
      const label = /^第[一二三四五六七八九十百]+[章部卷]/.test(zh) ? zh.replace(/[。.\s]+$/, '') : t.replace(/[.、\s]+$/, '');
      out.push({ i, label });
    }
    return out;
  }, [data]);

  /** 跳到某一句：分页模式换算成屏，滚动模式直接滚过去 */
  const jumpTo = (i: number) => {
    setTocOpen(false);
    if (!data) return;
    /*
     * 目标可能在还没挂载的那一段里（比如第七章在第 3000 句）。
     * 先把批次挂到它后面，等这一轮排版量完 sentPage 再翻过去 ——
     * 直接 setPage 会落在第 1 屏，因为那张表里还没有它。
     */
    if (mounted < i + MOUNT_STEP) setMounted(Math.min(data.src.length, i + MOUNT_STEP));
    window.setTimeout(() => {
      if (mode === 'scroll') {
        scrollRef.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'start' });
      } else {
        const to = sentPageRef.current?.[i] ?? 0;
        setPage(Math.max(0, to));
      }
    }, 280);
  };

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

  /*
   * 快翻到已挂载部分的末尾了，再接一批。
   * 追加只往后面加栏，前面已有的栏位置不变，所以 page 不用跟着挪。
   */
  useEffect(() => {
    if (!data || mounted >= data.src.length) return;
    if (pages <= 1) return;
    if (page >= pages - 2) setMounted(m => Math.min(data.src.length, m + MOUNT_STEP));
  }, [page, pages, mounted, data]);

  /*
   * 排完版之后记下每句在第几屏。
   * 多栏布局里 offsetLeft 已经把栏偏移算进去了，所以不用再加 page*box.w；
   * 这一步只跑一次（换字号/切中英/换尺寸才重来），翻页时直接查表。
   */
  useLayoutEffect(() => {
    const body = pageRef.current?.querySelector('.rd-body') as HTMLElement | null;
    if (!body || !box.w || !blocks.length) return;
    const w = box.w;
    const nodes = body.querySelectorAll<HTMLElement>('.rd-sent');
    const arr = new Array(nodes.length);
    for (let i = 0; i < nodes.length; i++) {
      arr[i] = Math.max(0, Math.floor((nodes[i].offsetLeft + 8) / w));
    }
    sentPageRef.current = arr;
    setSentPage(arr);
  }, [box.w, box.h, blocks, showZh]);

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

  /*
   * 三种「还没内容」要分开说：
   *   索引没查完 / 正文还在下载 —— 只是慢，不是没有；
   *   索引里确实没有 —— 这本书没译完；
   *   请求失败 —— 是出错，可以重试。
   * 全写成「还没有全书译文」会让一本两兆的书看起来像根本没译（白等三秒还以为坏了）。
   */
  if (!data) {
    if (loadFailed) {
      return (
        <div className="page rd">
          <div className="empty">
            全书译文没载入成功。<a onClick={() => setNonce(n => n + 1)}>重试</a>
            <a onClick={onExit}>回到选段</a>
          </div>
        </div>
      );
    }
    if (idxDone && !slug) {
      return (
        <div className="page rd">
          <div className="empty">这本书还没有全书译文。<a onClick={onExit}>回到选段</a></div>
        </div>
      );
    }
    return (
      <div className="page rd">
        <div className="empty">正在载入全书译文…</div>
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
          <button className={`btn btn-ghost${tocOpen ? ' on' : ''}`} onClick={() => setTocOpen(v => !v)} aria-pressed={tocOpen}>
            目录
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => pickMode(mode === 'page' ? 'scroll' : 'page')}
            title="在「一屏一页」和「竖向滚动」之间切换"
          >
            {mode === 'page' ? '翻页' : '滚动'}
          </button>
          <button
            className={`btn btn-ghost${reading ? ' on' : ''}`}
            onClick={() => {
              if (reading) { stopSpeaking(); setReading(false); return; }
              /* 从当前这一屏的第一句念起：有了 sentPage 就不用再按「每屏 6 句」瞎猜 */
              const from = sentPage
                ? Math.max(0, sentPage.findIndex(v => v >= page))
                : page * 6;
              const rest = data.src.slice(from).join(' ');
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
        {tocOpen && (
          <aside className="rd-toc" role="dialog" aria-label="目录">
            <div className="rd-toc-head">
              <span>目录</span>
              <button className="icon-btn" onClick={() => setTocOpen(false)} aria-label="关闭目录">×</button>
            </div>
            {chapters.length === 0 ? (
              <div className="rd-toc-empty">这本书的原文里没有可识别的章节标题</div>
            ) : (
              <div className="rd-toc-list">
                {chapters.map(c => (
                  <button key={c.i} className="rd-toc-item" onClick={() => jumpTo(c.i)}>
                    <span className="rd-toc-label">{c.label}</span>
                    <em>
                      {mode === 'scroll'
                        ? `${Math.round((c.i / data.src.length) * 100)}%`
                        /* 还没排到的章，页码是未知的，别假装它在第 1 屏 */
                        : sentPage?.[c.i] === undefined ? '…' : `第 ${sentPage[c.i] + 1} 屏`}
                    </em>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}
        <div className="rd-run">
          <span>{bookZh(title)} · 全书</span>
          <span>第 {page + 1} 屏</span>
        </div>

        {mode === 'page' ? (
          <>
          <div className="rd-page" ref={pageRef}>
            <article
              className="rd-body"
              style={{
                columnWidth: box.w ? `${box.w}px` : undefined,
                height: box.h || undefined,
                transform: `translateX(${-page * box.w}px)`,
              }}
            >
              {blocks.map((s, i) => {
                /*
                 * 只有当前屏（以及前后各一屏，翻页时不至于先白一下）才铺词 span，
                 * 其余句子就是纯文本。点词是读这一屏时才用得上的功能，
                 * 没必要为整本书建十几万个可点节点。
                 */
                const near = !sentPage || Math.abs((sentPage[i] ?? -99) - page) <= 1;
                return (
                  /* 长句允许跨页断开：整句不许断会让长段落后面留出半页空白，翻起来很跳 */
                  <div className="rd-sent" key={s.start} style={s.en.length > 260 ? { breakInside: 'auto' } : undefined}>
                    <p
                      className="rd-en"
                      onClick={() => { stopSpeaking(); speak(s.en, { accent: settings.voice, rate: settings.rate }); }}
                      title="点这一句可以朗读"
                    >
                      {near ? renderWords(s.en, tokenize(corpus, s.en), corpus, p.mastery, onWord) : s.en}
                    </p>
                    {showZh && s.zh && <p className="rd-zh">{s.zh}</p>}
                    {i === 0 && <span className="rd-hidden" />}
                  </div>
                );
              })}
            </article>
            <button className="rd-turn prev" onClick={() => turn(-1)} disabled={page === 0} aria-label="上一页">‹</button>
            <button className="rd-turn next" onClick={() => turn(1)} disabled={page >= pages - 1} aria-label="下一页">›</button>
          </div>

          <div className="rd-pagefoot">
            <span className="rd-pageno">
              {page + 1} / {pages}{mounted < (data.src.length) ? '+' : ''}
            </span>
            <span className="rd-hint">← → 翻屏 · 点词看释义</span>
          </div>
          </>
        ) : (
          <>
            <div
              className="rd-scroll"
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current;
                if (!el || !data) return;
                // 离底还有一屏半就接下一批，滚动不会撞墙
                if (el.scrollTop + el.clientHeight > el.scrollHeight - 900) {
                  setMounted(m => Math.min(data.src.length, m + MOUNT_STEP));
                }
              }}
            >
              <article className="rd-body flat">
                {blocks.map((s2, i) => (
                  <div className="rd-sent" key={s2.start} data-i={s2.start}>
                    <p
                      className="rd-en"
                      onClick={() => { stopSpeaking(); speak(s2.en, { accent: settings.voice, rate: settings.rate }); }}
                      title="点这一句可以朗读"
                    >
                      {renderWords(s2.en, tokenize(corpus, s2.en), corpus, p.mastery, onWord)}
                    </p>
                    {showZh && s2.zh && <p className="rd-zh">{s2.zh}</p>}
                    {i === 0 && <span className="rd-hidden" />}
                  </div>
                ))}
                {mounted < data.src.length && <div className="rd-more">正在排列后面的句子…</div>}
              </article>
            </div>

            <div className="rd-pagefoot">
              <span className="rd-pageno">
                {Math.min(100, Math.round((mounted / data.src.length) * 100))}%
              </span>
              <span className="rd-hint">滚轮往下读 · 点词看释义</span>
            </div>
          </>
        )}
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
