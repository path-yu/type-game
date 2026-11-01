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
  const all: Scene[] = useMemo(
    () => (bank ? [...p.customScenes, ...bank.scenes] : p.customScenes),
    [bank, p.customScenes],
  );
  const scene = all.find(s => s.id === openId) ?? null;
  const done = all.filter(s => p.scenes[s.id]).length;

  // 句型池只收「练过的那几场」，否则 40 句一起涌进来没人扛得住
  const pool = useMemo(() => unlockedPhrases(all, p.scenes), [all, p.scenes]);
  const dueCount = useMemo(() => pendingCount(pool, p.phrases, dayNo()), [pool, p.phrases]);

  /* ---- 筛选与分组：一千场之后，翻卡片找场景是不现实的 ---- */
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('全部');
  const [lv, setLv] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

  const customIds = useMemo(() => new Set(p.customScenes.map(x => x.id)), [p.customScenes]);

  const cats = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of all) m.set(s.cat, (m.get(s.cat) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const matched = useMemo(() => {
    const k = q.trim().toLowerCase();
    return all.filter(s =>
      (cat === '全部' || s.cat === cat)
      && (lv === 0 || s.lv === lv)
      && (!k
        || s.name.toLowerCase().includes(k)
        || s.cat.includes(k)
        || s.setting.toLowerCase().includes(k)
        || s.lines.some(l => l.en.toLowerCase().includes(k) || l.zh.includes(k)))
    );
  }, [all, cat, lv, q]);

  // 同一段情境骨架的变体收成一组：一千张平铺的卡片没法浏览
  const groups = useMemo(() => {
    const m = new Map<string, Scene[]>();
    for (const s of matched) {
      const key = s.g ?? (customIds.has(s.id) ? '__custom' : s.id);
      const list = m.get(key);
      if (list) list.push(s);
      else m.set(key, [s]);
    }
    return [...m].map(([key, list]) => ({ key, list }));
  }, [matched, customIds]);

  const shown = groups.slice(0, page * 12);

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
        onFinish={(score, words, as, br) => finishScene(scene.id, score, words, as, br)}
      />
    );
  }

  return (
    <div className="dg">
      <div className="page-head">
        <div>
          <h1 className="page-title">场景对话</h1>
          <div className="page-sub">
            {all.length} 场对话 · {groups.length} 个情境 · 已练{' '}
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

      {/* 上千场之后，靠翻卡片找场景是不现实的 */}
      <div className="dg-filters">
        <input
          className="dg-search"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="搜场景：退换货 / 面试 / 没货 / forgot"
        />
        <div className="dg-chips">
          {['全部', ...cats.map(([k]) => k)].map(k => (
            <button
              key={k}
              className={`dg-chip${cat === k ? ' on' : ''}`}
              onClick={() => { setCat(k); setPage(1); }}
            >
              {k}
              <em>{k === '全部' ? all.length : (cats.find(([c]) => c === k)?.[1] ?? 0)}</em>
            </button>
          ))}
        </div>
        <div className="dg-chips dg-chips-lv">
          <button className={`dg-chip${lv === 0 ? ' on' : ''}`} onClick={() => { setLv(0); setPage(1); }}>全部难度</button>
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <button key={n} className={`dg-chip${lv === n ? ' on' : ''}`} onClick={() => { setLv(n); setPage(1); }}>
              L{n}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <div className="dg-empty">没有匹配的场景，换个词试试。</div>}

      {shown.map(({ key, list }) => {
        const isOpen = !!open[key] || !!q.trim();
        const cards = isOpen ? list : list.slice(0, 2);
        const okN = list.filter(s => p.scenes[s.id]).length;
        return (
          <section className="dg-group" key={key}>
            {list.length > 1 && (
              <div className="dg-group-head">
                <span className="dg-group-name">{baseName(list[0])}</span>
                <span className="dg-group-meta">
                  {list[0].cat} · {list[0].cefr} · {list.length} 种情形
                  {okN > 0 ? ` · 已练 ${okN}` : ''}
                </span>
              </div>
            )}
            <div className="dg-grid">
              {cards.map(sc => (
                <SceneCard
                  key={sc.id}
                  scene={sc}
                  stat={p.scenes[sc.id]}
                  custom={customIds.has(sc.id)}
                  solo={list.length === 1}
                  onOpen={() => setOpenId(sc.id)}
                  onDelete={() => {
                    if (confirm(`删除「${sc.name}」？练过的成绩也会一起清掉。`)) removeCustom(sc.id);
                  }}
                />
              ))}
            </div>
            {!isOpen && list.length > 2 && (
              <button className="dg-more" onClick={() => setOpen(o => ({ ...o, [key]: true }))}>
                还有 {list.length - 2} 种情形
              </button>
            )}
          </section>
        );
      })}

      {shown.length < groups.length && (
        <button className="dg-loadmore" onClick={() => setPage(n => n + 1)}>
          还有 {groups.length - shown.length} 个情境 · 继续看
        </button>
      )}

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

/** 组头用骨架名，卡片用变体名（「咖啡店点单」/「想坐一会儿」） */
function baseName(s: Scene): string {
  const i = s.name.indexOf(' · ');
  return i < 0 ? s.name : s.name.slice(0, i);
}
function tagName(s: Scene): string {
  const i = s.name.indexOf(' · ');
  return i < 0 ? s.name : s.name.slice(i + 3);
}

function SceneCard({
  scene, stat, custom, solo, onOpen, onDelete,
}: {
  scene: Scene;
  stat: { best: number; swapBest?: number | null; liveBest?: number | null } | undefined;
  custom: boolean;
  solo: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const mine = yourLines(scene).length;
  return (
    <div className="dg-cell">
      <button className={`dg-card${stat ? ' done' : ''}`} data-scene={scene.id} onClick={onOpen}>
        <div className="dg-card-top">
          {solo && <span className="dg-cat">{scene.cat}</span>}
          {!custom && <span className="dg-cefr">{scene.cefr}</span>}
          {stat && !custom && (
            <span className="dg-check" title={stat.swapBest != null ? '两个角色都练过' : `最好 ${stat.best}%`}>
              {stat.swapBest != null ? '✓✓' : '✓'}
            </span>
          )}
        </div>
        <div className="dg-name">{tagName(scene)}</div>
        <div className="dg-set">{scene.setting}</div>
        <div className="dg-card-foot">
          <span>
            {mine} 句你的台词
            {scene.branch ? ' · 1 处岔路' : ''}
          </span>
          <span className="dg-bests">
            {stat && stat.best > 0 && <em className="dg-best">最好 {stat.best}%</em>}
            {stat?.swapBest != null && <em className="dg-best swap">换角 {stat.swapBest}%</em>}
            {stat?.liveBest != null && <em className="dg-best swap">实战 {stat.liveBest}%</em>}
          </span>
        </div>
      </button>
      {custom && (
        <button className="dg-del" title="删除这场对话" onClick={onDelete}>✕</button>
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
  onFinish: (
    score: number,
    words: { w: string; ok: boolean }[],
    as: Role | 'live',
    branch?: { kind: string; ok: boolean }
  ) => void;
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
          onFinish={(score, words, br) => onFinish(score, words, 'live', br)}
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
