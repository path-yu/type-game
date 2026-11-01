import { useMemo, useState } from 'react';
import { SAMPLE, describe, parseDialogue } from '../../lib/custom';
import type { Scene } from '../../lib/dialogue';

/**
 * 导入对话：一个文本框 + 实时校验。
 *
 * 不要求用户理解我们的数据结构，但必须让他们知道「为什么需要中文」——
 * 背打靠中文当题干，实战靠中文当目标，缺了就只能退回抄写。
 */
export function ImportScene({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (scene: Scene) => void;
}) {
  const [text, setText] = useState('');

  const parsed = useMemo(() => (text.trim() ? parseDialogue(text) : null), [text]);
  const scene = parsed?.scene ?? null;
  const errors = parsed?.errors ?? [];
  const warnings = parsed?.warnings ?? [];

  const save = () => {
    if (!scene) return;
    onSave({ ...scene, id: `my-${Date.now().toString(36)}` });
  };

  return (
    <div className="dg-import" onClick={onCancel}>
      <div className="dg-import-card" onClick={e => e.stopPropagation()}>
        <div className="dg-import-head">
          <h2>导入一场对话</h2>
          <button className="dg-import-x" onClick={onCancel} aria-label="关闭">✕</button>
        </div>

        <div className="dg-import-hint">
          一行一句：<b>角色: 英文 | 中文</b>。用「我:」标出你要练的那一方，
          其余角色都算对方。<b>中文不能省</b>——背打拿它当题干，实战拿它当目标。

          <details className="dg-import-more">
            <summary>想加一处岔路（对方突然改口）</summary>
            <p>
              在你<b>自己要说的那句后面</b>接两行：<br />
              <code>? 类型 | 目标 | 对方的话 | 中文</code><br />
              <code>+ 你的应对 | 中文 &gt; 对方的反应 | 中文</code><br />
              「+」至少要两行。类型可以省（省了算「其他意外」），也可以写
              东西没了 / 要加钱 / 流程变了 / 被追问 / 对方提议。
            </p>
            <p>
              注意：岔路后面那句对方的台词会被两种「反应」顶替 —— 它只是主线的默认走法。
            </p>
          </details>
        </div>

        <textarea
          className="dg-import-ta"
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck={false}
          placeholder={SAMPLE}
          rows={14}
        />

        <div className="dg-import-row">
          <button className="dg-link" onClick={() => setText(SAMPLE)}>填入示例</button>
          <button className="dg-link" onClick={() => setText('')}>清空</button>
          <span className="dg-import-count">
            {parsed && scene ? describe(scene) : parsed ? `${errors.length} 处需要修` : '还没开始'}
          </span>
        </div>

        {errors.length > 0 && (
          <ul className="dg-import-err">
            {errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 6 && <li>还有 {errors.length - 6} 条…</li>}
          </ul>
        )}
        {warnings.length > 0 && (
          <ul className="dg-import-warn">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}

        <div className="dg-import-acts">
          <button className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" disabled={!scene} onClick={save}>
            {scene ? '导入并开始练' : '先写对格式'}
          </button>
        </div>
      </div>
    </div>
  );
}
