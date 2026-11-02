import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { lookup, masteryOf, tokenize, type Corpus, type Token } from '../lib/data';
import { LEVEL_NAME } from '../lib/levels';
import { splitSentences } from '../lib/sentences';
import { speak, stopSpeaking } from '../lib/speech';
import { useGame } from '../lib/store';
import { translationsFor } from '../lib/trans';
import { WordCard } from '../components/WordCard';

/**
 * 阅读页：先把文章看完，再决定要不要打。
 *
 * 文库原来点一行直接进打字页 —— 想「先看看这篇讲什么」的用户没有办法，
 * 只能进打字页看着一屏黑字发愣，或者去点词卡。阅读是独立的一件事，
 * 它需要的是完整全文、句末译文和可以停留的节奏，不是倒计时和连击。
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
  const [trTried, setTrTried] = useState(false);
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
  const entry = lookup(corpus, card?.key ?? '');

  return (
    <div className="page rd">
      <div className="page-head rd-head">
        <div className="rd-head-main">
          <button className="icon-btn" onClick={() => go('library')} title="回文库">←</button>
          <div>
            <h1 className="page-title rd-title">
              {article.s}
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
          <button className="btn btn-primary" onClick={() => play(article)}>开始打字</button>
        </div>
      </div>

      {showZh && trTried && !tr && (
        <div className="rd-notice">这篇还没有译文，只显示原文。点句子可以听读音，点词可以看释义。</div>
      )}

      <article className="rd-body">
        {sents.map((s, i) => (
          <div className="rd-sent" key={s.start}>
            <p className="rd-en" onClick={() => speakLine(s.text)} title="点这一句可以朗读">
              {renderLine(article.tx, s.start, s.end, perSent[i], corpus, p.mastery, onWord)}
            </p>
            {showZh && tr?.[i] && <p className="rd-zh">{tr[i]}</p>}
          </div>
        ))}
      </article>

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
