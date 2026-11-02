import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEVEL_TITLE } from '../lib/levels';
import { useCorpus } from '../lib/CorpusContext';
import { tokenize } from '../lib/data';
import { splitSentences } from '../lib/sentences';
import { buildCloze, isCorrect, pickClozeArticle } from '../lib/cloze';
import { useGame } from '../lib/store';
import { speak } from '../lib/speech';
import { translationsFor } from '../lib/trans';



type Doc = ReturnType<typeof buildCloze>;

export function ClozeScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const setSetting = useGame(s => s.setSetting);
  const applyCloze = useGame(s => s.applyCloze);
  const go = useGame(s => s.go);

  const [lv, setLv] = useState(() => Math.min(7, Math.max(1, p.unlocked)));
  const [seedTick, setSeedTick] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(0);
  const [tr, setTr] = useState<string[] | null>(null);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  /* 选题：在所选城区里挑一篇能出题的（跳过几乎全是虚词的） */
  const picked = useMemo(() => {
    const pool = (corpus.byLevel[lv] ?? []).slice();
    // 用种子打散顺序，同一篇不会连着出现
    const seed = `${lv}:${seedTick}`;
    const start = pool.length ? Math.abs(hash(seed)) % pool.length : 0;
    const rotated = [...pool.slice(start), ...pool.slice(0, start)];
    return pickClozeArticle({
      candidates: rotated,
      tokensOf: t => tokenize(corpus, t),
      sentencesOf: t => splitSentences(t),
      names: corpus.names,
      dict: corpus.dict as unknown as Map<string, { z?: string; t?: number }>,
      mastery: p.mastery,
      seed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpus, lv, seedTick]);

  const doc: Doc | null = picked?.doc ?? null;
  const article = picked?.article ?? null;

  const reset = useCallback(() => {
    setAnswers({});
    setRevealed({});
    setDone(false);
  }, []);

  useEffect(() => { reset(); }, [doc, reset]);

  /* 当前文章的中文译文：填空最难的是"这句在说什么"，译文比单词释义有用 */
  useEffect(() => {
    setTr(null);
    if (!article) return;
    let alive = true;
    void translationsFor(article.id).then(t => { if (alive) setTr(t); });
    return () => { alive = false; };
  }, [article]);



  useEffect(() => {
    if (done) return;
    const first = doc?.blanks.findIndex((_, i) => !answers[i]);
    if (first != null && first >= 0) inputs.current[first]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  if (!article || !doc || doc.count === 0) {
    return (
      <div className="cloze">
        <div className="page-head">
          <div>
            <h1 className="page-title">阅读填空</h1>
            <div className="page-sub">这个城区暂时没有能出题的文章</div>
          </div>
        </div>
      </div>
    );
  }

  const blanks = doc.blanks;
  const sentenceZh = tr?.[blanks[active]?.sentence ?? -1] ?? null;
  const filled = blanks.filter((_, i) => (answers[i] ?? '').trim().length > 0).length;
  const results = blanks.map((b, i) => isCorrect(b, answers[i] ?? ''));
  const right = results.filter(Boolean).length;

  const submit = () => {
    if (done) return;
    setDone(true);
    applyCloze(blanks.map((b, i) => ({ word: b.key, ok: isCorrect(b, answers[i] ?? '') })));
  };

  const nextBlank = (i: number) => {
    for (let k = i + 1; k < blanks.length; k++) {
      if (!(answers[k] ?? '').trim()) { inputs.current[k]?.focus(); return; }
    }
    submit();
  };

  const hintText = (i: number) => {
    const b = blanks[i];
    if (settings.clozeHint === 'none') return '';
    if (settings.clozeHint === 'first') return b.firstChar;
    return `${b.firstChar}…（${b.zh}）`;
  };

  return (
    <div className="cloze">
      <div className="page-head">
        <div>
          <h1 className="page-title">阅读填空</h1>
          <div className="page-sub">
            {LEVEL_TITLE[article.lv]} · {article.s} · {blanks.length} 个空
          </div>
        </div>
        <div className="cloze-tools">
          <select
            className="cloze-lv"
            value={lv}
            onChange={e => setLv(Number(e.target.value))}
            aria-label="选择城区"
          >
            {Array.from({ length: Math.min(7, Math.max(1, p.unlocked)) }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{LEVEL_TITLE[n]}</option>
            ))}
          </select>
          <div className="seg">
            {([['none', '无提示'], ['first', '首字母'], ['both', '首字母+释义']] as const).map(([v, label]) => (
              <button
                key={v}
                className={settings.clozeHint === v ? 'on' : ''}
                onClick={() => setSetting('clozeHint', v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cloze-progress">
        <span className={filled === blanks.length ? 'done' : ''}>{filled} / {blanks.length}</span>
        <i><b style={{ width: `${(filled / blanks.length) * 100}%` }} /></i>
      </div>

      <article className="cloze-body">
        {doc.segments.map((seg, k) => {
          if ('text' in seg) return <span key={k}>{seg.text}</span>;
          const i = seg.blank;
          const b = blanks[i];
          const ok = results[i];
          const show = done;
          const reveal = revealed[i] || settings.clozeHint !== 'none';
          return (
            <span key={k} className="cloze-slot">
              <input
                ref={el => { inputs.current[i] = el; }}
                className={`cloze-input${show ? (ok ? ' ok' : ' bad') : ''}`}
                style={{ width: `${Math.max(3, b.answer.length)}ch` }}
                value={answers[i] ?? ''}
                disabled={done}
                spellCheck={false}
                autoComplete="off"
                placeholder={reveal ? hintText(i) : ''}
                onFocus={() => setActive(i)}
                onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); nextBlank(i); }
                }}
              />
              {/* 「完整提示」档已经把首字母和释义放进 placeholder 了，再给 ? 只是噪音 */}
              {!done && settings.clozeHint === 'first' && !revealed[i] && (
                <button
                  className="cloze-eye"
                  title="看提示"
                  onClick={() => setRevealed(r => ({ ...r, [i]: true }))}
                >
                  ?
                </button>
              )}
              {show && !ok && <em className="cloze-answer">{b.answer}</em>}
            </span>
          );
        })}
      </article>

      {!done && sentenceZh && settings.clozeHint === 'both' && (
        <div className="cloze-sentence">
          <span>第 {(blanks[active]?.sentence ?? 0) + 1} 句</span>
          {sentenceZh}
        </div>
      )}

      {!done ? (
        <div className="cloze-foot">
          <button className="btn btn-ghost" onClick={() => { setSeedTick(t => t + 1); }}>
            换一篇
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={filled === 0}>
            提交 {filled}/{blanks.length}
          </button>
        </div>
      ) : (
        <div className="cloze-result">
          <div className="cr-score">
            <b>{right}</b> / {blanks.length}
            <span>正确率 {Math.round((right / blanks.length) * 100)}%</span>
          </div>
          {right < blanks.length && (
            <div className="cr-words">
              {blanks.filter((_, i) => !results[i]).map((b, i) => (
                <button key={b.key + i} className="cr-word" onClick={() => speak(b.answer, { accent: settings.voice, rate: settings.rate })}>
                  <b>{b.answer}</b>
                  <span>{b.zh}</span>
                </button>
              ))}
            </div>
          )}
          <div className="cr-actions">
            <button className="btn btn-ghost" onClick={() => { setSeedTick(t => t + 1); }}>再来一篇</button>
            <button className="btn btn-primary" onClick={() => go('review')}>去夜巡巩固</button>
          </div>
          <div className="cr-note">填错的词已排进今晚的夜巡</div>
        </div>
      )}
    </div>
  );
}

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
