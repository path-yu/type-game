/**
 * 路由：把当前在哪一屏写进地址栏。
 *
 * 之前全靠 store 里的 `screen` 字段，刷新一次就回到首页 —— 读到第三十七章
 * 手一抖按了 F5，就得从书架重新找回来。地址栏本来就是干这个的。
 *
 * 编码方式是 `#/<屏>/<参数>`：
 *   #/library              文库
 *   #/read/alice-0001      阅读页，参数是文章 id
 *   #/full/Nineteen%20…    全书通读，参数是书名
 *
 * 用 pushState 而不是直接改 hash：这样浏览器的后退键能按屏退回去，
 * 而不是一下子退出应用。
 */
import type { Screen } from './types';

export interface Route {
  screen: Screen;
  /** 屏内参数（文章 id / 书名），没有就是 null */
  param: string | null;
}

const SCREENS: Screen[] = [
  'map', 'play', 'result', 'review', 'lexicon', 'words', 'library', 'reader', 'report', 'cloze', 'dialogue', 'settings',
];

/** 这些屏不写参数：即便带着 id 刷新，也不需要恢复得更细 */
export function parseRoute(hash = location.hash): Route {
  const raw = decodeURIComponent(hash.replace(/^#\/?/, ''));
  if (!raw) return { screen: 'map', param: null };
  const [seg, ...rest] = raw.split('/');
  const param = rest.length ? rest.join('/') : null;

  // 全书通读归在文库这一屏里，参数额外标 full/
  if (seg === 'full') return { screen: 'library', param: param ? `full/${param}` : null };
  if ((SCREENS as string[]).includes(seg)) return { screen: seg as Screen, param };
  return { screen: 'map', param: null };
}

function href(screen: Screen, param?: string | null): string {
  // 全书通读统一写成 #/full/<书名>（而不是 #/library/full/<书名>），
  // 这样"是不是在全书阅读里"一眼就能从地址判断
  if (screen === 'library' && param?.startsWith('full/')) {
    return `#/full/${encodeURIComponent(param.slice(5))}`;
  }
  return param ? `#/${screen}/${encodeURIComponent(param)}` : `#/${screen}`;
}

/** 状态 → 地址栏。地址没变就不动，免得刷出一堆重复历史 */
export function syncRoute(screen: Screen, param?: string | null) {
  const next = href(screen, param);
  if (location.hash === next) return;
  history.pushState(null, '', next);
}

/** 首屏对齐：进入应用时把地址栏换成当前屏，但不留历史 */
export function replaceRoute(screen: Screen, param?: string | null) {
  const next = href(screen, param);
  if (location.hash === next) return;
  history.replaceState(null, '', next);
}

/** 监听浏览器前进/后退 */
export function onRouteChange(cb: (r: Route) => void): () => void {
  const handler = () => cb(parseRoute());
  window.addEventListener('popstate', handler);
  window.addEventListener('hashchange', handler);
  return () => {
    window.removeEventListener('popstate', handler);
    window.removeEventListener('hashchange', handler);
  };
}
