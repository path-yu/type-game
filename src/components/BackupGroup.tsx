import { useRef, useState } from 'react';
import { useGame } from '../lib/store';
import { buildBackup, fileName, parseBackup, summarize, whenLabel, type Parsed } from '../lib/backup';

/**
 * 设置里的「数据」分组：导出 / 导入进度。
 *
 * 全部学习记录只在一个 localStorage 键里 —— 清一次站点数据就归零，
 * 换台机器也带不走。这里给出唯一的逃生通道。
 *
 * 导入是**覆盖**，不是合并：合并要处理两份 FSRS 时间线谁赢的问题，
 * 处理不好会把好不容易积累的排期搅乱。所以宁可让用户看清两边的数字再选。
 */
export function BackupGroup() {
  const p = useGame(x => x.p);
  const restore = useGame(x => x.restore);

  const file = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<Parsed | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const current = summarize(buildBackup(p, useGame.getState().s));

  const doExport = () => {
    const b = buildBackup(useGame.getState().p, useGame.getState().s);
    const name = fileName();
    const blob = new Blob([JSON.stringify(b)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg({ kind: 'ok', text: `已导出 ${name}（${summarize(b).words} 个词）` });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null);
    try {
      const text = await f.text();
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setPending(null);
        setMsg({ kind: 'err', text: `${f.name}：${parsed.error}` });
        return;
      }
      setPending(parsed);
    } catch {
      setMsg({ kind: 'err', text: `${f.name} 读不出来` });
    }
  };

  const confirm = () => {
    if (!pending?.data) return;
    restore(pending.data.p, pending.data.s);
    setPending(null);
    setMsg({ kind: 'ok', text: '已覆盖为备份里的档案' });
  };

  const cancel = () => {
    setPending(null);
    setMsg(null);
    if (file.current) file.current.value = '';
  };

  return (
    <div className="set-group">
      <div className="set-group-title">数据</div>

      <div className="set-row">
        <div className="set-label">
          <b>进度备份</b>
          <span>
            现在有 {current.words} 个词的记录、{current.runs} 篇成绩、{current.scenes} 场对话。
            记录只存在这台机器上，换设备或清缓存前先导出一份。
          </span>
        </div>
        <div className="bk-acts">
          <button className="btn btn-ghost bk-export" onClick={doExport}>导出</button>
          <button className="btn btn-ghost bk-import" onClick={() => file.current?.click()}>导入</button>
        </div>
      </div>

      <input
        ref={file}
        className="bk-file"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={e => onFile(e.target.files?.[0])}
      />

      {msg && <div className={`bk-msg ${msg.kind}`}>{msg.text}</div>}

      {pending && (
        <div className="bk-confirm">
          <div className="bk-confirm-head">
            这份备份会<b>覆盖</b>当前档案
            <em>{whenLabel(pending.summary?.at ?? '')}</em>
          </div>

          <div className="bk-cmp">
            <div>
              <span>当前</span>
              <b>{current.words} 词 · {current.learned} 已掌握 · {current.runs} 篇 · 连续 {current.streak} 天</b>
            </div>
            <div className="in">
              <span>备份</span>
              <b>
                {pending.summary?.words ?? 0} 词 · {pending.summary?.learned ?? 0} 已掌握 ·{' '}
                {pending.summary?.runs ?? 0} 篇 · 连续 {pending.summary?.streak ?? 0} 天
              </b>
            </div>
          </div>

          {pending.warnings.length > 0 && (
            <ul className="bk-warn">
              {pending.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}

          <div className="bk-confirm-acts">
            <button className="btn btn-ghost bk-cancel" onClick={cancel}>取消</button>
            <button className="btn btn-primary bk-confirm-go" onClick={confirm}>覆盖并导入</button>
          </div>
        </div>
      )}
    </div>
  );
}
