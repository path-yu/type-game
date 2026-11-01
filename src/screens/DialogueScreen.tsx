import { useEffect, useMemo, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../lib/speech';
import { useCorpus } from '../lib/CorpusContext';
import { useGame } from '../lib/store';
import {
  diff, errorWords, initials, linesOf, maskOf, scoreSay, validate, yourLines,
  type DBank, type Role, type SayResult, type Scene,
} from '../lib/dialogue';
import { asrMessage, asrSupported, createAsr, type AsrHandles } from '../lib/asr';

const BASE = import.meta.env.BASE_URL || '/';

/** 语料只有一份，切页不重复拉 */
let cache: DBank | null = null;

type Mode = 'read' | 'copy' | 'recall' | 'speak';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'read', label: '通读', hint: '看懂这场对话，点句子听发音' },
  { id: 'copy', label: '跟打', hint: '照着打你的台词，练到手指记住' },
  { id: 'recall', label: '背打', hint: '只看中文，把英文说出来' },
  { id: 'speak', label: '跟读', hint: '对着麦克风说这句话，看它能不能听懂' },
];

export function DialogueScreen() {
  const p = useGame(s => s.p);
  const finishScene = useGame(s => s.finishScene);
  const [bank, setBank] = useState<DBank | null>(cache);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    fetch(`${BASE}data/dialogues.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: DBank) => {
        const bad = validate(j);
        if (bad.length) console.warn('[dialogue] 语料有问题：', bad);
        cache = j;
        setBank(j);
      })
      .catch(e => setErr(String(e.message ?? e)));
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  const scene = bank?.scenes.find(s => s.id === openId) ?? null;
  const done = bank ? bank.scenes.filter(s => p.scenes[s.id]).length : 0;

  if (err) {
    return (
      <div className="dg">
        <div className="page-head">
          <div>
            <h1 className="page-title">场景对话</h1>
            <div className="page-sub">语料加载失败：{err}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="dg">
        <div className="page-head">
          <div>
            <h1 className="page-title">场景对话</h1>
            <div className="page-sub">正在载入对话…</div>
          </div>
        </div>
      </div>
    );
  }

  if (scene) {
    return (
      <SceneView
        key={scene.id}
        scene={scene}
        onBack={() => { stopSpeaking(); setOpenId(null); }}
        onFinish={(score, words, r) => finishScene(scene.id, score, words, r)}
      />
    );
  }

  return (
    <div className="dg">
      <div className="page-head">
        <div>
          <h1 className="page-title">场景对话</h1>
          <div className="page-sub">
            {bank.scenes.length} 个真实场合 · 已练 <em className="dg-em">{done}</em> 场 ·
            背打时打错的词，当晚进夜巡
          </div>
        </div>
      </div>

      <div className="dg-grid">
        {bank.scenes.map(sc => {
          const stat = p.scenes[sc.id];
          const mine = yourLines(sc).length;
          return (
            <button key={sc.id} className={`dg-card${stat ? ' done' : ''}`} onClick={() => setOpenId(sc.id)}>
              <div className="dg-card-top">
                <span className="dg-cat">{sc.cat}</span>
                <span className="dg-cefr">{sc.cefr}</span>
                {stat && (
                  <span
                    className="dg-check"
                    title={stat.swapBest != null ? '两个角色都练过' : `最好 ${stat.best}%`}
                  >
                    {stat.swapBest != null ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
              <div className="dg-name">{sc.name}</div>
              <div className="dg-set">{sc.setting}</div>
              <div className="dg-card-foot">
                <span>{mine} 句你的台词 · {sc.phrases.length} 个句型</span>
                <span className="dg-bests">
                  {stat && stat.best > 0 && <em className="dg-best">最好 {stat.best}%</em>}
                  {stat?.swapBest != null && <em className="dg-best swap">换角 {stat.swapBest}%</em>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SceneView({
  scene,
  onBack,
  onFinish,
}: {
  scene: Scene;
  onBack: () => void;
  onFinish: (score: number, words: { w: string; ok: boolean }[], role: Role) => void;
}) {
  const settings = useGame(s => s.s);
  const corpus = useCorpus();
  const known = useMemo(() => (w: string) => !!corpus.dict.get(w)?.z, [corpus]);
  const [mode, setMode] = useState<Mode>('read');
  const [role, setRole] = useState<Role>('you');
  const nYou = linesOf(scene, 'you').length;
  const nOther = scene.lines.length - nYou;
  const otherName = scene.roles[1 - scene.you] ?? '对方';

  return (
    <div className="dg dg-scene">
      <div className="dg-scene-head">
        <button className="dg-back" onClick={onBack}>‹ 全部场景</button>
        <div className="dg-scene-meta">
          <h1 className="page-title">{scene.name}</h1>
          <div className="page-sub">
            {scene.cat} · {scene.cefr} · {scene.lines.length} 句 · 对方是{scene.roles[1 - scene.you] ?? '对话方'}
          </div>
        </div>
        <div className="seg dg-tabs">
          {MODES.map(m => (
            <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => { stopSpeaking(); setMode(m.id); }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dg-setting">{scene.setting}</div>

      {/* 角色互换：练对方的话，才逼自己先听懂再开口 */}
      {mode !== 'read' && (
        <div className="dg-roles">
          <span className="dg-roles-label">练谁</span>
          <div className="seg">
            <button className={role === 'you' ? 'on' : ''} onClick={() => setRole('you')}>
              你 · {nYou} 句
            </button>
            <button className={role === 'other' ? 'on' : ''} onClick={() => setRole('other')}>
              {otherName} · {nOther} 句
            </button>
          </div>
          <span className="dg-roles-hint">
            {role === 'other' ? '换角：先听懂对方说什么，再替他说出来' : '默认练你自己的台词'}
          </span>
        </div>
      )}

      {mode === 'read' && <Reader scene={scene} accent={settings.voice} rate={settings.rate} />}

      {mode === 'speak' && (
        <Speak
          scene={scene}
          accent={settings.voice}
          rate={settings.rate}
          known={known}
          role={role}
          onExit={onBack}
          onType={() => setMode('copy')}
          onFinish={(score, words) => onFinish(score, words, role)}
        />
      )}

      {(mode === 'copy' || mode === 'recall') && (
          <Drill
            key={`${mode}-${role}`}
            scene={scene}
            mode={mode}
            accent={settings.voice}
            rate={settings.rate}
            known={known}
            role={role}
            onExit={onBack}
            onFinish={(score, words) => onFinish(score, words, role)}
          />
      )}
    </div>
  );
}

/* ---------------------------- 通读 ---------------------------- */

function Reader({ scene, accent, rate }: { scene: Scene; accent: 'us' | 'uk'; rate: number }) {
  const [at, setAt] = useState(-1);
  const stop = useRef(false);

  useEffect(() => () => { stop.current = true; }, []);

  const say = (en: string) => {
    stop.current = true;   // 手动点一句就打断连播
    setAt(-1);
    speak(en, { accent, rate });
  };

  const playAll = () => {
    if (at >= 0) { stop.current = true; setAt(-1); stopSpeaking(); return; }
    stop.current = false;
    const step = (i: number) => {
      if (stop.current || i >= scene.lines.length) { setAt(-1); return; }
      setAt(i);
      speak(scene.lines[i].en, {
        accent,
        rate,
        onEnd: () => { if (!stop.current) step(i + 1); },
      });
    };
    step(0);
  };

  return (
    <>
      <div className="dg-toolrow">
        <button className="btn btn-ghost" onClick={playAll}>
          {at >= 0 ? '■ 停止' : `▶ 连播全篇（${scene.lines.length} 句）`}
        </button>
        <span className="dg-toolhint">点任意一句可以单独听</span>
      </div>

      <div className="dg-thread">
        {scene.lines.map((l, i) => (
          <div
            key={i}
            className={`dg-bub${l.r === scene.you ? ' me' : ''}${at === i ? ' speaking' : ''}`}
            onClick={() => say(l.en)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); say(l.en); } }}
          >
            <div className="dg-who">{scene.roles[l.r]}</div>
            <div className="dg-en">{l.en}</div>
            <div className="dg-zh">{l.zh}</div>
            {l.note && <div className="dg-note">{l.note}</div>}
          </div>
        ))}
      </div>

      <div className="dg-phrases">
        <div className="dg-phrases-title">带走这几句</div>
        {scene.phrases.map((ph, i) => (
          <div key={i} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
            <div className="dg-phrase-en">{ph.en}</div>
            <div className="dg-phrase-zh">{ph.zh}</div>
            {ph.tip && <div className="dg-tip">{ph.tip}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------ 跟打 / 背打 ------------------------ */

function Drill({
  scene,
  mode,
  accent,
  rate,
  known,
  role,
  onExit,
  onFinish,
}: {
  scene: Scene;
  mode: Exclude<Mode, 'read'>;
  accent: 'us' | 'uk';
  rate: number;
  known: (w: string) => boolean;
  role: Role;
  onExit: () => void;
  onFinish: (score: number, words: { w: string; ok: boolean }[]) => void;
}) {
  const mine = useMemo(() => linesOf(scene, role), [scene, role]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [hint, setHint] = useState(false);
  const [failed, setFailed] = useState<{ w: string; ok: boolean }[]>([]);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);

  const input = useRef<HTMLInputElement | null>(null);
  const saved = useRef(false);
  // 计数器另存一份 ref：setTimeout 里读 state 拿到的是旧值，最后一句会少算一分
  const rightRef = useRef(0);
  const failRef = useRef<{ w: string; ok: boolean }[]>([]);

  const line = mine[i];
  const at = line ? scene.lines.indexOf(line) : 0;
  const ctxBefore = at > 0 ? scene.lines[at - 1] : undefined;

  useEffect(() => {
    if (!finished) input.current?.focus();
  }, [i, finished]);

  const mark = (words: string[]) => {
    const usable = words.filter(known);
    if (!usable.length) return;
    failRef.current = [...failRef.current, ...usable.map(w => ({ w, ok: false }))];
    setFailed(failRef.current);
  };

  const finish = () => {
    setFinished(true);
    if (saved.current) return;
    saved.current = true;
    onFinish((rightRef.current / mine.length) * 100, failRef.current);
  };

  const next = () => {
    if (i + 1 >= mine.length) { finish(); return; }
    setI(i + 1);
    setTyped('');
    setStatus('idle');
    setHint(false);
  };

  const submit = () => {
    if (finished) return;
    if (status !== 'idle') { next(); return; }
    const d = diff(line.en, typed);
    if (d.ok) {
      rightRef.current += 1;
      setRight(rightRef.current);
      setStatus('ok');
      speak(line.en, { accent, rate });
      setTimeout(next, 900);
    } else {
      mark(errorWords(line.en, d.wrong));
      setStatus('bad');
    }
  };

  /** 直接看答案＝这句放弃了：按错记，顺手记下前三个内容词 */
  const reveal = () => {
    const all = errorWords(line.en, line.en.split('').map((_, k) => k));
    mark(all.slice(0, 3));
    setTyped('');
    setStatus('bad');
  };

  /* ---------------- 结算 ---------------- */
  if (finished) {
    const score = Math.round((right / mine.length) * 100);
    const words = [...new Set(failed.map(f => f.w))];
    return (
      <div className="dg-sum">
        <div className="dg-sum-score">{score}<em>%</em></div>
        <div className="dg-sum-line">
          {mine.length} 句里打对 {right} 句
          {words.length > 0 ? `，${words.length} 个词记下了，今晚夜巡会考你` : '，一个词都没错'}
        </div>

        <div className="dg-phrases">
          <div className="dg-phrases-title">这场能带走的句子</div>
          {scene.phrases.map((ph, k) => (
            <div key={k} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
              <div className="dg-phrase-en">{ph.en}</div>
              <div className="dg-phrase-zh">{ph.zh}</div>
            </div>
          ))}
        </div>

        <div className="dg-sum-acts">
          <button className="btn btn-ghost" onClick={onExit}>回到场景列表</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              saved.current = false;
              rightRef.current = 0;
              failRef.current = [];
              setFinished(false);
              setI(0); setTyped(''); setStatus('idle'); setRight(0); setFailed([]); setHint(false);
            }}
          >
            再来一遍
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- 答题 ---------------- */
  const chars = line.en.split('');
  const shown = mode === 'copy';

  return (
    <div className="dg-drill">
      <div className="dg-bar">
        <span className={i + 1 === mine.length ? 'end' : ''}>{i + 1} / {mine.length}</span>
        <i><b style={{ width: `${(i / mine.length) * 100}%` }} /></i>
      </div>

      {ctxBefore && (
        <div className="dg-ctx">
          <span>{scene.roles[ctxBefore.r]}</span>
          {ctxBefore.en}
        </div>
      )}

      <div className="dg-main">
      <div className="dg-prompt">
        <div className={`dg-prompt-zh${shown ? ' sub' : ''}`}>{line.zh}</div>
      </div>

      {shown ? (
        <div className="dg-target">
          {chars.map((ch, k) => {
            const t = typed[k];
            const cls = t === undefined ? '' : t === ch ? 'on' : 'bad';
            return <span key={k} className={`dg-ch ${cls}`}>{ch}</span>;
          })}
        </div>
      ) : (
        <div className={`dg-mask${hint ? ' hinted' : ''}`}>
          {hint ? initials(line.en) : maskOf(line.en)}
          {!hint && status === 'idle' && (
            <button className="dg-hint-btn" onClick={() => setHint(true)}>看首字母</button>
          )}
        </div>
      )}

      <input
        ref={input}
        className={`dg-input${status === 'ok' ? ' ok' : status === 'bad' ? ' bad' : ''}`}
        value={typed}
        // 不能用 disabled：失去焦点的 input 收不到回车，答错后就没法「回车继续」了
        readOnly={status !== 'idle'}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder={status === 'bad' ? '' : '打出这句话，回车确认'}
        onChange={e => { if (status === 'idle') setTyped(e.target.value); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
        }}
      />

      {status === 'ok' && <div className="dg-fb ok">✓ 就是这句</div>}
      {status === 'bad' && (
        <div className="dg-fb bad">
          <div className="dg-fb-line">
            {chars.map((ch, k) => {
              const t = typed[k];
              const cls = t === undefined ? 'miss' : t === ch ? 'on' : 'err';
              return <span key={k} className={cls}>{ch}</span>;
            })}
          </div>
          <div className="dg-fb-tip">回车继续</div>
        </div>
      )}

      </div>

      <div className="dg-drill-foot">
        <button className="dg-link" onClick={() => speak(line.en, { accent, rate })}>听一遍</button>
        {mode === 'recall' && status === 'idle' && (
          <button className="dg-link" onClick={reveal}>看答案</button>
        )}
        <span className="dg-drill-hint">这句是{scene.roles[line.r]}要说的</span>
      </div>
    </div>
  );
}

/* ---------------------------- 跟读 ---------------------------- */

function Speak({
  scene,
  accent,
  rate,
  known,
  role,
  onExit,
  onType,
  onFinish,
}: {
  scene: Scene;
  accent: 'us' | 'uk';
  rate: number;
  known: (w: string) => boolean;
  role: Role;
  onExit: () => void;
  onType: () => void;
  onFinish: (score: number, words: { w: string; ok: boolean }[]) => void;
}) {
  const mine = useMemo(() => linesOf(scene, role), [scene, role]);
  const supported = useMemo(() => asrSupported(), []);

  const [i, setI] = useState(0);
  const [listening, setListening] = useState(false);
  const [res, setRes] = useState<SayResult | null>(null);
  const [heard, setHeard] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [passed, setPassed] = useState(0);
  const [finished, setFinished] = useState(false);

  const rec = useRef<AsrHandles | null>(null);
  const passedRef = useRef(0);
  const failRef = useRef<{ w: string; ok: boolean }[]>([]);
  const saved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const line = mine[i];

  useEffect(() => () => {
    rec.current?.abort();
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const finish = () => {
    setFinished(true);
    if (saved.current) return;
    saved.current = true;
    onFinish((passedRef.current / mine.length) * 100, failRef.current);
  };

  const next = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (i + 1 >= mine.length) { finish(); return; }
    setI(i + 1);
    setRes(null);
    setHeard('');
    setMsg(null);
    setListening(false);
  };

  /** 说不出来就下一句：只有明显没说清（<60%）才把漏掉的词记进夜巡，
   *  识别器的误差不该算到用户头上 */
  const skip = () => {
    if (res && res.ratio < 0.6) {
      const bad = res.words.filter(x => !x.ok).map(x => x.w).filter(w => w.length >= 4 && known(w));
      if (bad.length) failRef.current = [...failRef.current, ...bad.map(w => ({ w, ok: false }))];
    }
    next();
  };

  const start = () => {
    if (!line || listening) return;
    stopSpeaking();
    setMsg(null);
    setRes(null);
    setHeard('');

    const h = createAsr({
      accent,
      onResult: (text) => {
        setHeard(text);
        const r = scoreSay(line.en, text);
        setRes(r);
        if (r.pass) {
          passedRef.current += 1;
          setPassed(passedRef.current);
          speak(line.en, { accent, rate });
          timer.current = setTimeout(next, 1600);
        }
      },
      onError: (code) => {
        if (code === 'aborted') return;
        setMsg(asrMessage(code));
      },
      onEnd: () => setListening(false),
    });

    rec.current = h;
    if (!h) { setMsg('这个环境没有语音识别'); return; }
    setListening(true);
    h.start();
  };

  if (!supported) {
    return (
      <div className="dg-nosay">
        <div className="dg-nosay-title">这个环境跑不了语音识别</div>
        <div className="dg-nosay-sub">
          浏览器版 Chrome 支持（识别在 Google 的服务器上做）；桌面端 WebView2 不支持。
          可以先「听原句」建立声音印象，再切到跟打。
        </div>
        <div className="dg-nosay-acts">
          <button className="btn btn-ghost" onClick={onExit}>回到场景列表</button>
          <button className="btn btn-ghost" onClick={() => speak(mine[0]?.en ?? '', { accent, rate })}>听原句</button>
          <button className="btn btn-primary" onClick={onType}>改用跟打</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const score = Math.round((passed / mine.length) * 100);
    return (
      <div className="dg-sum">
        <div className="dg-sum-score">{score}<em>%</em></div>
        <div className="dg-sum-line">
          {mine.length} 句里说清 {passed} 句
          {failRef.current.length > 0 ? '，没听清的词今晚夜巡会考你' : ''}
        </div>
        <div className="dg-phrases">
          <div className="dg-phrases-title">这场能带走的句子</div>
          {scene.phrases.map((ph, k) => (
            <div key={k} className="dg-phrase" onClick={() => speak(ph.en, { accent, rate })}>
              <div className="dg-phrase-en">{ph.en}</div>
              <div className="dg-phrase-zh">{ph.zh}</div>
            </div>
          ))}
        </div>
        <div className="dg-sum-acts">
          <button className="btn btn-ghost" onClick={onExit}>回到场景列表</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              saved.current = false;
              passedRef.current = 0;
              failRef.current = [];
              setFinished(false);
              setI(0); setRes(null); setHeard(''); setMsg(null); setPassed(0);
            }}
          >
            再来一遍
          </button>
        </div>
      </div>
    );
  }

  if (!line) return null;
  const at = scene.lines.indexOf(line);
  const ctxBefore = at > 0 ? scene.lines[at - 1] : undefined;

  return (
    <div className="dg-speak">
      <div className="dg-bar">
        <span className={i + 1 === mine.length ? 'end' : ''}>{i + 1} / {mine.length}</span>
        <i><b style={{ width: `${(i / mine.length) * 100}%` }} /></i>
      </div>

      {ctxBefore && (
        <div className="dg-ctx">
          <span>{scene.roles[ctxBefore.r]}</span>
          {ctxBefore.en}
        </div>
      )}

      <div className="dg-main">
        <div className="dg-speak-en">{line.en}</div>
        <div className="dg-prompt-zh sub">{line.zh}</div>

        <button
          className={`dg-mic${listening ? ' on' : ''}`}
          onClick={start}
          aria-label="开始跟读"
          disabled={listening}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
          </svg>
        </button>

        <div className="dg-mic-hint">
          {listening
            ? '正在听…说完停一下'
            : res
              ? (res.pass ? '说得清楚，接着下一句' : '还差一点，再说一次')
              : '点一下，然后读出这句话'}
        </div>
      </div>

      {res && (
        <div className={`dg-say${res.pass ? ' pass' : ''}`}>
          <div className="dg-say-head">
            <b>{Math.round(res.ratio * 100)}<em>%</em></b>
            <span>
              {res.matched} / {res.total} 个词听清了
              {res.extra > 0 ? ` · 多说了 ${res.extra} 个词` : ''}
            </span>
          </div>
          <div className="dg-say-words">
            {res.words.map((x, k) => (
              <span key={k} className={x.ok ? 'ok' : 'no'}>{x.w}</span>
            ))}
          </div>
          {heard && <div className="dg-say-heard">听到：{heard}</div>}
        </div>
      )}

      {msg && <div className="dg-msg">{msg}</div>}

      <div className="dg-drill-foot">
        <button className="dg-link" onClick={() => speak(line.en, { accent, rate })}>听原句</button>
        {res && <button className="dg-link" onClick={start}>再说一次</button>}
        <button className="dg-link" onClick={skip}>{res ? '下一句' : '跳过这句'}</button>
        <span className="dg-drill-hint">识别在本机浏览器里做，录音不上传</span>
      </div>
    </div>
  );
}
