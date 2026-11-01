/**
 * 自定义对话：把用户粘进来的材料解析成 Scene。
 *
 * 格式只有一条：`角色: 英文 | 中文`，`我:` 开头的那一方就是要练的你。
 *
 * ```
 * # 咖啡店点单
 * > 工作日的早晨，街角咖啡店
 * 店员: Hi, what can I get you? | 你好，要点什么？
 * 我: A latte, please. | 一杯拿铁，谢谢。
 * ```
 *
 * 为什么要中文：背打只给中文当题干，实战只给中文当目标。没有中文，
 * 这两种练法就退化成抄写 —— 与其偷偷降级，不如要求用户补上。
 * 通读和跟打其实只需要英文，这一点在错误的措辞里会说明。
 */
import type { DLine, Scene } from './dialogue';

export interface ParseResult {
  scene: Scene | null;
  /** 硬错误：有一条就不能导入 */
  errors: string[];
  /** 提醒：能导入，但可能不是用户想要的 */
  warnings: string[];
}

/** 例句：界面上的「照这个样子写」用这一份，测试也用它 */
export const SAMPLE = `# 咖啡店点单
> 工作日的早晨，街角咖啡店
店员: Hi, what can I get started for you? | 你好，想喝点什么？
我: Could I get a large latte, please? | 我要一杯大杯拿铁，谢谢。
店员: Sure. Hot or iced? | 好的。热的还是冰的？
我: Iced, please. | 冰的，谢谢。
店员: That'll be five dollars. | 一共五块。`;

/** 「我」的各种写法 */
const ME = /^(我|你|自己|me|i)$/i;

/** 把中文输入法带出来的弯引号、破折号折成 ASCII —— 否则英文里藏着全角字符，判分对不上 */
function ascii(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');
}

function hasCJK(s: string): boolean {
  return /[\u4e00-\u9fa5]/.test(s);
}

/**
 * @param text 用户粘贴的原文
 * @param id   新建场景的 id（由调用方生成，保持这个函数是纯的）
 */
export function parseDialogue(text: string, id = 'custom'): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  const lines: DLine[] = [];
  const order: string[] = [];   // 角色出现的顺序，第一个非「我」的就是对方

  let name = '';
  let setting = '';

  raw.forEach((rawLine, i) => {
    const at = i + 1;
    const line = rawLine.trim();
    if (!line) return;
    if (line.startsWith('//')) return;

    if (line.startsWith('#')) {
      if (!name) name = line.replace(/^#+\s*/, '').trim();
      return;
    }
    if (line.startsWith('>')) {
      if (!setting) setting = line.replace(/^>\s*/, '').trim();
      return;
    }

    // 角色名 + 冒号：中文冒号也认
    const m = /^([^:：]{1,12})\s*[:：]\s*(.+)$/.exec(line);
    if (!m) {
      errors.push(`第 ${at} 行看不出角色 —— 每行要以「角色:」开头`);
      return;
    }

    const who = m[1].trim();
    if (!who) {
      errors.push(`第 ${at} 行缺角色名`);
      return;
    }

    const body = m[2];
    const cut = body.search(/[|｜]/);
    if (cut < 0) {
      errors.push(`第 ${at} 行缺中文 —— 写成「${who}: 英文 | 中文」`);
      return;
    }

    const en = ascii(body.slice(0, cut)).trim().replace(/^["']|["']$/g, '');
    const zh = body.slice(cut + 1).trim().replace(/^["'“”]|["'“”]$/g, '');

    if (!en) { errors.push(`第 ${at} 行英文是空的`); return; }
    if (!/[A-Za-z]/.test(en)) { errors.push(`第 ${at} 行英文里没有字母`); return; }
    if (/[^\x20-\x7E]/.test(en)) {
      const bad = [...new Set(en.match(/[^\x20-\x7E]/g) ?? [])].join(' ');
      errors.push(`第 ${at} 行英文里有全角字符「${bad}」，请改成半角`);
      return;
    }
    if (!zh) { errors.push(`第 ${at} 行中文是空的`); return; }
    if (!hasCJK(zh)) { errors.push(`第 ${at} 行的中文里没有汉字`); return; }

    if (!order.includes(who)) order.push(who);
    lines.push({ r: ME.test(who) ? 0 : 1, en, zh });
  });

  if (!name) name = '我的对话';
  if (!setting) setting = '你自己导入的对话';

  const me = lines.filter(l => l.r === 0).length;
  const others = lines.filter(l => l.r === 1).length;
  const otherNames = order.filter(w => !ME.test(w));

  if (!lines.length) errors.push('没有解析出任何一句台词');
  else {
    if (!me) errors.push('没有找到「我:」开头的台词 —— 用「我:」标出你要练的那一方');
    else if (me < 2) warnings.push('你只有一句台词，背打和实战练不出什么');
    if (!others) errors.push('至少要有一句对方的台词，否则不成对话');
    if (lines.length < 4) warnings.push('台词少于 4 句，练个两三遍就腻了');
    if (otherNames.length > 1) warnings.push(`对方出现了 ${otherNames.length} 个角色（${otherNames.join(' / ')}），都会按同一个「对方」处理`);
    if (!name || name === '我的对话') warnings.push('没写「# 场景名」，先用「我的对话」代称');
  }

  if (errors.length) return { scene: null, errors, warnings };

  const scene: Scene = {
    id,
    name,
    cat: '自建',
    lv: 3,
    cefr: '自定',
    setting,
    roles: ['我', otherNames[0] ?? '对方'],
    you: 0,
    // 对方的话 r=1，哪怕用户写了两个不同角色名
    lines: lines.map(l => (l.r === 0 ? l : { ...l, r: 1 })),
    phrases: [],
  };
  return { scene, errors, warnings };
}

/** 导入后给用户看的摘要 */
export function describe(scene: Scene): string {
  const mine = scene.lines.filter(l => l.r === scene.you).length;
  return `${scene.lines.length} 句 · 你 ${mine} 句 · 对方是${scene.roles[1]}`;
}
