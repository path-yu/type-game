import { useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { estimateVocab } from '../lib/data';
import { useGame } from '../lib/store';
import { buildReport } from '../lib/report';
import { loadDialogues } from '../lib/dialogue';
import { speak } from '../lib/speech';

/** 折线：把 WPM 序列压成一条 SVG path */
function sparkline(values: number[], w = 640, h = 76) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 12) - 6;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function ReportScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);

  // 语料总场数只有报告页需要（「练过 3 / 10 场」），单独拉一次
  const [sceneTotal, setSceneTotal] = useState(0);
  useEffect(() => {
    let alive = true;
    void loadDialogues().then(b => { if (alive && b) setSceneTotal(b.scenes.length); });
    return () => { alive = false; };
  }, []);

  const r = useMemo(
    () => buildReport(p, corpus, p.unlocked, { scenes: sceneTotal + (p.customScenes?.length ?? 0) }),
    [p, corpus, sceneTotal]
  );
  const vocab = estimateVocab(p.mastery, corpus);
  const path = sparkline(r.trend);
  const maxKey = r.topKeys[0]?.n ?? 1;

  if (r.runs === 0 && r.talk.played === 0) {
    return (
      <div className="report">
        <div className="page-head">
          <div>
            <h1 className="page-title">体检报告</h1>
            <div className="page-sub">还没有足够的数据</div>
          </div>
        </div>
        <div className="empty">先打完一条卷轴，这里会告诉你瓶颈在哪。</div>
      </div>
    );
  }

  return (
    <div className="report">
      <div className="page-head">
        <div>
          <h1 className="page-title">体检报告</h1>
          <div className="page-sub">
            {r.runs > 0
              ? `累计 ${p.runs} 次 · ${r.minutes} 分钟 · 掌握 ${vocab.toLocaleString()} 词`
              : `还没有打字记录 · 对话练过 ${r.talk.played} 场`}
          </div>
        </div>
      {r.runs > 0 && (
          <span className={`pill-badge${r.verdict.tone === 'good' ? ' gold' : ''}`}>
            {r.verdict.tone === 'good' ? '状态良好' : r.verdict.tone === 'warn' ? '有提升空间' : '先修准确率'}
          </span>
        )}
      </div>

        {r.runs > 0 && (
          <>
          <section className={`rep-verdict ${r.verdict.tone}`}>
            <div className="rv-title">{r.verdict.title}</div>
            <div className="rv-detail">{r.verdict.detail}</div>
          </section>

          <section className="rep-grid">
            <div className="rep-card">
              <div className="rep-label">平均速度</div>
              <div className="rep-big">{r.avgWpm}<u>WPM</u></div>
              <div className="rep-foot">最好 {r.bestWpm} WPM</div>
            </div>
            <div className="rep-card">
              <div className="rep-label">平均准确率</div>
              <div className="rep-big">{r.avgAcc}<u>%</u></div>
              <div className="rep-foot">{r.avgAcc >= 98 ? '很稳' : r.avgAcc >= 95 ? '合格' : '需要改进'}</div>
            </div>
            <div className="rep-card">
              <div className="rep-label">一致性</div>
              <div className="rep-big">{r.avgCons}<u>%</u></div>
              <div className="rep-foot">{r.avgCons >= 70 ? '节奏平稳' : r.avgCons >= 55 ? '略有起伏' : '忽快忽慢'}</div>
            </div>
          </section>

          <section className="rep-block">
            <div className="rep-block-head">
              <h2>最近 {r.trend.length} 次</h2>
              <span>
                最低 {Math.min(...r.trend)} · 最高 {Math.max(...r.trend)} WPM
              </span>
            </div>
            <svg className="spark" viewBox="0 0 640 76" preserveAspectRatio="none" aria-label="WPM 趋势">
              <path className="spark-line" d={path} />
            </svg>
          </section>

          <section className="rep-block">
            <div className="rep-block-head">
              <h2>最容易打错的键</h2>
              <span>左为应打，右为实际打出</span>
            </div>
            {r.topKeys.length === 0 ? (
              <div className="rep-none">还没有记录到错键</div>
            ) : (
              <div className="key-list">
                {r.topKeys.map(k => (
                  <div className="key-row" key={`${k.from}${k.to}`}>
                    <span className="key-pair">
                      <kbd>{k.from === ' ' ? '空格' : k.from}</kbd>
                      <i>打成</i>
                      <kbd>{k.to === ' ' ? '空格' : k.to}</kbd>
                    </span>
                    <span className="key-bar"><i style={{ width: `${(k.n / maxKey) * 100}%` }} /></span>
                    <span className="key-n">{k.n} 次</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rep-block">
            <div className="rep-block-head">
              <h2>反复打错的词</h2>
              <span>点一下听发音</span>
            </div>
            {r.weakWords.length === 0 ? (
              <div className="rep-none">还没有打错过的词</div>
            ) : (
              <div className="weak-grid">
                {r.weakWords.map(w => (
                  <button
                    key={w.w}
                    className="weak-item"
                    onClick={() => speak(w.w, { accent: settings.voice, rate: settings.rate })}
                  >
                    <b>{w.w}</b>
                    <span>{w.zh || '—'}</span>
                    <em>错 {w.er} 次 · 掌握 {w.m}</em>
                  </button>
                ))}
              </div>
            )}
          </section>

        </>
      )}

      {r.talk.played > 0 && (
        <section className="rep-block rep-talk">
          <div className="rep-block-head">
            <h2>场景对话</h2>
            <span>
              练过 {r.talk.played}{r.talk.total ? ` / ${r.talk.total}` : ''} 场 ·
              换角 {r.talk.bothWays} 场 · 实战 {r.talk.live} 场
            </span>
          </div>

          <div className="rep-grid two">
            <div className="rep-card">
              <div className="rep-label">说台词</div>
              <div className="rep-big">{r.talk.bestAvg || '—'}<u>{r.talk.bestAvg ? '%' : ''}</u></div>
              <div className="rep-foot">
                {r.talk.bestAvg >= 85 ? '句子已经熟了' : r.talk.bestAvg >= 60 ? '基本能说下来' : '先跟打几遍'}
              </div>
            </div>
            <div className="rep-card">
              <div className="rep-label">实战接住率</div>
              <div className="rep-big">{r.talk.live ? r.talk.liveAvg : '—'}<u>{r.talk.live ? '%' : ''}</u></div>
              <div className="rep-foot">
                {r.talk.live === 0 ? '还没走过实战' : r.talk.liveAvg >= 75 ? '临场很稳' : r.talk.liveAvg >= 55 ? '偶尔卡壳' : '还接不顺'}
              </div>
            </div>
          </div>

          {r.talk.verdict && (
            <div className={`rep-talk-note ${r.talk.verdict.tone}`}>
              <b>{r.talk.verdict.title}</b>
              <span>{r.talk.verdict.detail}</span>
            </div>
          )}

          {/* 岔路按类型拆开：低分的排前面，一眼看出该补哪一类 */}
          {r.talk.branches.length > 0 && (
            <div className="rep-branch">
              <div className="rep-branch-title">
                岔路 · 哪类意外最容易卡住
                {r.talk.weakBranch && (
                  <em>{`最弱：${r.talk.weakBranch.label}`}</em>
                )}
              </div>
              {r.talk.branches.map(b => (
                <div key={b.kind} className={`rep-branch-row${b === r.talk.weakBranch ? ' weak' : ''}`}>
                  <span className="k">{b.label}</span>
                  <i><b style={{ width: `${Math.max(b.rate, 2)}%` }} /></i>
                  <em>{b.ok}/{b.n}</em>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rep-block">
        <div className="rep-block-head"><h2>接下来这样练</h2></div>
        <ul className="rep-tips">
          {r.tips.map(t => <li key={t}>{t}</li>)}
        </ul>
      </section>
    </div>
  );
}
