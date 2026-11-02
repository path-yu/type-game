import { useEffect, useState } from 'react';
import {
  appInfo, isDesktop, openDataDir, pickDataDir, resetDataDir, setDataDir, type AppInfo,
} from '../lib/native';

/**
 * 设置里的「数据目录」分组。
 *
 * 桌面端的学习进度是一个 progress.json（16 KB 左右），默认躺在
 * %APPDATA%\com.typewake.app\ 里。这个位置对普通用户来说既找不到也记不住，
 * 想把档案放进同步盘（或者干脆放 U 盘随身带）就只能靠改快捷方式，没道理。
 *
 * 换目录时只复制不删除：换目录这件事出错代价太大，旧文件留着让用户自己确认。
 */
export function DataDirGroup() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const refresh = async () => setInfo(await appInfo());

  useEffect(() => { void refresh(); }, []);

  // 浏览器里没有本地目录这回事
  if (!isDesktop()) return null;

  const choose = async () => {
    setMsg(null);
    const picked = await pickDataDir();
    if (!picked) return;
    setBusy(true);
    const ok = await setDataDir(picked);
    setBusy(false);
    if (ok) {
      await refresh();
      setMsg({ kind: 'ok', text: '已切换，进度已复制过去；原位置的文件保留着，确认无误后可自行删除。' });
    } else {
      setMsg({ kind: 'err', text: '切换失败，目录可能不可写。已保持原设置。' });
    }
  };

  const reset = async () => {
    setBusy(true);
    const ok = await resetDataDir();
    setBusy(false);
    if (ok) {
      await refresh();
      setMsg({ kind: 'ok', text: '已回到默认位置。自定义目录里的文件没有动。' });
    }
  };

  return (
    <div className="set-group">
      <div className="set-group-title">数据目录</div>

      <div className="set-about">
        <div>
          <span>存放位置</span>
          <em className="dir-path">{info?.dataDir || '读取中…'}</em>
        </div>
        <div>
          <span>里面有什么</span>
          <em>progress.json（全部学习进度）· runs.jsonl（每次结算的记录）· ready.json（启动自检）</em>
        </div>
        {info?.custom && (
          <div>
            <span>默认位置</span>
            <em className="dir-path">{info.defaultDir}</em>
          </div>
        )}
      </div>

      <div className="set-row">
        <div className="set-label">
          <b>更换位置</b>
          <span>放到同步盘或移动硬盘，换台电脑接着练</span>
        </div>
        <div className="dir-acts">
          <button className="btn btn-ghost" disabled={busy} onClick={() => void openDataDir()}>
            打开文件夹
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => void choose()}>
            更换目录
          </button>
          {info?.custom && (
            <button className="btn btn-ghost" disabled={busy} onClick={() => void reset()}>
              恢复默认
            </button>
          )}
        </div>
      </div>

      {msg && <div className={`set-msg ${msg.kind}`}>{msg.text}</div>}
    </div>
  );
}
