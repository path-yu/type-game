import { useCallback, useEffect, useRef, useState } from 'react';
import { CorpusCtx } from './lib/CorpusContext';
import { estimateVocab, loadCorpus, type Corpus } from './lib/data';
import { dueWords, useGame } from './lib/store';
import { apply, getMode, nextMode, onSystemChange, MODE_LABEL, type ThemeMode } from './lib/theme';
import { MapScreen } from './screens/MapScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { LexiconScreen } from './screens/LexiconScreen';
import { WordbookScreen } from './screens/WordbookScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ReportScreen } from './screens/ReportScreen';
import { ClozeScreen } from './screens/ClozeScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ReaderScreen } from './screens/ReaderScreen';
import { DialogueScreen } from './screens/DialogueScreen';
import { IconBlank, IconBook, IconChat, IconCity, IconGear, IconMonitor, IconMoon, IconPulse, IconShelf, IconSun } from './components/Icons';
import { reportReady } from './lib/native';
import { stopSpeaking } from './lib/speech';
import { onRouteChange, parseRoute, syncRoute, type Route } from './lib/route';

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<ThemeMode>(() => getMode());

  const screen = useGame(s => s.screen);
  const go = useGame(s => s.go);
  const article = useGame(s => s.article);
  const read = useGame(s => s.read);
  const p = useGame(s => s.p);
  const toast = useGame(s => s.toast);
  const boot = useGame(s => s.boot);

  useEffect(() => {
    apply(mode);
    return onSystemChange(() => setMode(m => m));
  }, [mode]);

  /* 切页即停读：任何页面离开时都取消正在进行的语音 */
  useEffect(() => () => stopSpeaking(), [screen]);

  const motion = useGame(s => s.s.motion);
  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', !motion);
  }, [motion]);

  useEffect(() => {
    boot();
    loadCorpus()
      .then((c) => {
        setCorpus(c);
        void reportReady(c.articles.length, c.dict.size);
      })
      .catch((e: Error) => setErr(e.message));
  }, [boot]);

  /*
   * 路由：地址栏 ←→ 当前屏。
   *
   * 之前只有 store 里的 screen，刷新一次就丢——读到第三十七章按个 F5，
   * 得从书架重新找回来。现在 #/read/<id> 这样的地址能直接恢复。
   */
  const routed = useRef(false);

  const applyRoute = useCallback((r: Route, c: Corpus | null) => {
    /*
     * 打字页/结算页靠的是内存里的这一局（正在打哪一段、刚打完怎么样），
     * 地址栏恢复不出来。刷新或分享这种链接一律回地图 ——
     * 之前不拦的后果不是"少了点状态"，而是 PlayScreen 拿 null 取 .tx 直接崩，
     * 整页白屏，连侧栏都没了。
     */
    if (r.screen === 'play' || r.screen === 'result') { go('map'); return; }

    if (r.screen === 'reader') {
      const a = r.param && c ? c.articles.find(x => x.id === r.param) : null;
      // 文章被删了或者链接是编的，退回文库而不是白屏
      if (a) read(a);
      else go('library');
      return;
    }
    go(r.screen);
  }, [go, read]);

  // 首屏：按地址栏恢复（只做一次，等语料就位）
  useEffect(() => {
    if (!corpus || routed.current) return;
    routed.current = true;
    applyRoute(parseRoute(), corpus);
  }, [corpus, applyRoute]);

  // 状态 → 地址栏
  useEffect(() => {
    if (!routed.current) return;
    /*
     * 全书阅读是从文库或阅读页钻进去的子状态（#/full/<书名>），
     * 那两屏都不能凭自己的 screen 把地址覆盖掉。
     */
    if ((screen === 'reader' || screen === 'library') && location.hash.startsWith('#/full/')) return;
    if (screen === 'reader' && article?.id) syncRoute('reader', article.id);
    else syncRoute(screen);
  }, [screen, article?.id]);

  // 浏览器前进/后退 → 状态
  useEffect(() => {
    if (!routed.current) return;
    return onRouteChange(r => applyRoute(r, corpus));
  }, [corpus, applyRoute]);

  const isFocus = screen === 'play' || screen === 'review';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (screen === 'map') document.querySelector<HTMLButtonElement>('.hero .btn-primary')?.click();
        else if (screen === 'result') document.querySelector<HTMLButtonElement>('.actions .btn-primary')?.click();
      }
      if ((e.metaKey || e.ctrlKey) && !isFocus) {
        const map: Record<string, 'map' | 'review' | 'lexicon' | 'library' | 'dialogue' | 'cloze' | 'report' | 'settings'> = {
          '1': 'map', '2': 'review', '3': 'lexicon', '4': 'library', '5': 'dialogue', '6': 'cloze', '7': 'report', '8': 'settings',
        };
        const target = map[e.key];
        if (target) { e.preventDefault(); go(target); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, isFocus, go]);

  if (err) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.4 }}>⚠</div>
          数据加载失败：{err}
        </div>
      </div>
    );
  }

  if (!corpus) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          正在点亮词库…
        </div>
      </div>
    );
  }

  const vocab = estimateVocab(p.mastery, corpus);
  const due = dueWords(p.mastery, 12).length;
  const bestWpm = Object.keys(p.bestWpm).length
    ? Math.round(Object.values(p.bestWpm).reduce((a, b) => a + b, 0) / Object.keys(p.bestWpm).length)
    : 0;

  const ThemeIcon = mode === 'system' ? IconMonitor : mode === 'light' ? IconSun : IconMoon;

  return (
    <CorpusCtx.Provider value={corpus}>
      <div className={`app${isFocus ? ' is-focus' : ''}${screen === 'play' ? ' is-typing' : ''}`}>
        <aside className="sidebar">
          <div className="side-brand">
            <img className="mark" src="./favicon.svg" alt="" />
            <div>
              <div className="name">词醒</div>
              <div className="en">TYPEWAKE</div>
            </div>
          </div>

          <div className="side-group">
            <div className="side-label">学习</div>
            <button className={`side-item${screen === 'map' || screen === 'play' || screen === 'result' || screen === 'library' ? ' on' : ''}`} onClick={() => go('map')}>
              <IconCity />
              <span>城市</span>
            </button>
            <button className={`side-item${screen === 'review' ? ' on' : ''}`} onClick={() => go('review')}>
              <IconMoon />
              <span>夜巡</span>
              {due > 0 && <span className="badge">{due}</span>}
            </button>
            <button className={`side-item${screen === 'library' || screen === 'reader' ? ' on' : ''}`} onClick={() => go('library')}>
              <IconShelf />
              <span>文库</span>
              <span className="badge">{corpus.articles.length}</span>
            </button>
            <button className={`side-item${screen === 'words' ? ' on' : ''}`} onClick={() => go('words')}>
              <IconBook />
              <span>词库</span>
              <span className="badge">35k</span>
            </button>
            <button className={`side-item${screen === 'lexicon' ? ' on' : ''}`} onClick={() => go('lexicon')}>
              <IconBook />
              <span>藏书阁</span>
            </button>
            <button className={`side-item${screen === 'dialogue' ? ' on' : ''}`} onClick={() => go('dialogue')}>
              <IconChat />
              <span>场景对话</span>
            </button>
            <button className={`side-item${screen === 'cloze' ? ' on' : ''}`} onClick={() => go('cloze')}>
              <IconBlank />
              <span>阅读填空</span>
            </button>
            <button className={`side-item${screen === 'report' ? ' on' : ''}`} onClick={() => go('report')}>
              <IconPulse />
              <span>体检报告</span>
            </button>
          </div>

          <div className="side-foot">
            <div className="side-label">统计</div>
            <div className="stat-row"><span>连续</span><b>{p.streak} 天</b></div>
            <div className="stat-row"><span>平均</span><b>{bestWpm} WPM</b></div>
            <div className="stat-row"><span>词汇量</span><b>{vocab.toLocaleString()}</b></div>
            <button className={`side-item${screen === 'settings' ? ' on' : ''}`} onClick={() => go('settings')}>
              <IconGear />
              <span>设置</span>
            </button>
            <button
              className="theme-btn"
              onClick={() => { const m = nextMode(mode); setMode(m); apply(m); }}
              title="切换外观"
            >
              <ThemeIcon />
              <span>{MODE_LABEL[mode]}</span>
            </button>
          </div>
        </aside>

        <div className="view">
          {screen === 'map' && <MapScreen />}
          {screen === 'play' && <PlayScreen />}
          {screen === 'result' && <ResultScreen />}
          {screen === 'review' && <ReviewScreen />}
          {screen === 'library' && <LibraryScreen />}
          {screen === 'reader' && <ReaderScreen />}
          {screen === 'dialogue' && <DialogueScreen />}
          {screen === 'words' && <WordbookScreen />}
          {screen === 'lexicon' && <LexiconScreen />}
          {screen === 'cloze' && <ClozeScreen />}
          {screen === 'report' && <ReportScreen />}
          {screen === 'settings' && <SettingsScreen mode={mode} onMode={setMode} />}
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </CorpusCtx.Provider>
  );
}
