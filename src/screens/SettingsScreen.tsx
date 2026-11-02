import { useGame } from '../lib/store';
import { BackupGroup } from '../components/BackupGroup';
import { DataDirGroup } from '../components/DataDirGroup';
import { apply, MODE_LABEL, type ThemeMode } from '../lib/theme';
import { speak } from '../lib/speech';
import { setMuted } from '../lib/sfx';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];
const ACCENTS: { v: 'us' | 'uk'; label: string }[] = [
  { v: 'us', label: '美音' },
  { v: 'uk', label: '英音' },
];
const RATES = [0.5, 0.75, 1, 1.25];

interface Props {
  mode: ThemeMode;
  onMode: (m: ThemeMode) => void;
}

export function SettingsScreen({ mode, onMode }: Props) {
  const s = useGame(x => x.s);
  const set = useGame(x => x.setSetting);

  const demo = (patch?: { rate?: number; voice?: 'us' | 'uk' }) =>
    speak('resilience', { accent: patch?.voice ?? s.voice, rate: patch?.rate ?? s.rate });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">设置</h1>
          <div className="page-sub">所有选项都会立刻生效，并保存在本地</div>
        </div>
      </div>

      <div className="set-group">
        <div className="set-group-title">外观</div>

        <div className="set-row">
          <div className="set-label">
            <b>主题</b>
            <span>浅色适合白天，深色适合夜里写字</span>
          </div>
          <div className="seg">
            {MODES.map(m => (
              <button
                key={m}
                className={mode === m ? 'on' : ''}
                onClick={() => { onMode(m); apply(m); }}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="set-label">
            <b>减少动效</b>
            <span>关闭连击光带、粒子与过渡动画</span>
          </div>
          <button
            className={`switch${!s.motion ? ' on' : ''}`}
            onClick={() => set('motion', !s.motion)}
            aria-pressed={!s.motion}
          >
            <i />
          </button>
        </div>
      </div>

      <div className="set-group">
        <div className="set-group-title">学习</div>

        <div className="set-row">
          <div className="set-label">
            <b>开打前预习生词</b>
            <span>先用中文释义回忆一遍本篇的生词，再进正文（先测后学）</span>
          </div>
          <button
            className={`switch${s.pretest ? ' on' : ''}`}
            onClick={() => set('pretest', !s.pretest)}
            aria-pressed={s.pretest}
          >
            <i />
          </button>
        </div>
      </div>

      <div className="set-group">
        <div className="set-group-title">发音</div>

        <div className="set-row">
          <div className="set-label">
            <b>口音</b>
            <span>影响查词发音与听写</span>
          </div>
          <div className="seg">
            {ACCENTS.map(a => (
              <button
                key={a.v}
                className={s.voice === a.v ? 'on' : ''}
                onClick={() => { set('voice', a.v); demo({ voice: a.v }); }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="set-label">
            <b>发音速度</b>
            <span>查词卡片右上角也能随时改</span>
          </div>
          <div className="seg">
            {RATES.map(r => (
              <button
                key={r}
                className={s.rate === r ? 'on' : ''}
                onClick={() => { set('rate', r); demo({ rate: r }); }}
              >
                {r === 1 ? '1×' : `${r}×`}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="set-label">
            <b>句子解析</b>
            <span>打字时在下方显示当前句的生词释义与译文</span>
          </div>
          <div className="seg">
            {([['off', '关闭'], ['gloss', '生词'], ['both', '生词+译文']] as const).map(([v, l]) => (
              <button
                key={v}
                className={s.sentenceHelp === v ? 'on' : ''}
                onClick={() => set('sentenceHelp', v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="set-row">
          <div className="set-label">
            <b>打字时朗读单词</b>
            <span>每敲完一个词就念一遍，边打边记</span>
          </div>
          <button
            className={`switch${s.autoSpeak ? ' on' : ''}`}
            onClick={() => set('autoSpeak', !s.autoSpeak)}
            aria-pressed={s.autoSpeak}
          >
            <i />
          </button>
        </div>
      </div>

      <div className="set-group">
        <div className="set-group-title">打字</div>
        <div className="set-row">
          <div className="set-label">
            <b>键盘音效</b>
            <span>击键、错误、连击共鸣都由 WebAudio 实时合成</span>
          </div>
          <button
            className={`switch${s.sound ? ' on' : ''}`}
            onClick={() => { set('sound', !s.sound); setMuted(s.sound); }}
            aria-pressed={s.sound}
          >
            <i />
          </button>
        </div>
      </div>

      <BackupGroup />
      <DataDirGroup />

      <div className="set-group">
        <div className="set-group-title">关于</div>
        <div className="set-about">
          <div><span>文本来源</span><em>Project Gutenberg（公有领域）· Simple English Wikipedia（CC BY-SA 3.0）</em></div>
          <div><span>词库</span><em>ECDICT（MIT）· 7584 词，含音标、考试标签与 384 条场景补充词</em></div>
          <div><span>发音</span><em>系统语音合成（Web Speech API）</em></div>
        </div>
      </div>
    </div>
  );
}
