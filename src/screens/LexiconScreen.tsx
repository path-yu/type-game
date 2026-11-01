import { useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { vocabBreakdown } from '../lib/data';
import { useGame } from '../lib/store';
import { speak } from '../lib/speech';

const TABS = [
  { id: 'all', label: '全部' },
  { id: 'learning', label: '学习中' },
  { id: 'known', label: '已掌握' },
  { id: 'lex', label: '已收藏' },
] as const;

const TAG_LABEL: Record<string, string> = {
  zk: '中考', gk: '高考', cet4: 'CET4', cet6: 'CET6', ky: '考研', ielts: '雅思', toefl: '托福', gre: 'GRE',
};

export function LexiconScreen() {
  const corpus = useCorpus();
  const p = useGame(s => s.p);
  const s = useGame(s => s.s);
  const go = useGame(s => s.go);
  const toggleLex = useGame(s => s.toggleLex);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');

  const vb = vocabBreakdown(p.mastery, corpus);
  const vocab = vb.total;

  const rows = useMemo(() => {
    const all = Object.entries(p.mastery)
      .map(([w, st]) => ({ w, st, e: corpus.dict.get(w) }))
      .filter(x => x.e);
    const filtered =
      tab === 'known' ? all.filter(x => x.st.m >= 70)
      : tab === 'learning' ? all.filter(x => x.st.m < 70)
      : tab === 'lex' ? all.filter(x => x.st.lex)
      : all;
    return filtered.sort((a, b) => b.st.m - a.st.m).slice(0, 240);
  }, [p.mastery, tab, corpus]);

  const tierStack = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const [w, st] of Object.entries(p.mastery)) {
      if (st.m < 40) continue;
      const t = corpus.dict.get(w)?.t ?? 1;
      counts[t]++;
    }
    return counts;
  }, [p.mastery, corpus]);

  const sum = tierStack.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="vocab">
      <div className="v-head">
        <div>
          <div className="bignum">
            {vocab.toLocaleString()}
            <small>词</small>
          </div>
          <p title="未练习过的 Tier1 高频词按词频先验记入；练习中打错或查过的词会被降级">
            估算词汇量 · 实测 {vb.measured.toLocaleString()} · 先验 {vb.prior.toLocaleString()}
            {vb.demoted > 0 ? ` · 练习中降级 ${vb.demoted}` : ''}
            {' · '}词库共 {corpus.dict.size.toLocaleString()} 词
          </p>
          <div className="stack">
            {[1, 2, 3, 4, 5].map(t => (
              <i
                key={t}
                style={{
                  width: `${(tierStack[t] / sum) * 100}%`,
                  background: ['', 'var(--accent)', 'color-mix(in srgb, var(--accent) 62%, var(--fg-3))',
                    'color-mix(in srgb, var(--accent) 38%, var(--fg-3))',
                    'color-mix(in srgb, var(--accent) 20%, var(--fg-3))', 'var(--sep-2)'][t],
                }}
              />
            ))}
          </div>
        </div>
        <div className="v-filters">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`filter-btn${tab === t.id ? ' on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          还没有记录。<br />
          <span style={{ fontSize: 12 }}>去敲一条卷轴，点一下你不认识的词，它就会住进这里。</span>
          <div style={{ marginTop: 22 }}>
            <button className="btn btn-primary" onClick={() => go('map')}>回地图</button>
          </div>
        </div>
      ) : (
        <div className="v-grid">
          {rows.map(({ w, st, e }) => {
            const tags = (e?.g || []).map(t => TAG_LABEL[t]).filter(Boolean).slice(0, 1);
            return (
              <button
                key={w}
                className={`wcard${st.seen > 0 && st.m >= 70 ? ' lit' : ''}`}
                onClick={() => speak(w, { accent: s.voice, rate: 0.9 })}
                onDoubleClick={() => toggleLex(w)}
                title={st.lex ? '已收藏 · 双击取消' : '双击收藏'}
              >
                <div className="w">{w}</div>
                <div className="z">{(e?.z || '').split('\n')[0] || '—'}</div>
                <div className="bar">
                  <i style={{ width: `${st.m}%` }} />
                </div>
                {tags.length > 0 && (
                  <div style={{ fontSize: 9.5, color: 'var(--tx-dim)', marginTop: 6, fontFamily: 'var(--mono)' }}>
                    Tier {e?.t} · {tags.join(' ')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
