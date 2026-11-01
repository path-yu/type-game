import { useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { DISTRICTS, THEME } from '../lib/districts';
import { recommend } from '../lib/data';
import { useGame } from '../lib/store';
import type { Article } from '../lib/types';

/**
 * 文库：把库里全部文章摊开。
 *
 * 之前没有这一页 —— 城市页只有 7 行城区，每行写「0/8」，看起来像总共只有 56 篇。
 * 实际上每行背后是 165 篇左右，用户没法知道，也没法挑。
 */
export function LibraryScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const play = useGame(s => s.play);
  const [lv, setLv] = useState(0);
  const [q, setQ] = useState('');

  // 同一本书的段落挨在一起，书内按原文顺序 —— 这样能看出"这本书有 80 段"
  const groups = useMemo(() => {
    const bookOrder = new Map<string, number>();
    for (const a of corpus.articles) {
      if (!bookOrder.has(a.s)) bookOrder.set(a.s, bookOrder.size);
    }
    const pool = corpus.articles.filter(a =>
      (lv === 0 || a.lv === lv) && (!q || a.s.toLowerCase().includes(q.toLowerCase()))
    );
    const byBook = new Map<string, Article[]>();
    for (const a of pool) {
      if (!byBook.has(a.s)) byBook.set(a.s, []);
      byBook.get(a.s)!.push(a);
    }
    const out = [...byBook].map(([title, list]) => ({
      title,
      list: list.sort((x, y) => (x.ord ?? 0) - (y.ord ?? 0)),
    }));
    // 篇数多的书排前面（小说在前，单篇维基在后）
    return out.sort((x, y) => y.list.length - x.list.length || bookOrder.get(x.title)! - bookOrder.get(y.title)!);
  }, [corpus, lv, q]);

  const total = corpus.articles.length;
  const read = Object.keys(p.played).length;
  const shown = groups.reduce((s, g) => s + g.list.length, 0);
  const next = useMemo(() => recommend(corpus, p.mastery, Math.min(7, p.unlocked), p.recent), [corpus, p.mastery, p.unlocked, p.recent]);

  return (
    <div className="page lib">
      <div className="page-head">
        <div>
          <h1 className="page-title">文库</h1>
          <div className="page-sub">
            共 {total} 篇 · 已读 {read} 篇 · {groups.length} 个来源
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
          onChange={e => setQ(e.target.value)}
          placeholder="搜书名…"
          spellCheck={false}
        />
        <div className="lib-chips">
          <button className={`lib-chip${lv === 0 ? ' on' : ''}`} onClick={() => setLv(0)}>全部</button>
          {DISTRICTS.map(d => (
            <button
              key={d.lv}
              className={`lib-chip${lv === d.lv ? ' on' : ''}${d.lv > p.unlocked ? ' dim' : ''}`}
              onClick={() => setLv(d.lv)}
            >
              {d.name}
              <em>L{d.lv}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="lib-books">
        {groups.map(g => (
          <section key={g.title} className="lib-book">
            <header className="lib-book-head">
              <span className="lib-book-title">{g.title}</span>
              <span className="lib-book-count">{g.list.length} 篇</span>
              <span className="lib-book-theme">{THEME[g.list[0].th] ?? '阅读'}</span>
            </header>
            <div className="lib-rows">
              {g.list.map(a => {
                const stars = p.played[a.id] ?? 0;
                return (
                  <button key={a.id} className={`lib-row${stars ? ' done' : ''}`} onClick={() => play(a)}>
                    <span className="lib-ord">
                      {a.ord && a.tot ? `${a.ord}/${a.tot}` : '—'}
                    </span>
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
        ))}
        {groups.length === 0 && <div className="lib-empty">没有匹配的书名</div>}
      </div>
    </div>
  );
}
