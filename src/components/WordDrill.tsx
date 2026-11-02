import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { editDistance } from '../lib/confuse';
import { asrMessage, asrSupported, createAsr, type AsrHandles } from '../lib/asr';
import { speak, stopSpeaking } from '../lib/speech';
import { useGame } from '../lib/store';

/**
 * 背单词：跟读 / 默写 / 听写。
 *
 * 和夜巡不是一回事。夜巡是「到期了，该复习」，队列由 FSRS 排，用户决定不了练什么；
 * 这里是「我自己想背这一批」，词池就是藏书阁当前筛选出来的那些词。
 * 一个是系统派的活，一个是自己点的菜 —— 所以入口在藏书阁，不在夜巡。
 */
export type DrillMode = 'say' | 'write' | 'listen';

export interface DrillWord {
  w: string;
  z: string;
  p?: string;
  t?: number;
}

const MODES: { id: DrillMode; name: string; desc: string }[] = [
  { id: 'say', name: '跟读', desc: '看词、听音、念出来' },
  { id: 'write', name: '默写', desc: '只看中文，写出英文' },
  { id: 'listen', name: '听写', desc: '只放声音，靠耳朵拼' },
];

const SIZES = [10, 20, 0];   // 0 = 全部

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z'-]/g, '');

/** 洗牌；不依赖 Math.random 的可预测性，这里只需要打散 */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WordDrill({ pool, onExit }: { pool: DrillWord[]; onExit: () => void }) {
  const settings = useGame(s => s.s);
  const review = useGame(s => s.review);

  const [stage, setStage] = useState<'setup' | 'run' | 'done'>('setup');
  const [mode, setMode] = useState<DrillMode>('write');
  const [size, setSize] = useState(10);
  const [queue, setQueue] = useState<DrillWord[]>([]);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [typed, setTyped] = useState('');
  const [hintOn, setHintOn] = useState(false);
  const [heard, setHeard] = useState('');
  const [sayRate, setSayRate] = useState<number | null>(null);
  // 识别过程中的半成品：让用户看见「它在听」，而不是盯着一个不动的按钮
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [marks, setMarks] = useState<{ w: string; ok: boolean }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const rec = useRef<AsrHandles | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSay = useMemo(() => asrSupported(), []);

  const cur = queue[i];
  const sayMode = mode === 'say';

  useEffect(() => () => {
    rec.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (waitTimer.current) clearTimeout(waitTimer.current);
    stopSpeaking();
  }, []);

  /** 进题自动念一遍：听写和跟读都要先有声音 */
  useEffect(() => {
    if (stage !== 'run' || !cur) return;
    if (mode === 'write') return;
    const t = setTimeout(() => speak(cur.w, { accent: settings.voice, rate: mode === 'say' ? 0.9 : 0.8 }), 220);
    return () => clearTimeout(t);
  }, [stage, cur, mode, settings.voice]);

  useEffect(() => {
    if (stage === 'run' && !sayMode) inputRef.current?.focus();
  }, [stage, i, sayMode]);

  const start = (m: DrillMode) => {
    const n = size === 0 ? pool.length : Math.min(size, pool.length);
    setQueue(shuffle(pool).slice(0, n));
    setMode(m);
    setI(0);
    setPhase('ask');
    setTyped('');
    setHintOn(false);
    setHeard('');
    setSayRate(null);
    setMarks([]);
    setMsg(null);
    setStage('run');
  };

  const submit = useCallback((value: string) => {
    if (!cur || phase !== 'ask') return;
    const ok = norm(value) === norm(cur.w);
    setPhase(ok ? 'right' : 'wrong');
    setMarks(ms => [...ms, { w: cur.w, ok }]);
    review(cur.w, ok);
    if (ok) speak(cur.w, { accent: settings.voice, rate: 0.9 });
  }, [cur, phase, review, settings.voice]);

  const next = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    rec.current?.abort();
    stopSpeaking();
    if (i + 1 >= queue.length) { setStage('done'); return; }
    setI(v => v + 1);
    setPhase('ask');
    setTyped('');
    setHintOn(false);
    setHeard('');
    setInterim('');
    setSayRate(null);
    setMsg(null);
    if (waitTimer.current) { clearTimeout(waitTimer.current); waitTimer.current = null; }
  }, [i, queue.length]);

  /* ---------------- 跟读 ---------------- */
  const listen = () => {
    if (!cur) return;
    // 再点一下 = 说完了。不等静音检测，短词经常等不到自动结束
    if (listening) { rec.current?.stop(); return; }
    if (phase !== 'ask') return;

    stopSpeaking();
    setMsg(null);
    setSayRate(null);
    setHeard('');
    setInterim('');

    let settled = false;
    const settle = () => {
      settled = true;
      if (waitTimer.current) { clearTimeout(waitTimer.current); waitTimer.current = null; }
    };

    const h = createAsr({
      accent: settings.voice,
      onInterim: text => setInterim(text),
      onResult: (text, alts) => {
        settle();
        setInterim('');
        setHeard(text);
        // 同一个音识别器可能听成好几个词，全都拿去比对 —— 只看第一个会白白判错
        const cands = [...new Set(
          alts.flatMap(a => a.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean)),
        )];
        const target = norm(cur.w);
        // 长词容一个字母的偏差：识别器对 -ed / -s 尾巴很不稳，不该因此判错
        const hit = cands.some(c => c === target || (target.length >= 5 && editDistance(c, target, 1) <= 1));
        setSayRate(hit ? 1 : 0);
        setPhase(hit ? 'right' : 'wrong');
        setMarks(ms => [...ms, { w: cur.w, ok: hit }]);
        review(cur.w, hit);
        if (hit) {
          speak(cur.w, { accent: settings.voice, rate: 0.9 });
          timer.current = setTimeout(next, 1200);
        }
      },
      onError: code => {
        settle();
        setInterim('');
        if (code !== 'aborted') setMsg(asrMessage(code));
      },
      onEnd: () => {
        setListening(false);
        settle();
      },
    });

    rec.current = h;
    if (!h) { setMsg('这个环境没有语音识别'); return; }
    setListening(true);
    h.start();

    // 一直没动静要说一声：麦克风静音时页面本身是察觉不到的
    waitTimer.current = setTimeout(() => {
      if (!settled) setMsg('还没听到声音 —— 看看系统麦克风是否静音，或在地址栏允许麦克风');
    }, 9000);
  };

  /** 无语音识别环境（桌面端）的跟读：不自欺地打分，只记录「念过了」 */
  const readAloud = () => {
    if (!cur) return;
    setMarks(ms => [...ms, { w: cur.w, ok: true }]);
    next();
  };

  /* ---------------- 设置屏 ---------------- */
  if (stage === 'setup') {
    const n = size === 0 ? pool.length : Math.min(size, pool.length);
    return (
      <div className="wd">
        <div className="wd-top">
          <button className="icon-btn" onClick={onExit} aria-label="退出背单词">✕</button>
          <span className="wd-top-title">背单词</span>
          <span className="wd-top-note">{pool.length} 个词可选</span>
        </div>

        <div className="wd-setup">
          <div className="wd-modes">
            {MODES.map(m => (
              <button
                key={m.id}
                className={`wd-mode${mode === m.id ? ' on' : ''}`}
                onClick={() => setMode(m.id)}
              >
                <b>{m.name}</b>
                <span>{m.desc}</span>
              </button>
            ))}
          </div>

          {mode === 'say' && !canSay && (
            <div className="wd-warn">
              这个环境不能给发音评分（桌面端不支持语音识别）。跟读仍然可用：听一遍、自己念几遍，
              点「念过了」进入下一个词 —— 只是没有机器打分。
            </div>
          )}

          <div className="wd-row">
            <span className="wd-row-label">一局多少词</span>
            <div className="wd-sizes">
              {SIZES.map(s => (
                <button
                  key={s}
                  className={`wd-size${size === s ? ' on' : ''}`}
                  onClick={() => setSize(s)}
                  disabled={s !== 0 && s > pool.length}
                >
                  {s === 0 ? '全部' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="wd-row">
            <span className="wd-row-label">这一局</span>
            <span className="wd-row-val">{n} 个词，随机抽，不重复</span>
          </div>

          <button className="btn btn-primary wd-go" onClick={() => start(mode)} disabled={pool.length === 0}>
            开始
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 结算 ---------------- */
  if (stage === 'done') {
    const right = marks.filter(m => m.ok).length;
    const bad = marks.filter(m => !m.ok);
    const pct = marks.length ? Math.round((right / marks.length) * 100) : 0;
    return (
      <div className="wd">
        <div className="wd-done">
          <div className={`wd-score${pct >= 80 ? ' good' : ''}`}>{pct}<em>%</em></div>
          <div className="wd-done-line">
            {marks.length} 个词里记住 {right} 个
            {bad.length > 0 ? `，${bad.length} 个没写对` : '，全对'}
          </div>

          {bad.length > 0 && (
            <>
            <div className="wd-bads-title">这些没写对 —— 点一下听发音，复习时间也已经提前</div>
            <div className="wd-bads">
              {bad.map((m, k) => {
                const e = pool.find(x => x.w === m.w);
                return (
                  <button key={k} className="wd-bad" onClick={() => speak(m.w, { accent: settings.voice, rate: 0.9 })}>
                    <b>{m.w}</b>
                    <span>{e?.z ?? ''}</span>
                  </button>
                );
              })}
            </div>
            </>
          )}

          <div className="wd-done-acts">
            <button className="btn btn-ghost" onClick={() => setStage('setup')}>换一种练法</button>
            <button className="btn btn-primary" onClick={() => start(mode)}>再来一局</button>
            <button className="btn btn-ghost" onClick={onExit}>回藏书阁</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 答题 ---------------- */
  if (!cur) return null;
  const blank = cur.w.replace(/[a-z]/gi, '_').replace(/(_)/g, '$1 ').trim();

  return (
    <div className="wd">
      <div className="wd-top">
        <button className="icon-btn" onClick={onExit} aria-label="退出背单词">✕</button>
        <span className="wd-top-title">{MODES.find(m => m.id === mode)?.name}</span>
        <span className="wd-top-note">{i + 1} / {queue.length}</span>
        <div className="wd-dots">
          {queue.map((_, k) => (
            <i key={k} className={marks[k] ? (marks[k].ok ? ' ok' : ' no') : ''} />
          ))}
        </div>
      </div>

      <div className="wd-body">
        {/* 跟读：给全词和音标，练的是嘴 */}
        {sayMode && (
          <>
            <div className="wd-word">{cur.w}</div>
            {cur.p && <div className="wd-ipa">/{cur.p}/</div>}
            <div className="wd-zh">{cur.z}</div>

            <button className="wd-speak" onClick={() => speak(cur.w, { accent: settings.voice, rate: 0.8 })}>
              🔊 再听一遍
            </button>

            {canSay ? (
              phase === 'ask' ? (
                <>
                  <button
                    className={`wd-mic${listening ? ' on' : ''}`}
                    onClick={listen}
                    aria-label={listening ? '结束并提交' : '开始跟读'}
                  >
                    {listening ? '说完了 · 点一下结束' : '点一下，念出来'}
                  </button>
                  {listening && (
                    <div className="wd-hearing">
                      {interim ? <>听到：<b>{interim}</b>…</> : '正在听…'}
                    </div>
                  )}
                </>
              ) : (
                <div className={`wd-say${sayRate ? ' ok' : ' no'}`}>
                  {sayRate ? '听清了' : <>没听清{heard ? <em>（识别成：{heard}）</em> : null}</>}
                </div>
              )
            ) : (
              <button className="wd-mic" onClick={readAloud}>念过了，下一个</button>
            )}
          </>
        )}

        {/* 默写：只给中文，练的是拼写 */}
        {mode === 'write' && (
          <>
            <div className="wd-zh-big">{cur.z}</div>
            <div className="wd-sub">看中文，写出这个词</div>
            {phase === 'right' ? (
              <div className="wd-word done">{cur.w}</div>
            ) : phase === 'wrong' ? (
              <div className="wd-word done">{cur.w}</div>
            ) : (
              <>
                <div className="wd-blank">{hintOn ? `${cur.w[0]}${' _'.repeat(cur.w.length - 1)}` : blank}</div>
                {!hintOn && <button className="wd-hint" onClick={() => setHintOn(true)}>给个首字母</button>}
              </>
            )}
          </>
        )}

        {/* 听写：只给声音，练的是耳朵 */}
        {mode === 'listen' && (
          <>
            <button className="wd-big-speak" onClick={() => speak(cur.w, { accent: settings.voice, rate: 0.8 })}>
              🔊
              <span>点一下再听</span>
            </button>
            <div className="wd-sub">听发音，把词拼出来</div>
            {phase !== 'ask' && (
              <>
                <div className="wd-word done">{cur.w}</div>
                <div className="wd-zh">{cur.z}</div>
              </>
            )}
          </>
        )}

        {!sayMode && (
          <input
            ref={inputRef}
            className={`wd-input${phase === 'right' ? ' ok' : phase === 'wrong' ? ' no' : ''}`}
            value={typed}
            readOnly={phase !== 'ask'}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            placeholder="拼出来，回车确认"
            onChange={e => { if (phase === 'ask') setTyped(e.target.value); }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (phase === 'ask') submit(typed);
                else next();
              }
            }}
          />
        )}

        {phase === 'wrong' && !sayMode && (
          <div className="wd-fix">
            你写的是 <s>{typed || '（空）'}</s>
          </div>
        )}

        {msg && <div className="wd-msg">{msg}</div>}
      </div>

      <div className="wd-foot">
        {sayMode ? (
          <>
            <button className="wd-link" onClick={() => speak(cur.w, { accent: settings.voice, rate: 0.8 })}>再听一遍</button>
            <button className="wd-link" onClick={next}>下一个</button>
            <span className="wd-foot-hint">识别在本机做，录音不上传</span>
          </>
        ) : phase === 'ask' ? (
          <span className="wd-foot-hint">回车提交 · 写不出就空着回车，直接看答案</span>
        ) : (
          <button className="btn btn-primary" onClick={next}>
            {i + 1 >= queue.length ? '看结果' : '下一个'}
            <span className="kbd">Enter</span>
          </button>
        )}
      </div>
    </div>
  );
}
