/**
 * 语音识别：只包一层，把「有没有支持」「怎么起停」收敛到一个文件。
 *
 * 现实是：Chrome（浏览器版）走 Google 的识别服务，能用；
 * Tauri 的 WebView2 没有 SpeechRecognition，用不了。
 * 所以这一层的职责首先是**老实报告能力**，而不是假装能用 ——
 * 跟读在桌面端会退化成「听原句 + 打字」，不能给个按钮点了没反应。
 */

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type Ctor = new () => Recognition;

export interface AsrHandles {
  start(): void;
  stop(): void;
  abort(): void;
}

export interface AsrOpts {
  accent: 'us' | 'uk';
  onResult: (text: string) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}

function ctor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 测试注入点：无头浏览器既没有麦克风，也连不上识别服务 */
type Fake = () => string | { error: string };

function fake(): Fake | null {
  if (typeof window === 'undefined') return null;
  const f = (window as unknown as { __TYPEWAKE_ASR__?: Fake }).__TYPEWAKE_ASR__;
  return typeof f === 'function' ? f : null;
}

export function asrSupported(): boolean {
  return !!fake() || !!ctor();
}

/** 建一个识别会话；不支持时返回 null（调用方据此切到降级界面） */
export function createAsr(opts: AsrOpts): AsrHandles | null {
  const f = fake();
  if (f) {
    return {
      start() {
        const said = f();
        if (typeof said === 'string') {
          if (!said.trim()) opts.onError('no-speech');
          else opts.onResult(said);
        } else {
          opts.onError(said?.error ?? 'unknown');
        }
        opts.onEnd();
      },
      stop() {},
      abort() {},
    };
  }

  const R = ctor();
  if (!R) return null;

  const rec = new R();
  rec.lang = opts.accent === 'uk' ? 'en-GB' : 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript ?? '';
    opts.onResult(text);
  };
  rec.onerror = (e) => opts.onError(e?.error ?? 'unknown');
  rec.onend = () => opts.onEnd();

  return {
    start() {
      try { rec.start(); } catch { /* 已在监听时会抛，忽略 */ }
    },
    stop() { try { rec.stop(); } catch { /* ignore */ } },
    abort() { try { rec.abort(); } catch { /* ignore */ } },
  };
}

/** 错误码 → 人话 */
export function asrMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风被拒绝了，需要在浏览器地址栏允许麦克风';
    case 'no-speech':
      return '没听到声音，再按一次试试';
    case 'audio-capture':
      return '没找到麦克风';
    case 'network':
      return '识别服务连不上（Chrome 的语音识别要走网络）';
    case 'aborted':
      return '已取消';
    default:
      return '识别失败，再试一次';
  }
}
