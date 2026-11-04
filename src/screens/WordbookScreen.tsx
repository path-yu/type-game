import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../lib/store';
import { useCorpus } from '../lib/CorpusContext';
import { speak, stopSpeaking } from '../lib/speech';
import { syncRoute } from '../lib/route';

/**
 * 词库：查词用的，不是"我学过哪些词"那本账簿（那是藏书阁）。
 *
 * 三万五千个词条，页面上一行一行全渲染是行不通的 —— 光 DOM 就三万多节点，
 * 滚动会卡成幻灯片。所以这里自己做虚拟列表：只渲染可视区那几十行，
 * 其余用一块撑高的占位。滚动时只是换一批行，DOM 数量恒定。
 *
 * 数据分两层：
 *   data/lex/index.json   词表（783KB），一次性载入，搜索和列表都靠它
 *   data/lex/<字母>.json  某个字母下的全部词条，点开哪个词才取哪一片，取完缓存
 * 这样首屏只需要 783KB，不是 29MB。
 */

type Row = [string, number, string, number, number?]; // [词, 频次, 词性串, 是否有例句, 是否有精讲]

interface Sense {
  p: string;          // 词性
  zh?: string;        // 中文释义（有就先显示这个）
  d: string;          // 英文原义
  x?: string[];       // 该义项自带的例子
  s?: string[];       // 同义词
}

interface Entry {
  w: string;
  ipa?: string;
  f: number;
  l?: string;                                  // 原形（屈折形式才有）
  senses: Sense[];
  ex?: { t: string; zh?: string; src?: string }[];
  src?: [string, number][];  // 在哪几本书里出现、各几次
  cur?: { note?: string; ex?: { en: string; zh: string }[] };  // 人写的精讲
  up?: string[];    // 上位词（WordNet @ 指针）
  opp?: string[];   // 反义词（! 指针）
  forms?: string[];
}

const ROW_H = 46;
const POS_LABEL: Record<string, string> = {
  n: '名', v: '动', a: '形', r: '副',
  pron: '代', conj: '连', prep: '介', art: '冠', aux: '助', part: '不', int: '叹', '': '—',
};

