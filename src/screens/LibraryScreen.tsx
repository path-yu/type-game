import { useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { DISTRICTS, THEME } from '../lib/districts';
import { recommend } from '../lib/data';
import { useGame } from '../lib/store';
import type { Article } from '../lib/types';
import { bookHasZh, bookMatches, bookZh } from '../lib/book-titles';
import { loadFullIndex, type FullBookInfo } from '../lib/fullbooks';
import { FullBookReader } from './FullBookReader';

/**
 * 文库：先看书架，再翻目录，最后才是一段一段读。
 *
 * 上一版是把 1419 段全摊在一页里 —— 能搜、能筛，但看不出"这是一本书"：
 * 二十本长篇和三十个维基条目混在同一列，书名只是个小标签，
 * 点进来面对的是几千行英文片段，而不是五十二个可以挑的东西。
 *
 * 现在：封面 + 书名排成书架；点一本书进去看目录（每段一行），再点进阅读页。
 * 封面来自 public/data/covers.json：长篇用 Gutenberg 的扫描封面，
 * 其余用 scripts/fetch-covers.mjs 画的封面 —— 没有这张图，书架就是一格空格。
 */
export function LibraryScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const play = useGame(s => s.play);
  const openRead = useGame(s => s.read);
  const [lv, setLv] = useState(0);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [full, setFull] = useState<Record<string, FullBookInfo>>({});
  const [fullOpen, setFullOpen] = useState<string | null>(null);

  /*
   * 全书译文索引。
   * 书架是最先看到的地方 —— 哪本书能整本读下去，必须在挑书时就看得见，
   * 而不是点进阅读页才发现多个按钮。
   */
  useEffect(() => {
    let alive = true;
    void loadFullIndex().then(b => { if (alive) setFull(b); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL || '/'}data/covers.json`)
      .then(r => (r.ok ? r.json() : {}))
      .then(j => { if (alive) setCovers(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // 同一本书的段落挨在一起，书内按原文顺序 —— 这样能看出"这本书有 80 段"
  const groups = useMemo(() => {
    const bookOrder = new Map<string, number>();
    for (const a of corpus.articles) {
      if (!bookOrder.has(a.s)) bookOrder.set(a.s, bookOrder.size);
    }
    const pool = corpus.articles.filter(a =>
      (lv === 0 || a.lv === lv) && bookMatches(a.s, q)
    );
    const byBook = new Map<string, Article[]>();
    for (const a of pool) {
      if (!byBook.has(a.s)) byBook.set(a.s, []);
      byBook.get(a.s)!.push(a);
    }
    const out = [...byBook].map(([title, list]) => {
      const sorted = list.sort((x, y) => (x.ord ?? 0) - (y.ord ?? 0));
      const lvs = sorted.map(a => a.lv);
      return {
        title,
        list: sorted,
        lvMin: Math.min(...lvs),
        lvMax: Math.max(...lvs),
        done: sorted.filter(a => (p.played[a.id] ?? 0) > 0).length,
        theme: THEME[sorted[0].th] ?? '阅读',
      };
    });
    // 篇数多的书排前面（小说在前，单篇维基在后）
    return out.sort((x, y) => y.list.length - x.list.length || bookOrder.get(x.title)! - bookOrder.get(y.title)!);
  }, [corpus, lv, q, p.played]);

  const total = corpus.articles.length;
  // 书的本数用全库口径：筛选后 groups 只剩几本，页头写「13 本书 · 1179 篇」会自相矛盾
  const allBooks = useMemo(() => new Set(corpus.articles.map(a => a.s)).size, [corpus]);
  const read = Object.keys(p.played).length;
  const shown = groups.reduce((s, g) => s + g.list.length, 0);
  const next = useMemo(() => recommend(corpus, p.mastery, Math.min(7, p.unlocked), p.recent), [corpus, p.mastery, p.unlocked, p.recent]);

  /* 书名 → 全书数据。index 以 slug 为键，这里按 title 反查一次即可 */
  const fullOf = useMemo(() => {
    const m = new Map<string, FullBookInfo>();
    for (const b of Object.values(full)) m.set(b.title, b);
    return m;
  }, [full]);

  /*
   * 书架的排法：能整本读的排前面。
   * 按篇数排的话，读到第 40 本才会遇到一本"全书" —— 那等于把这次做的事藏起来了。
   * 全书内部按句子多少排（短的在前，容易开头）。
   */
  const shelf = useMemo(() => {
    const of = (t: string) => fullOf.get(t)?.n ?? 0;
    return [...groups].sort((x, y) => {
      const fx = of(x.title) > 0, fy = of(y.title) > 0;
      if (fx !== fy) return fx ? -1 : 1;
      if (fx && fy) return of(x.title) - of(y.title);
      return 0;
    });
  }, [groups, fullOf]);

  const book = open ? groups.find(g => g.title === open) ?? null : null;
  const bookFull = book ? fullOf.get(book.title) ?? null : null;

  /*
   * 有全书译文、但不在 articles.json 里的书（比如后加的《一九八四》）。
   * 它们没有选段可练，只提供整本通读 —— 单独排一条，不然书架上看不见。
   */
  const fullOnly = useMemo(() => {
    const known = new Set(groups.map(g => g.title));
    return Object.entries(full)
      .filter(([, v]) => !known.has(v.title))
      .sort((a, b) => a[1].n - b[1].n)
      .map(([slug, v]) => ({ slug, title: v.title, n: v.n }));
  }, [full, groups]);

  /* 读全书：整本通读，退出后回到目录 */
  if (fullOpen) return <FullBookReader title={fullOpen} onExit={() => setFullOpen(null)} />;
  const coverOf = (title: string) => `${import.meta.env.BASE_URL || '/'}covers/${covers[title] ?? ''}`;

  return (
    <div className="page lib">
      <div className="page-head">
        <div>
          <h1 className="page-title">文库</h1>
          <div className="page-sub">
            {allBooks + fullOnly.length} 本书 · {total} 篇 · 练过 {read} 篇
            {shown !== total && ` · 当前筛选 ${shown} 篇`}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => play(next)}>
          接着打
        </button>
      </div>

      <div className="lib-bar">
        <input
          className="lib-search"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(null); }}
          placeholder="搜书名…"
          spellCheck={false}
        />
        <div className="lib-chips">
          <button className={`lib-chip${lv === 0 ? ' on' : ''}`} onClick={() => { setLv(0); setOpen(null); }}>全部</button>
          {DISTRICTS.map(d => (
            <button
              key={d.lv}
              className={`lib-chip${lv === d.lv ? ' on' : ''}${d.lv > p.unlocked ? ' dim' : ''}`}
              onClick={() => { setLv(d.lv); setOpen(null); }}
            >
              {d.name}
              <em>L{d.lv}</em>
            </button>
          ))}
        </div>
      </div>

      {book ? (
        <section className="lib-toc">
          <header className="lib-toc-head">
            <button className="lib-back" onClick={() => setOpen(null)}>← 书架</button>
            <img className="lib-toc-cover" src={coverOf(book.title)} alt="" />
            <div className="lib-toc-meta">
              <h2 className="lib-toc-title">
                {bookZh(book.title)}
                {bookHasZh(book.title) && <em>{book.title}</em>}
              </h2>
              <div className="lib-toc-sub">
                {book.theme} · {book.list.length} 篇 · L{book.lvMin}
                {book.lvMax !== book.lvMin && `–${book.lvMax}`}
                {book.done > 0 && ` · 已练 ${book.done} 篇`}
                {bookFull && ` · 全书 ${bookFull.n} 句已译`}
              </div>
            </div>
            {bookFull && (
              <button className="btn btn-ghost" onClick={() => setFullOpen(book.title)}>
                读全书
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                // 从没练过的那一篇开始读；都练过就从第一篇重新读
                const first = book.list.find(a => !(p.played[a.id] ?? 0)) ?? book.list[0];
                openRead(first);
              }}
            >
              从头读
            </button>
          </header>

          <div className="lib-rows">
            {book.list.map(a => {
              const stars = p.played[a.id] ?? 0;
              return (
                <button
                  key={a.id}
                  className={`lib-row${stars ? ' done' : ''}`}
                  onClick={() => openRead(a)}
                  title="打开阅读：看全文和译文，再决定要不要打"
                >
                  <span className="lib-ord">{a.ord && a.tot ? `${a.ord}/${a.tot}` : '—'}</span>
                  <span className="lib-text">{a.tx.slice(0, 64)}…</span>
                  <span className="lib-meta">
                    {a.w} 词
                    <em>L{a.lv}</em>
                  </span>
                  <span className={`lib-flag${stars ? ' on' : ''}`}>
                    {stars ? '★'.repeat(stars) : '未读'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          {fullOnly.length > 0 && (
            <section className="lib-only">
              <div className="lib-only-head">
                全书通读 <em>整本译完、但没有选段可练的书</em>
              </div>
              <div className="lib-only-list">
                {fullOnly.map(b => (
                  <button key={b.slug} className="lib-only-card" onClick={() => setFullOpen(b.title)}>
                    <span className="lib-only-cover">
                      <img src={coverOf(b.title)} alt="" decoding="async" />
                    </span>
                    <span className="lib-only-text">
                      <span className="lib-only-title">
                        {bookZh(b.title)}
                        {bookHasZh(b.title) && <em>{b.title}</em>}
                      </span>
                      <span className="lib-only-meta">{b.n} 句 · 整本已译</span>
                      <span className="lib-only-go">读全书 →</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="lib-shelf">
          {shelf.map(g => (
            <button
              key={g.title}
              className="lib-book"
              onClick={() => setOpen(g.title)}
              title={`${bookZh(g.title)} · ${g.list.length} 篇`}
            >
              <span className="lib-cover">
                {/* 不做懒加载：52 张封面加起来 600 KB 上下，本地读几乎不花时间，
                    而懒加载会在滚动时一格一格地闪白 —— 书架最不该有的就是这个 */}
                <img src={coverOf(g.title)} alt="" decoding="async" />
                {fullOf.has(g.title) && <span className="lib-full">全书</span>}
                {g.done > 0 && (
                  <span className="lib-cover-bar">
                    <i style={{ width: `${Math.round((g.done / g.list.length) * 100)}%` }} />
                  </span>
                )}
              </span>
              <span className="lib-book-title">
                {bookZh(g.title)}
                {bookHasZh(g.title) && <em className="lib-book-en">{g.title}</em>}
              </span>
              <span className="lib-book-meta">
                {fullOf.has(g.title) ? `全书 ${fullOf.get(g.title)!.n} 句` : `${g.list.length} 篇`}
                {' · '}L{g.lvMin}
                {g.lvMax !== g.lvMin && `–${g.lvMax}`}
              </span>
            </button>
          ))}
          {groups.length === 0 && <div className="lib-empty">没有匹配的书名</div>}
          </div>
        </>
      )}
    </div>
  );
}
