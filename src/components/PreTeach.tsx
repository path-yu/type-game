import { useEffect, useMemo, useRef, useState } from 'react';
import { useCorpus } from '../lib/CorpusContext';
import { brief } from '../lib/sentences';
import type { WordEntry } from '../lib/types';

/**
 * 预习卡 —— 先测后学。
 *
 * 进入正文之前，把本篇的生词先"考"一遍：只给中文释义和首字母，要你回忆出英文。
 * 答对答错都行，答错会亮出答案。
 *
 * 为什么值得先考一遍：现在整篇文章是照着英文打的，视觉线索太强，几乎不产生回忆负荷。
 * 先做一次提取练习（retrieval practice），后续再打同一批词时记忆强度明显更高 ——
 * 这就是 pretesting effect，即使先测时全错也有效。
 */

interface Props {
  words: string[];
  onDone: (results: { word: string; ok: boolean }[]) => void;
}

/** 打乱顺序，避免总是按文中出现顺序背 */
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** 词形提示：a _ _ _ _（首字母 + 长度） */
const mask = (w: string) => w[0] + ' ' + '_ '.repeat(Math.max(0, w.length - 1)).trim();

export function PreTeach({ words, onDone }: Props) {
  const corpus = useCorpus();
  const list = useMemo(
    () => shuffle(words.filter(w => corpus.dict.get(w)?.z)).slice(0, 6),
    [words, corpus]
  );
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState('');
  const [state, setState] = useState<'ask' | 'right' | 'wrong'>('ask');
  const results = useRef<{ word: string; ok: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = list[idx];
  const entry: WordEntry | undefined = target ? corpus.dict.get(target) : undefined;
  // 释义里的括号注释要摘掉 —— "v. 热爱（love 的过去分词）" 等于把答案写在题面上
  const zh = (entry?.z || '')
    .split('\n')[0]
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim();

  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  const finish = () => onDone(results.current);

  const submit = () => {
    if (!target) return;
    if (state === 'ask') {
      const ok = val.trim().toLowerCase() === target.toLowerCase();
      results.current.push({ word: target, ok });
      setState(ok ? 'right' : 'wrong');
      // 答对就没必要停留，给一眼确认就走
      if (ok) window.setTimeout(() => next(), 520);
      return;
    }
    next();
  };

  const next = () => {
    if (idx + 1 >= list.length) { finish(); return; }
    setIdx(i => i + 1);
    setVal('');
    setState('ask');
  };

  // 没有可考的词就直接放行（不能在这里 setState，会打断渲染）
  if (!list.length) return null;

  return (
    <div className="pre">
      <div className="pre-card">
        <div className="pre-head">
          <span className="pre-label">开打之前 · 先认一认</span>
          <span className="pre-count">{idx + 1} / {list.length}</span>
        </div>

        <div className="pre-zh">{zh ? brief(zh) : '（词库未收录）'}</div>
        <div className="pre-mask">{state === 'wrong' ? target : mask(target)}</div>

        {state === 'ask' ? (
          <input
            ref={inputRef}
            className="pre-input"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); submit(); }
              e.stopPropagation();
            }}
            placeholder="打出这个单词，回车确认"
            spellCheck={false}
            autoComplete="off"
          />
        ) : (
          <div className={`pre-fb ${state}`}>
            {state === 'right' ? '✓ 记得' : `✗ 是 ${target}`}
          </div>
        )}

        <div className="pre-dots">
          {list.map((w, i) => {
            const r = results.current[i];
            return <i key={w} className={r ? (r.ok ? 'ok' : 'no') : i === idx ? 'cur' : ''} />;
          })}
        </div>

        <div className="pre-foot">
          <button className="pre-skip" onClick={finish}>跳过预习</button>
          <button className="pre-go" onClick={submit}>
            {state === 'ask' ? '确认' : idx + 1 >= list.length ? '开始打字' : '下一个'}
            <span className="kbd">Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