export function WordbookScreen() {
  /*
   * 收藏接的是学习系统里同一个存档（p.mastery[word].lex）——
   * 在词库里收藏的词，藏书阁里立刻就有，不是两套数据。
   */
  const mastery = useGame(s => s.p.mastery);
  const toggleLex = useGame(s => s.toggleLex);
  const markUnknown = useGame(s => s.markUnknown);
  const recordLookup = useGame(s => s.recordLookup);
  const lookups = useGame(s => s.p.lookups);
  const corpus = useCorpus();
  const read = useGame(s => s.read);
  const go = useGame(s => s.go);
  const [fullBooks, setFullBooks] = useState<Set<string>>(new Set());
  const [onlyLex, setOnlyLex] = useState(false);
  const [onlyCur, setOnlyCur] = useState(false);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [fail, setFail] = useState(false);
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState<string>('');
  const [pos, setPos] = useState<string>('');
  const [onlyEx, setOnlyEx] = useState(false);

  const [scrollTop, setScrollTop] = useState(0);
  const [boxH, setBoxH] = useState(600);

  const [word, setWord] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);

  const shardCache = useRef(new Map<string, Record<string, Entry>>());
  const listRef = useRef<HTMLDivElement>(null);

  const base = import.meta.env.BASE_URL || '/';

  useEffect(() => {
    let alive = true;
    // 有哪些书能整本读 —— 点"出处"时决定是跳整本还是跳到第一段
    fetch(`${base}data/full/index.json`)
      .then(r => (r.ok ? r.json() : { books: {} }))
      .then((j: { books?: Record<string, { title: string }> }) => {
        if (alive) setFullBooks(new Set(Object.values(j.books ?? {}).map(b => b.title)));
      })
      .catch(() => {});
    // 有哪些书能整本读 —— 点"出处"时决定是跳整本还是跳到第一段
    fetch(`${base}data/full/index.json`)
      .then(r => (r.ok ? r.json() : { books: {} }))
      .then((j: { books?: Record<string, { title: string }> }) => {
        if (alive) setFullBooks(new Set(Object.values(j.books ?? {}).map(b => b.title)));
      })
      .catch(() => {});
    fetch(`${base}data/lex/index.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { rows: Row[] }) => { if (alive) setRows(j.rows); })
      .catch(() => { if (alive) setFail(true); });
    return () => { alive = false; };
  }, [base]);

  /* 过滤：搜索 + 首字母 + 词性 + 有例句。词表本身有序，搜索走二分而不是全表扫 */
  const shown = useMemo(() => {
    if (!rows) return [] as Row[];
    let pool = rows;
    const key = q.trim().toLowerCase();

    if (key) {
      // 先二分找到前缀起点，再顺着拿 —— 比 filter 三万多条快一个数量级
      let lo = 0, hi = pool.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pool[mid][0] < key) lo = mid + 1; else hi = mid;
      }
      const out: Row[] = [];
      for (let i = lo; i < pool.length && out.length < 600; i++) {
        if (!pool[i][0].startsWith(key)) break;
        out.push(pool[i]);
      }
      // 前缀没命中就给个包含匹配，别让人以为没这个词
      if (!out.length) {
        for (const r of pool) {
          if (r[0].includes(key)) { out.push(r); if (out.length >= 300) break; }
        }
      }
      pool = out;
    }

    if (letter) pool = pool.filter(r => r[0][0] === letter);
    if (pos) pool = pool.filter(r => r[2].includes(pos));
    if (onlyEx) pool = pool.filter(r => r[3] === 1);
    if (onlyLex) pool = pool.filter(r => mastery[r[0]]?.lex);
    if (onlyCur) pool = pool.filter(r => r[4] === 1);
    return pool;
  }, [rows, q, letter, pos, onlyEx, onlyLex, onlyCur, mastery]);

  const lexCount = useMemo(
    () => Object.values(mastery).filter(m => m.lex).length,
    [mastery],
  );

  /* 顺着出处跳过去：有整本译文就进整本，否则跳到那本书的第一段 */
  const jumpToBook = (title: string) => {
    stopSpeaking();
    if (fullBooks.has(title)) {
      syncRoute('library', `full/${title}`);
      go('library');
      return;
    }
    const first = corpus.articles.find(a => a.s === title);
    if (first) read(first);
  };

  /* 点词 → 取分片 → 存缓存 */
  const open = (w: string) => {
    setWord(w);
    recordLookup(w);
    const ch = w[0];
    const hit = shardCache.current.get(ch);
    if (hit) { setEntry(hit[w] ?? null); return; }
    setLoading(true);
    setEntry(null);
    fetch(`${base}data/lex/${ch}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Record<string, Entry>) => {
        shardCache.current.set(ch, j);
        setEntry(j[w] ?? null);
      })
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const read = () => setBoxH(el.clientHeight);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows]);

  /* 虚拟窗口：只渲染可视区 + 上下各 6 行缓冲 */
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - 6);
  const end = Math.min(shown.length, Math.ceil((scrollTop + boxH) / ROW_H) + 6);
  const slice = shown.slice(start, end);

  useEffect(() => () => stopSpeaking(), []);

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <div className="page lex-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">词库</h1>
          <div className="page-sub">
            {rows ? `${rows.length.toLocaleString()} 个词` : '正在载入词表…'}
            {q && ` · 查到 ${shown.length} 个`}
          </div>
        </div>
        <div className="wb-search">
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setScrollTop(0); }}
            placeholder="查一个词…"
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>

      {lookups?.length ? (
        <div className="wb-recent">
          <span className="wb-recent-key">最近查过</span>
          {lookups.slice(0, 12).map(x => (
            <button key={x.w} className={`wb-recent-word${word === x.w ? ' on' : ''}`} onClick={() => open(x.w)}>
              {x.w}
            </button>
          ))}
        </div>
      ) : null}

      <div className="wb-bar letters">
        <button className={`wb-chip${!letter ? ' on' : ''}`} onClick={() => setLetter('')}>全部</button>
        {letters.map(l => (
          <button
            key={l}
            className={`wb-chip${letter === l ? ' on' : ''}`}
            onClick={() => { setLetter(letter === l ? '' : l); setScrollTop(0); }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="wb-bar">
        {(['n', 'v', 'a', 'r'] as const).map(p => (
          <button
            key={p}
            className={`wb-chip${pos === p ? ' on' : ''}`}
            onClick={() => { setPos(pos === p ? '' : p); setScrollTop(0); }}
          >
            {POS_LABEL[p]}词
          </button>
        ))}
        <button className={`wb-chip${onlyEx ? ' on' : ''}`} onClick={() => { setOnlyEx(v => !v); setScrollTop(0); }}>
          只显示有例句
        </button>
        <button
          className={`wb-chip${onlyCur ? ' on' : ''}`}
          onClick={() => { setOnlyCur(v => !v); setScrollTop(0); }}
          title="带人工例句与用法解析的词条"
        >
          只看精讲
        </button>
        <button
          className={`wb-chip${onlyLex ? ' on' : ''}`}
          onClick={() => { setOnlyLex(v => !v); setScrollTop(0); }}
          title="在词库里收藏的词，同步进藏书阁"
        >
          只看收藏（{lexCount}）
        </button>
      </div>

      {fail ? (
        <div className="empty">词库数据没载入成功，检查一下 public/data/lex/ 是否随构建一起发布。</div>
      ) : !rows ? (
        <div className="empty">正在载入词表…</div>
      ) : (
        <div className="wb-wrap">
          <div
            className="wb-list"
            ref={listRef}
            onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
          >
            <div className="wb-spacer" style={{ height: shown.length * ROW_H }}>
              {slice.map((r, i) => (
                <button
                  key={r[0]}
                  className={`wb-row${word === r[0] ? ' on' : ''}`}
                  style={{ transform: `translateY(${(start + i) * ROW_H}px)`, height: ROW_H }}
                  onClick={() => open(r[0])}
                >
                  <span className="wb-word">{r[0]}</span>
                  <span className="wb-pos">{[...new Set(r[2].split(''))].map(p => POS_LABEL[p] ?? '').join('·')}</span>
                  <span className="wb-freq">{r[1] ? `${r[1]} 次` : '—'}</span>
                  <span className={`wb-ex${r[3] ? ' on' : ''}`}>{r[3] ? '例' : ''}</span>
                </button>
              ))}
            </div>
            {!shown.length && <div className="wb-none">没查到这个词，换个拼写试试</div>}
          </div>

          <aside className="wb-detail">
            {!word ? (
              <div className="wb-tip">
                左边点一个词，右边给释义、音标、例句和同义词。
                <br />
                释义按词性分开列 —— 同一个词在不同上下文里的意思不会混成一句。
              </div>
            ) : loading ? (
              <div className="wb-tip">正在取词条…</div>
            ) : !entry ? (
              <div className="wb-tip">这个词没有词条。</div>
            ) : (
              <div className="wb-entry">
                <div className="wb-entry-head">
                  <h2>{entry.w}</h2>
                  <div className="wb-entry-acts">
                    {(() => {
                      const st = mastery[entry.w];
                      const unknown = !!st && st.m < 60;
                      return (
                        <button
                          className={`btn btn-ghost${unknown ? ' on' : ''}`}
                          onClick={() => markUnknown(entry.w)}
                          title="标记为生词：今晚就会进夜巡复习"
                        >
                          {unknown ? '生词' : '记生词'}
                        </button>
                      );
                    })()}
                    <button
                      className={`btn btn-ghost${mastery[entry.w]?.lex ? ' on' : ''}`}
                      onClick={() => toggleLex(entry.w)}
                      title="收进藏书阁"
                    >
                      {mastery[entry.w]?.lex ? '已收藏' : '收藏'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => speak(entry.w, { accent: useGame.getState().s.voice, rate: 0.9 })}
                      title="读一遍"
                    >
                      发音
                    </button>
                  </div>
                </div>
                {mastery[entry.w] && mastery[entry.w].m < 60 ? (
                  <div className="wb-hint">已记为生词 · 今晚夜巡会复习它</div>
                ) : null}
                <div className="wb-entry-meta">
                  {entry.ipa && <span className="wb-ipa">/{entry.ipa}/</span>}
                  {entry.l && <span>原形 {entry.l}</span>}
                  <span>语料 {entry.f} 次</span>
                </div>

                {entry.senses.map((s, i) => (
                  <div className="wb-sense" key={i}>
                    <div className="wb-sense-head">
                      <em>{POS_LABEL[s.p] ?? s.p ?? '—'}</em>
                      <span>
                        {s.zh && <b className="wb-zh">{s.zh}</b>}
                        {s.d && <i className="wb-en-gloss">{s.d}</i>}
                      </span>
                    </div>
                    {s.x?.map(t => <div className="wb-sense-ex" key={t}>{t}</div>)}
                    {s.s?.length ? (
                      <div className="wb-syn">
                        近义
                        {s.s.map(x => (
                          <button key={x} className="wb-syn-word" onClick={() => open(x)}>{x}</button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                {(entry.up?.length || entry.opp?.length) ? (
                  <div className="wb-rel">
                    {entry.up?.length ? (
                      <div className="wb-rel-row">
                        <span className="wb-rel-key">上位</span>
                        {entry.up.map(x => (
                          <button key={x} className="wb-syn-word" onClick={() => open(x)}>{x}</button>
                        ))}
                      </div>
                    ) : null}
                    {entry.opp?.length ? (
                      <div className="wb-rel-row">
                        <span className="wb-rel-key">反义</span>
                        {entry.opp.map(x => (
                          <button key={x} className="wb-syn-word" onClick={() => open(x)}>{x}</button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {entry.cur ? (
                  <>
                    <div className="wb-sec">精讲 · 用法</div>
                    {entry.cur.note ? <p className="wb-note">{entry.cur.note}</p> : null}
                    {entry.cur.ex?.map(e => (
                      <div className="wb-ex-item wb-ex-cur" key={e.en}>
                        <p className="wb-ex-en">{e.en}</p>
                        <p className="wb-ex-zh">{e.zh}</p>
                      </div>
                    ))}
                  </>
                ) : null}

                {entry.src?.length ? (
                  <>
                    <div className="wb-sec">我在哪读到过它</div>
                    <div className="wb-where">
                      {entry.src.map(([title, n]) => (
                        <button key={title} className="wb-where-row" onClick={() => jumpToBook(title)}>
                          <span>{title}</span>
                          <em>{n} 次</em>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <div className="wb-sec">语料例句</div>
                {entry.ex?.length ? (
                  entry.ex.map(e => (
                    <div className="wb-ex-item" key={e.t}>
                      <p className="wb-ex-en">{e.t}</p>
                      {e.zh && <p className="wb-ex-zh">{e.zh}</p>}
                      {e.src && <span className="wb-ex-src">《{e.src}》</span>}
                    </div>
                  ))
                ) : (
                  <div className="wb-tip">这个词在现有语料里没有出现，例句待补。</div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
