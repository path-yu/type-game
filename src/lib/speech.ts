let voices: SpeechSynthesisVoice[] = [];

function pickVoice(accent: 'us' | 'uk'): SpeechSynthesisVoice | undefined {
  if (!voices.length) voices = window.speechSynthesis.getVoices();
  const want = accent === 'uk' ? 'en-GB' : 'en-US';
  return (
    voices.find(v => v.lang === want && /natural|siri|google|aria|sonia|samantha/i.test(v.name)) ||
    voices.find(v => v.lang === want) ||
    voices.find(v => v.lang.startsWith('en')) ||
    undefined
  );
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}

export interface SpeakOpts {
  accent?: 'us' | 'uk';
  rate?: number;
  onEnd?: () => void;
}

/*
 * 自动化测试里不出声。
 *
 * 测试用 puppeteer 驱动 Chrome，这类页面的 navigator.webdriver 是 true，
 * 正常打开永远是 false —— 用它当开关，比让每个测试脚本各自去插桩干净，
 * 也不会漏掉那些"进到背单词页就自动读一遍"的地方。
 *
 * 光靠 --mute-audio 不够：那条只静掉浏览器自己的音频输出，
 * speechSynthesis 走的是系统的语音引擎，照样会念出来。
 */
const quiet = (): boolean =>
  typeof navigator !== 'undefined' && (navigator as { webdriver?: boolean }).webdriver === true;

export function speak(text: string, opts: SpeakOpts = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (quiet()) {
    // 仍然回调 onEnd，否则依赖"读完再进下一步"的逻辑会卡住
    opts.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.accent === 'uk' ? 'en-GB' : 'en-US';
  u.rate = opts.rate ?? 0.92;
  const v = pickVoice(opts.accent ?? 'us');
  if (v) u.voice = v;
  if (opts.onEnd) {
    const done = () => opts.onEnd?.();
    u.onend = done;
    u.onerror = done;
  }
  synth.speak(u);
}

/** 当前是否还在读（含排队中的） */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (quiet()) return false;
  const s = window.speechSynthesis;
  return s.speaking || s.pending;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
