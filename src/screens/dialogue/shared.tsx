import type { Scene } from '../../lib/dialogue';

/** 一场对话的练法。前四档可以换角色，实战固定用「你」的视角 */
export type Mode = 'read' | 'copy' | 'recall' | 'speak' | 'live';

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'read', label: '通读', hint: '看懂这场对话，点句子听发音' },
  { id: 'copy', label: '跟打', hint: '照着打你的台词，练到手指记住' },
  { id: 'recall', label: '背打', hint: '只看中文，把英文说出来' },
  { id: 'speak', label: '跟读', hint: '对着麦克风说这句话，看它能不能听懂' },
  { id: 'live', label: '实战', hint: '整场走一遍，对方会突然不按剧本来' },
];

/** 三个练习组件共用的入口参数 */
export interface PracticeProps {
  scene: Scene;
  accent: 'us' | 'uk';
  rate: number;
  /** 词库里有没有这个词的中文释义——没有的错词不进夜巡，否则是空牌 */
  known: (w: string) => boolean;
  onFinish: (score: number, words: { w: string; ok: boolean }[]) => void;
}

/** 练习进度：第 i + 1 步 / 共 total 步 */
export function StepBar({ i, total }: { i: number; total: number }) {
  return (
    <div className="dg-bar">
      <span className={i + 1 === total ? 'end' : ''}>{i + 1} / {total}</span>
      <i><b style={{ width: `${(i / total) * 100}%` }} /></i>
    </div>
  );
}
