import { useEffect, useState } from 'react';
import { CorpusCtx } from './lib/CorpusContext';
import { estimateVocab, loadCorpus, type Corpus } from './lib/data';
import { dueWords, useGame } from './lib/store';
import { apply, getMode, nextMode, onSystemChange, MODE_LABEL, type ThemeMode } from './lib/theme';
import { MapScreen } from './screens/MapScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { LexiconScreen } from './screens/LexiconScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ReportScreen } from './screens/ReportScreen';
import { ClozeScreen } from './screens/ClozeScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { DialogueScreen } from './screens/DialogueScreen';
import { IconBlank, IconBook, IconChat, IconCity, IconGear, IconMonitor, IconMoon, IconPulse, IconShelf, IconSun } from './components/Icons';
import { reportReady } from './lib/native';
import { stopSpeaking } from './lib/speech';

export default function App() {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<ThemeMode>(() => getMode());

  const screen = useGame(s => s.screen);
  const go = useGame(s => s.go);
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
            <button className={`side-item${screen === 'library' ? ' on' : ''}`} onClick={() => go('library')}>
              <IconShelf />
              <span>文库</span>
              <span className="badge">{corpus.articles.length}</span>
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
          {screen === 'dialogue' && <DialogueScreen />}
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
