/**
 * 语音识别：只包一层，把「有没有支持」「怎么起停」收敛到一个文件。
 *
 * 现实是：Chrome（浏览器版）走 Google 的识别服务，能用；
 * Tauri 的 WebView2 没有 SpeechRecognition，用不了。
 * 所以这一层的职责首先是**老实报告能力**，而不是假装能用 ——
 * 跟读在桌面端会退化成「听原句 + 打字」，不能给个按钮点了没反应。
 */

interface RecAlt { transcript: string; confidence?: number }
interface RecResult { isFinal: boolean; length: number; [k: number]: RecAlt }
interface RecEvent { resultIndex: number; results: { length: number; [k: number]: RecResult } }

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecEvent) => void) | null;
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
  /** 最终结果。alts 是识别器给的多个候选，同一个音常被听成不同的词，都拿去比对能少判错 */
  onResult: (text: string, alts: string[]) => void;
  /** 说话过程中的半成品，只用来显示「它在听」，不要拿去判定 */
  onInterim?: (text: string) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}

function ctor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 测试注入点：无头浏览器既没有麦克风，也连不上识别服务 */
type Fake = () => string | string[] | { error: string };

function fake(): Fake | null {
  if (typeof window === 'undefined') return null;
  const f = (window as unknown as { __TYPEWAKE_ASR__?: Fake }).__TYPEWAKE_ASR__;
  return typeof f === 'function' ? f : null;
}

export function asrSupported(): boolean {
  if (fake()) return true;
  // 非安全上下文（http 且不是 localhost）里 SpeechRecognition 存在也起不来，
  // 与其让用户点了没反应，不如直接报不支持
  if (typeof window !== 'undefined' && window.isSecureContext === false) return false;
  return !!ctor();
}

/** 建一个识别会话；不支持时返回 null（调用方据此切到降级界面） */
export function createAsr(opts: AsrOpts): AsrHandles | null {
  const f = fake();
  if (f) {
    return {
      start() {
        const said = f();
        if (Array.isArray(said)) {
          const list = said.filter(x => x.trim());
          if (!list.length) opts.onError('no-speech');
          else opts.onResult(list[0], list);
        } else if (typeof said === 'string') {
          if (!said.trim()) opts.onError('no-speech');
          else opts.onResult(said, [said]);
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
  // 打开中间结果：用户念的时候界面上能看到「它听到了什么」，
  // 否则等待期间毫无反馈，麦克风没开也看不出来
  rec.interimResults = true;
  // 一个音常被听成好几个词（river / liver / River），多给几个候选再比对
  rec.maxAlternatives = 5;

  let got = false;      // 有没有拿到最终结果
  let reported = false; // 已经报过错，避免 onerror 和 onend 各报一次
  let killed = false;   // 用户主动取消，不是「没听到」

  const fail = (code: string) => {
    if (killed || reported) return;
    reported = true;
    opts.onError(code);
  };

  rec.onresult = (e) => {
    const r = e.results?.[e.results.length - 1];
    if (!r) return;
    const alts: string[] = [];
    for (let i = 0; i < r.length; i++) {
      const t = r[i]?.transcript;
      if (t && t.trim()) alts.push(t.trim());
    }
    if (!alts.length) return;
    if (!r.isFinal) {
      opts.onInterim?.(alts[0]);
      return;
    }
    got = true;
    opts.onResult(alts[0], alts);
  };

  rec.onerror = (e) => {
    const code = e?.error ?? 'unknown';
    if (code === 'aborted') { killed = true; return; }
    fail(code);
  };

  rec.onend = () => {
    // 说完了、但一个字都没识别出来 —— 这时 onerror 不会触发，
    // 不打这一枪的话界面只会从「正在听」悄悄变回去，看起来像点了没反应
    if (!got && !killed) fail('no-speech');
    opts.onEnd();
  };

  return {
    start() {
      try {
        rec.start();
      } catch {
        // 起不来（权限被系统挡住、设备被占用）时不能装作在听：
        // 否则按钮停在「正在听…」，用户等到最后也不知道发生了什么
        fail('audio-capture');
      }
    },
    /** 主动结束：不等静音检测，立刻把已说的部分定稿 */
    stop() { try { rec.stop(); } catch { /* ignore */ } },
    abort() {
      killed = true;
      try { rec.abort(); } catch { /* ignore */ }
    },
  };
}

/** 错误码 → 人话 */
export function asrMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风被拒绝了，需要在浏览器地址栏允许麦克风';
    case 'no-speech':
      return '这次没识别到 —— 可能麦克风被静音、说话太轻，或识别服务没响应。再说一次';
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
