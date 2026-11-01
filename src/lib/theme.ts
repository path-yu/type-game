export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'typewake:theme';
const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

let current: ThemeMode = 'system';

export function getMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') current = v;
  } catch { /* ignore */ }
  return current;
}

export function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return mq().matches ? 'dark' : 'light';
}

export function apply(mode: ThemeMode) {
  current = mode;
  const r = resolve(mode);
  document.documentElement.dataset.theme = r;
  document.documentElement.style.colorScheme = r;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', r === 'dark' ? '#1C1C1E' : '#F2F2F7');
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  return r;
}

let listener: ((r: ResolvedTheme) => void) | null = null;

export function onSystemChange(cb: (r: ResolvedTheme) => void) {
  listener = cb;
  const handler = () => {
    if (current === 'system') {
      const r = resolve('system');
      document.documentElement.dataset.theme = r;
      document.documentElement.style.colorScheme = r;
      listener?.(r);
    }
  };
  mq().addEventListener('change', handler);
  return () => mq().removeEventListener('change', handler);
}

export function nextMode(m: ThemeMode): ThemeMode {
  return m === 'system' ? 'light' : m === 'light' ? 'dark' : 'system';
}

export const MODE_LABEL: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
};
