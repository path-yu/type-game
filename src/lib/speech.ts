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

export function speak(text: string, opts: SpeakOpts = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
  const s = window.speechSynthesis;
  return s.speaking || s.pending;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
