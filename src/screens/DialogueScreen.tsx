import { useEffect, useMemo, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { dayNo, useGame } from '../lib/store';
import { loadDialogues, linesOf, validate, yourLines, type DBank, type Role, type Scene } from '../lib/dialogue';
import { pendingCount, pickSession, unlockedPhrases, type PhraseItem } from '../lib/phrases';
import { stopSpeaking } from '../lib/speech';
import { MODES, type Mode } from './dialogue/shared';
import { ImportScene } from './dialogue/Import';
import { PhraseDrill } from './dialogue/PhraseDrill';
import { Reader } from './dialogue/Reader';
import { Drill } from './dialogue/Drill';
import { Speak } from './dialogue/Speak';
import { Live } from './dialogue/Live';

/**
 * 场景对话的总入口：列表 + 场景外壳。
 *
 * 五种练法各自一个文件（dialogue/），这里只负责挑场景、切模式、传参数——
 * 一千行挤在一个组件里时，改跟读要滚过整个跟打。
 */

export function DialogueScreen() {
  const p = useGame(s => s.p);
  const settings = useGame(s => s.s);
  const finishScene = useGame(s => s.finishScene);
  const addCustom = useGame(s => s.addCustomScene);
  const removeCustom = useGame(s => s.removeCustomScene);
  const [importing, setImporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  // 一轮复习的题单要在开始时定死：答题会改写 due，边答边算会让题越练越少
  const [session, setSession] = useState<PhraseItem[]>([]);
  const [bank, setBank] = useState<DBank | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const pending = useGame(s => s.pendingScene);
  const consumePending = useGame(s => s.consumePendingScene);
  // 从首页「今日对话」进来时直接打开那一场
  const [openId, setOpenId] = useState<string | null>(pending);

  useEffect(() => {
    if (!pending) return;
    setOpenId(pending);
    consumePending();
  }, [pending, consumePending]);

  useEffect(() => {
    let alive = true;
    void loadDialogues().then(j => {
      if (!alive || !j) return;
      const bad = validate(j);
      if (bad.length) console.warn('[dialogue] 语料有问题：', bad);
      setBank(j);
    }).catch(e => { if (alive) setErr(String(e.message ?? e)); });
    return () => { alive = false; };
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  // 自建对话排在最前，内置的按原顺序跟在后面
  const all: Scene[] = bank ? [...p.customScenes, ...bank.scenes] : p.customScenes;
  const scene = all.find(s => s.id === openId) ?? null;
  const done = all.filter(s => p.scenes[s.id]).length;

  // 句型池只收「练过的那几场」，否则 40 句一起涌进来没人扛得住
  const pool = useMemo(() => unlockedPhrases(all, p.scenes), [all, p.scenes]);
  const dueCount = useMemo(() => pendingCount(pool, p.phrases, dayNo()), [pool, p.phrases]);

  if (err) {
    return (
      <div className="dg">
        <div className="page-head">
          <div>
            <h1 className="page-title">场景对话</h1>
            <div className="page-sub">语料加载失败：{err}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="dg">
        <div className="page-head">
          <div>
            <h1 className="page-title">场景对话</h1>
            <div className="page-sub">正在载入对话…</div>
          </div>
        </div>
      </div>
    );
  }

  if (reviewing) {
    return (
      <PhraseDrill
        items={session}
        accent={settings.voice}
        rate={settings.rate}
        onExit={() => setReviewing(false)}
      />
    );
  }

  if (scene) {
    return (
      <SceneView
        key={scene.id}
        scene={scene}
        onBack={() => { stopSpeaking(); setOpenId(null); }}
        onFinish={(score, words, as) => finishScene(scene.id, score, words, as)}
      />
    );
  }

  return (
    <div className="dg">
      <div className="page-head">
        <div>
          <h1 className="page-title">场景对话</h1>
          <div className="page-sub">
            {all.length} 场对话（其中自建 {p.customScenes.length} 场） · 已练{' '}
            <em className="dg-em">{done}</em> 场 · 背打时打错的词，当晚进夜巡
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => setImporting(true)}>导入自己的对话</button>
      </div>

      {p.customScenes.length === 0 && (
        <div className="dg-empty">
          课本里的对话、自己写的台词都能贴进来练 —— 五种练法一样能用，
          只是没有现成的岔路。点右上角试试。
        </div>
      )}

      {pool.length > 0 && (
        <button
          className="dg-pe"
          onClick={() => {
            setSession(pickSession(pool, p.phrases, dayNo(), 8));
            setReviewing(true);
          }}
        >
          <span className="dg-pe-tag">句型复习</span>
          <span className="dg-pe-body">
            <b>{dueCount > 0 ? `${dueCount} 句待复习` : '今天的句型都复习过了'}</b>
            <em>来自你练过的 {done} 场对话 · 共收 {pool.length} 句</em>
          </span>
          <span className="dg-pe-go">{dueCount > 0 ? '开始' : '再看看'}</span>
        </button>
      )}

      <div className="dg-grid">
        {all.map(sc => {
          const stat = p.scenes[sc.id];
          const mine = yourLines(sc).length;
          const custom = p.customScenes.some(x => x.id === sc.id);
          return (
            <div className="dg-cell" key={sc.id}>
            <button className={`dg-card${stat ? ' done' : ''}`} onClick={() => setOpenId(sc.id)}>
              <div className="dg-card-top">
                <span className="dg-cat">{sc.cat}</span>
                {/* 自建场的 cefr 是「自定」，跟左侧标签重复，不如不显示 */}
                {!custom && <span className="dg-cefr">{sc.cefr}</span>}
                {stat && !custom && (
                  <span
                    className="dg-check"
                    title={stat.swapBest != null ? '两个角色都练过' : `最好 ${stat.best}%`}
                  >
                    {stat.swapBest != null ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
              <div className="dg-name">{sc.name}</div>
              <div className="dg-set">{sc.setting}</div>
              <div className="dg-card-foot">
                <span>
                  {mine} 句你的台词{sc.phrases.length > 0 ? ` · ${sc.phrases.length} 个句型` : ''}
                </span>
                <span className="dg-bests">
                  {stat && stat.best > 0 && <em className="dg-best">最好 {stat.best}%</em>}
                  {stat?.swapBest != null && <em className="dg-best swap">换角 {stat.swapBest}%</em>}
                  {stat?.liveBest != null && <em className="dg-best swap">实战 {stat.liveBest}%</em>}
                </span>
              </div>
            </button>
            {custom && (
              <button
                className="dg-del"
                title="删除这场对话"
                onClick={() => {
                  if (confirm(`删除「${sc.name}」？练过的成绩也会一起清掉。`)) removeCustom(sc.id);
                }}
              >
                ✕
              </button>
            )}
            </div>
          );
        })}
      </div>

      {importing && (
        <ImportScene
          onCancel={() => setImporting(false)}
          onSave={sc => {
            addCustom(sc);
            setImporting(false);
            setOpenId(sc.id);
          }}
        />
      )}
    </div>
  );
}

function SceneView({
  scene,
  onBack,
  onFinish,
}: {
  scene: Scene;
  onBack: () => void;
  onFinish: (score: number, words: { w: string; ok: boolean }[], as: Role | 'live') => void;
}) {
  const settings = useGame(s => s.s);
  const corpus = useCorpus();
  const known = useMemo(() => (w: string) => !!corpus.dict.get(w)?.z, [corpus]);
  const [mode, setMode] = useState<Mode>('read');
  const [role, setRole] = useState<Role>('you');
  const nYou = linesOf(scene, 'you').length;
  const nOther = scene.lines.length - nYou;
  const otherName = scene.roles[1 - scene.you] ?? '对方';

  return (
    <div className="dg dg-scene">
      <div className="dg-scene-head">
        <button className="dg-back" onClick={onBack}>‹ 全部场景</button>
        <div className="dg-scene-meta">
          <h1 className="page-title">{scene.name}</h1>
          <div className="page-sub">
            {scene.cat} · {scene.cefr} · {scene.lines.length} 句 · 对方是{scene.roles[1 - scene.you] ?? '对话方'}
          </div>
        </div>
        <div className="seg dg-tabs">
          {MODES.map(m => (
            <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => { stopSpeaking(); setMode(m.id); }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dg-setting">{scene.setting}</div>

      {/* 角色互换：练对方的话，才逼自己先听懂再开口 */}
      {mode !== 'read' && mode !== 'live' && (
        <div className="dg-roles">
          <span className="dg-roles-label">练谁</span>
          <div className="seg">
            <button className={role === 'you' ? 'on' : ''} onClick={() => setRole('you')}>
              你 · {nYou} 句
            </button>
            <button className={role === 'other' ? 'on' : ''} onClick={() => setRole('other')}>
              {otherName} · {nOther} 句
            </button>
          </div>
          <span className="dg-roles-hint">
            {role === 'other' ? '换角：先听懂对方说什么，再替他说出来' : '默认练你自己的台词'}
          </span>
        </div>
      )}

      {mode === 'read' && <Reader scene={scene} accent={settings.voice} rate={settings.rate} />}

      {mode === 'speak' && (
        <Speak
          scene={scene}
          accent={settings.voice}
          rate={settings.rate}
          known={known}
          role={role}
          onExit={onBack}
          onType={() => setMode('copy')}
          onFinish={(score, words) => onFinish(score, words, role)}
        />
      )}

      {mode === 'live' && (
        <Live
          key="live"
          scene={scene}
          accent={settings.voice}
          rate={settings.rate}
          known={known}
          onExit={onBack}
          onFinish={(score, words) => onFinish(score, words, 'live')}
        />
      )}

      {(mode === 'copy' || mode === 'recall') && (
          <Drill
            key={`${mode}-${role}`}
            scene={scene}
            mode={mode}
            accent={settings.voice}
            rate={settings.rate}
            known={known}
            role={role}
            onExit={onBack}
            onFinish={(score, words) => onFinish(score, words, role)}
          />
      )}
    </div>
  );
}
