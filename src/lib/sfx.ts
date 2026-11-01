let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

let muted = false;
export function setMuted(v: boolean) { muted = v; }

/** 击键：极短的木质轻响，音量很小，长时间不刺耳 */
export function keyClick() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1400 + Math.random() * 300;
  f.Q.value = 1.2;
  o.type = 'triangle';
  o.frequency.setValueAtTime(180 + Math.random() * 40, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.035);
  g.gain.setValueAtTime(0.045, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(f).connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.06);
}

export function errorThud() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.16);
}

/** 连击共鸣：每 30 连击一层，音高递进 */
export function resonant(level: number) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const base = 392 * Math.pow(2, Math.min(level, 5) / 12);
  [1, 2.01, 2.99].forEach((mult, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = i === 0 ? 'sine' : 'triangle';
    o.frequency.value = base * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 / (i + 1.4), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 1.2);
  });
}

export function chime() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.09);
    g.gain.exponentialRampToValueAtTime(0.055, t + i * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9);
    o.connect(g).connect(c.destination);
    o.start(t + i * 0.09);
    o.stop(t + i * 0.09 + 1);
  });
}
