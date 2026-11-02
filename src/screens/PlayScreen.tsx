import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextStage, type StageHandle } from '../components/TextStage';
import { WordCard } from '../components/WordCard';
import { PreTeach } from '../components/PreTeach';
import { TypingEngine, ghostIndex } from '../engine/TypingEngine';
import { useCorpus } from '../lib/CorpusContext';
import { lookup, newWordRate, priorOf, tokenize } from '../lib/data';
import { glossOf, sentenceAt, splitSentences } from '../lib/sentences';
import { translationsFor } from '../lib/trans';
import { useGame } from '../lib/store';
import { speak, stopSpeaking } from '../lib/speech';
import { errorThud, keyClick, resonant, setMuted } from '../lib/sfx';
import type { RunResult } from '../lib/types';

export const TARGET_WPM = [0, 26, 30, 36, 42, 48, 54, 60];
const LEVEL_NAME = ['', 'A1.1', 'A1.2', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface CardState {
  key: string;
  surface: string;
  anchor: { x: number; y: number; w: number; b: number };
  saved: boolean;
}

export function PlayScreen() {
  const corpus = useCorpus();
  const article = useGame(s => s.article)!;
  const settings = useGame(s => s.s);
  const progress = useGame(s => s.p);
  const finish = useGame(s => s.finish);
  const go = useGame(s => s.go);
  const markUnknown = useGame(s => s.markUnknown);
  const toggleLex = useGame(s => s.toggleLex);
  const reviewWord = useGame(s => s.review);
  const pushToast = useGame(s => s.pushToast);

  const [runId, setRunId] = useState(0);
  const [card, setCard] = useState<CardState | null>(null);
  const [paused, setPaused] = useState(false);
  const [tip, setTip] = useState<{ key: string; x: number; y: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [reading, setReading] = useState(false);
  const [sIdx, setSIdx] = useState(0);
  const [tr, setTr] = useState<string[] | null>(null);
  // 预习卡：每篇只弹一次，跳过或做完都记为 done
  const [preDone, setPreDone] = useState(false);

  const stageRef = useRef<StageHandle>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const accRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const pausedRef = useRef(false);

  const engine = useMemo(() => {
    const toks = tokenize(corpus, article.tx);
    return new TypingEngine(article.tx, toks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, corpus, runId]);

  const engineRef = useRef(engine);
  engineRef.current = engine;

  const sents = useMemo(() => splitSentences(article.tx), [article]);
  const sentsRef = useRef(sents);
  sentsRef.current = sents;
  const sIdxRef = useRef(0);

  const gloss = useMemo(
    () => (sents[sIdx] ? glossOf(corpus, sents[sIdx].text, progress.mastery) : []),
    [corpus, sents, sIdx, progress.mastery]
  );

  useEffect(() => {
    setTr(null);
    setSIdx(0);
    sIdxRef.current = 0;
    if (settings.sentenceHelp === 'both') void translationsFor(article.id).then(setTr);
  }, [article.id, settings.sentenceHelp]);

  const vocab = newWordRate(corpus, article, progress.mastery);
  // 只挑词库里有中文释义的词 —— 没有释义就无从回忆，预习卡会变成一张空牌
  const preWords = useMemo(
    () => vocab.unknown.filter(w => corpus.dict.get(w)?.z),
    [vocab.unknown, corpus]
  );
  // 幽灵竞速默认关闭：它每帧都在动，不清楚来历的人会以为光标坏了
  const ghost = settings.ghost ? progress.ghost[article.id] : undefined;
  const ghostLabel = useMemo(() => (ghost ? agoText(ghost.at) : ''), [ghost]);
  const prevWpm = progress.bestWpm[article.id] ?? null;

  pausedRef.current = paused || !!card || doneRef.current;

  useEffect(() => {
    setMuted(!settings.sound);
  }, [settings.sound]);

  /* 实时朗读：打完一个整词就念一遍，节流避免 TTS 排队卡顿 */
  useEffect(() => {
    let last = 0;
    engine.onWordEnd = (key) => {
      if (!settings.autoSpeak || key.length < 3) return;
      const now = performance.now();
      if (now - last < 260) return;
      last = now;
      speak(key, { accent: settings.voice, rate: settings.rate });
    };
    return () => { engine.onWordEnd = undefined; };
  }, [engine, settings.autoSpeak, settings.voice, settings.rate]);

  /* ----------------- 输入 ----------------- */
  const buildResult = useCallback((): RunResult => {
    const e = engineRef.current;
    const detail: Record<string, { ok: number; er: number; p: number }> = {};
    const perKey = new Map<string, { ok: number; er: number }>();
    e.words.forEach((w, i) => {
      const cur = perKey.get(w.key) ?? { ok: 1, er: 0 };
      if (e.wordErr[i] > 0) { cur.ok = 0; cur.er += e.wordErr[i]; }
      perKey.set(w.key, cur);
    });
    // 全文每个词都记掌握度（不只是"新词"），否则词汇量永远不涨
    for (const [k, v] of perKey) detail[k] = { ...v, p: priorOf(corpus, k) };

    const newWords: string[] = [];
    for (const k of perKey.keys()) {
      const m = progress.mastery[k]?.m ?? 0;
      if (m < 40 && (corpus.dict.get(k)?.t ?? 1) >= 2 && newWords.length < 14) newWords.push(k);
    }

    const errorWords = [...e.wordError].map(i => e.words[i]?.key).filter(Boolean) as string[];
    const wpm = e.wpm();
    const acc = e.acc();
    const target = TARGET_WPM[article.lv] ?? 30;
    const stars = acc >= 98 && wpm >= target ? 3 : acc >= 95 ? 2 : 1;

    const charErr: Record<string, number> = {};
    for (const [k, n] of e.charErr) charErr[k] = n;

    return {
      articleId: article.id,
      lv: article.lv,
      wpm,
      raw: e.raw(),
      acc,
      consistency: e.consistency(),
      elapsed: e.elapsed(),
      errors: e.errors,
      stars,
      charErr,
      newWords,
      errorWords: [...new Set(errorWords)],
      detail,
      marks: e.tokenMarks(),
      beatGhost: prevWpm != null && wpm > prevWpm,
      prevWpm,
    };
  }, [article, corpus, prevWpm, progress.mastery]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === 'Escape') {
        if (card) return;
        if (!doneRef.current) setPaused(p => !p);
        return;
      }
      if (pausedRef.current) {
        if (ev.key === 'Enter' && paused) setPaused(false);
        return;
      }
      const e = engineRef.current;
      if (ev.key === 'Backspace') {
        ev.preventDefault();
        if (e.backspace()) {
          stageRef.current?.sync();
          setStarted(e.idx > 0 || e.attempts > 0);
        }
        return;
      }
      if (ev.key.length !== 1) return;
      ev.preventDefault();
      if (ev.repeat) return;   // 长按连发不计分

      const r = e.input(ev.key);
      if (r === 'err') {
        errorThud();
      } else {
        keyClick();
        if (e.combo > 0 && e.combo % 30 === 0) resonant(e.combo / 30);
      }
      if (!started && r !== 'err') {
        setStarted(true);
        if (hintRef.current) hintRef.current.style.opacity = '0';
      }
      stageRef.current?.sync();
      if (r === 'end') {
        doneRef.current = true;
        window.setTimeout(() => finish(buildResult()), 520);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [buildResult, card, finish, paused, started]);

  /* ----------------- 防粘贴 / 输入法 ----------------- */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      pushToast('记述者不用抄的 —— 请自己敲');
    };
    const onComp = () => pushToast('检测到中文输入法，请按 Shift 切到英文');
    window.addEventListener('paste', onPaste);
    document.addEventListener('compositionstart', onComp);
    return () => {
      window.removeEventListener('paste', onPaste);
      document.removeEventListener('compositionstart', onComp);
    };
  }, [pushToast]);

  /* ----------------- HUD 循环 ----------------- */
  useEffect(() => {
    let raf = 0;
    let frame = 0;
    const loop = () => {
      const e = engineRef.current;
      if (e) {
        if (frame % 5 === 0) {
          if (comboRef.current) comboRef.current.textContent = String(e.combo);
          if (accRef.current) accRef.current.innerHTML = `${e.acc().toFixed(1)}<small>%</small>`;
          if (progRef.current) progRef.current.style.width = `${(e.idx / e.length) * 100}%`;
          if (clockRef.current) {
            const s = Math.floor(e.elapsed() / 1000);
            clockRef.current.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
          }
          if (railRef.current) {
            const pct = Math.min(e.combo / 150, 1);
            railRef.current.style.height = `${pct * 36}vh`;
            railRef.current.classList.toggle('on', e.combo >= 30);
          }
        }
        if (ghost) {
          const gi = ghostIndex(ghost.marks, e.elapsed());
          stageRef.current?.ghost(gi);
        }
        const si = sentenceAt(sentsRef.current, e.idx);
        if (si !== sIdxRef.current) {
          sIdxRef.current = si;
          setSIdx(si);
        }
      }
      frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ghost]);

  /* ----------------- 交互 ----------------- */
  const tipTimer = useRef<number | undefined>(undefined);
  const onHover = (el: HTMLElement | null, key: string) => {
    window.clearTimeout(tipTimer.current);
    if (!el) { setTip(null); return; }
    tipTimer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      setTip({ key, x: r.left + r.width / 2, y: r.top - 52 });
    }, 280);
  };

  const onWordClick = (el: HTMLElement, key: string, raw: string) => {
    const r = el.getBoundingClientRect();
    engineRef.current.pause();
    setCard({
      key,
      surface: raw,
      anchor: { x: r.left, y: r.top, w: r.width, b: r.bottom },
      saved: !!progress.mastery[key]?.lex,
    });
    markUnknown(key);
    setTip(null);
  };

  const closeCard = () => {
    setCard(null);
    engineRef.current.resume();
  };

  const toggleRead = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
      return;
    }
    setReading(true);
    speak(article.tx, {
      accent: settings.voice,
      rate: settings.rate,
      onEnd: () => setReading(false),
    });
  };

  /* 离开这个页面就闭嘴 —— speechSynthesis 是全局的，不主动取消会一直念 */
  useEffect(() => () => { stopSpeaking(); }, []);

  const restart = () => {
    stopSpeaking();
    setReading(false);
    doneRef.current = false;
    setStarted(false);
    setCard(null);
    setPaused(false);
    setRunId(v => v + 1);
    if (hintRef.current) hintRef.current.style.opacity = '1';
  };

  const entry = lookup(corpus, card?.key ?? '');
  const tipEntry = tip ? lookup(corpus, tip.key) : null;

  return (
    <div className="play">
      <div className="tbar">
        <button className="icon-btn" onClick={() => go('map')} title="返回地图">←</button>
        <span className="ttl">
          {article.s}
          {article.ord && article.tot ? <em className="ttl-part">· 第 {article.ord}/{article.tot} 段</em> : null}
        </span>
        <span className="pill-badge">{LEVEL_NAME[article.lv]}</span>
        {vocab.unknown.length > 0 && (
          <span className="pill-badge rare">生词 {vocab.unknown.length}</span>
        )}
        <div className="right">
          <span className="clock" ref={clockRef}>00:00</span>
          <button
            className={`icon-btn${reading ? ' reading' : ''}`}
            onClick={toggleRead}
            title={reading ? '停止朗读' : '朗读全文'}
          >
            {reading ? '⏹' : '🔊'}
          </button>
          <button className="icon-btn" onClick={restart} title="重开">↻</button>
          <button className="icon-btn" onClick={() => setPaused(true)} title="暂停">⏸</button>
        </div>
      </div>

      <div className="stage-area">
        <div className="rail" ref={railRef} />
        <div className="metrics">
          <div>
            <div className="k">COMBO</div>
            <div className="v" ref={comboRef}>0</div>
          </div>
          <div>
            <div className="k">ACCURACY</div>
            <div className="v" ref={accRef}>100<small>%</small></div>
          </div>
        </div>

        <div className="stage-col">
        <TextStage
          ref={stageRef}
          engine={engine}
          ghost={ghost ? 0 : -1}
          ghostLabel={ghostLabel}
          onWordClick={onWordClick}
          onWordHover={onHover}
        />

        {!started && (
          <div className="hint" ref={hintRef}>
            直接开始打字 · <b>点任意词</b>看释义与发音
          </div>
        )}

        {settings.sentenceHelp !== 'off' && (
          <div className="sx">
            {settings.sentenceHelp === 'both' && tr?.[sIdx] && (
              <div className="sx-tr">{tr[sIdx]}</div>
            )}
            <div className="sx-words">
              {gloss.length === 0 ? (
                <span className="sx-none">本句没有生词</span>
              ) : (
                gloss.map(g => (
                  <button
                    key={g.key}
                    className="sx-w"
                    onClick={() => speak(g.surface, { accent: settings.voice, rate: settings.rate })}
                    title={g.ipa ? `/${g.ipa}/` : undefined}
                  >
                    <b>{g.surface}</b>
                    <span>{g.zh}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="progress"><i ref={progRef} /></div>
      <div className="fbar">
        <div className="l">
          <span>{article.w} 词 · {article.st} 句</span>
          <span>目标 {TARGET_WPM[article.lv]} WPM</span>
        </div>
        <div className="l">
          {prevWpm ? <span>幽灵 <b>{prevWpm} WPM</b></span> : <span>首次挑战</span>}
          <span>剩 {Math.max(0, article.w - Math.round((engine.idx / engine.length) * article.w))} 词</span>
        </div>
      </div>

      {tip && tipEntry && (
        <div className="ttip" style={{ left: Math.min(tip.x, window.innerWidth - 220), top: tip.y }}>
          <div>
            <span className="w">{tip.key}</span>
            <span className="p">{tipEntry.p ? `/${tipEntry.p}/` : ''}</span>
          </div>
          <div className="z">{(tipEntry.z || '').split('\n')[0]}</div>
        </div>
      )}

      {card && (
        <WordCard
          word={card.key}
          surface={card.surface}
          entry={entry}
          anchor={card.anchor}
          saved={card.saved}
          onClose={closeCard}
          onSave={() => {
            toggleLex(card.key);
            setCard({ ...card, saved: !card.saved });
          }}
        />
      )}

      {paused && (
        <div className="modal-mask" onClick={() => setPaused(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>暂停</h3>
            <p>
              计时已停止。已经敲完 {Math.round((engine.idx / engine.length) * 100)}%，还剩{' '}
              {Math.max(0, Math.round((1 - engine.idx / engine.length) * article.w))} 个词。
            </p>
            <div className="row">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => go('map')}>回地图</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setPaused(false)}>继续</button>
            </div>
          </div>
        </div>
      )}

      {/* 先测后学：进正文前把本篇生词过一遍。只在本篇有 3 个以上生词时出现 */}
      {!preDone && settings.pretest && preWords.length >= 2 && !paused && (
        <PreTeach
          key={`pre-${article.id}-${runId}`}
          words={preWords}
          onDone={(res) => {
            for (const r of res) reviewWord(r.word, r.ok);
            setPreDone(true);
          }}
        />
      )}
    </div>
  );
}

/**
 * 幽灵标签：「3 分钟前」比「昨天」诚实。
 *
 * 原来的标签是 CSS 里写死的 `content: '昨天'` —— 十分钟前刚打过的也显示「昨天」，
 * 而且 GhostFrame 当时根本没存时间，想说实话也没有依据。
 */
function agoText(iso?: string): string {
  if (!iso) return '上次';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '上次';
  const min = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d === 1) return '昨天';
  if (d < 7) return `${d} 天前`;
  if (d < 30) return `${Math.floor(d / 7)} 周前`;
  return `${Math.floor(d / 30)} 个月前`;
}
