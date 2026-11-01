import { useEffect, useMemo, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../../lib/speech';
import { linesOf, scoreSay, type Role, type SayResult } from '../../lib/dialogue';
import { asrMessage, asrSupported, createAsr, type AsrHandles } from '../../lib/asr';
import { StepBar, type PracticeProps } from './shared';

type Props = PracticeProps & {
  role: Role;
  onExit: () => void;
  /** 环境不支持语音识别时，一键切到跟打 */
  onType: () => void;
};

export function Speak({ scene, accent, rate, known, role, onExit, onType, onFinish }: Props) {
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
      <StepBar i={i} total={mine.length} />

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
