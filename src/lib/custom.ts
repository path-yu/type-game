/**
 * 自定义对话：把用户粘进来的材料解析成 Scene。
 *
 * 基本格式只有一条：`角色: 英文 | 中文`，`我:` 开头的那一方就是要练的你。
 *
 * ```
 * # 咖啡店点单
 * > 工作日的早晨，街角咖啡店
 * 店员: Hi, what can I get you? | 你好，要点什么？
 * 我: A latte, please. | 一杯拿铁，谢谢。
 * ```
 *
 * 为什么坚持要中文：背打只给中文当题干，实战只给中文当目标。没有中文，
 * 这两种练法就退化成抄写 —— 与其偷偷降级，不如要求用户补上。
 *
 * 岔路是可选的两种行：
 * ```
 * ? 要加钱 | 卡付不了，给个能走下去的办法 | Sorry, the card machine is down. | 抱歉，刷卡机坏了。
 * + That's fine, I've got cash. | 没事，我有现金。 > What name for the cup? | 杯子上写什么？
 * + Could I pay by phone? | 我能用手机付吗？ > Sure, just tap here. | 好的，在这儿碰一下。
 * ```
 */
import {
  BRANCH_KINDS,
  type Branch, type BranchKind, type BranchOption, type DLine, type DSay, type Scene,
} from './dialogue';

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
? 要加钱 | 卡刷不了，给个能继续走下去的办法 | Sorry, the card machine is down. It's cash only today. | 抱歉，刷卡机坏了，今天只收现金。
+ That's fine, I've got cash. | 没事，我有现金。 > Perfect. That's five dollars. | 好的，一共五块。
+ Could I pay by phone instead? | 我能用手机付吗？ > Sure, just tap here. That's five dollars. | 可以，在这儿碰一下。一共五块。
店员: Here's your receipt. | 这是您的小票。`;

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

/** 岔路类型：中英文都认（`cost` / `要加钱`），省略则归到「其他意外」 */
const KIND_ALIAS: Record<string, BranchKind> = (() => {
  const map: Record<string, BranchKind> = {};
  for (const [k, label] of Object.entries(BRANCH_KINDS)) {
    map[k.toLowerCase()] = k as BranchKind;
    map[label] = k as BranchKind;
  }
  return map;
})();

function asKind(s: string): BranchKind | null {
  const t = s.trim();
  return KIND_ALIAS[t.toLowerCase()] ?? KIND_ALIAS[t] ?? null;
}

/** 一段 `英文 | 中文`；`what` 用来区分是台词还是岔路里的一句 */
function pair(at: number, body: string, what: string, errors: string[]): DSay | null {
  const cut = body.search(/[|｜]/);
  if (cut < 0) {
    errors.push(`第 ${at} 行${what}缺中文 —— 写成「英文 | 中文」`);
    return null;
  }
  const en = ascii(body.slice(0, cut)).trim().replace(/^["']|["']$/g, '');
  const zh = body.slice(cut + 1).trim().replace(/^["'“”]|["'“”]$/g, '');
  if (!checkPair(at, en, zh, what, errors)) return null;
  return { en, zh };
}

function checkPair(at: number, en: string, zh: string, what: string, errors: string[]): boolean {
  if (!en) { errors.push(`第 ${at} 行${what}英文是空的`); return false; }
  if (!/[A-Za-z]/.test(en)) { errors.push(`第 ${at} 行${what}英文里没有字母`); return false; }
  if (/[^\x20-\x7E]/.test(en)) {
    const bad = [...new Set(en.match(/[^\x20-\x7E]/g) ?? [])].join(' ');
    errors.push(`第 ${at} 行${what}英文里有全角字符「${bad}」，请改成半角`);
    return false;
  }
  if (!zh) { errors.push(`第 ${at} 行${what}中文是空的`); return false; }
  if (!hasCJK(zh)) { errors.push(`第 ${at} 行${what}的中文里没有汉字`); return false; }
  return true;
}

/** 正在写的那处岔路 */
interface Draft {
  line: number;    // `?` 所在行号
  at: number;      // 挂在第几句「我」之后（lines 的下标）
  kind: BranchKind;
  task: string;
  prompt: DSay;
  options: BranchOption[];
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
  let draft: Draft | null = null;
  // 收口的岔路放在对象里：TS 不跟踪闭包里的 let 赋值，
  // 直接写 `let done: Branch | null` 会让 `if (done)` 收窄成 never
  const fin: { branch: Branch | null; line: number } = { branch: null, line: 0 };
  let branchLine = 0;

  /** 岔路写完（或换了话题）时收口 */
  const closeDraft = () => {
    if (!draft) return;
    if (draft.options.length < 2) {
      errors.push(`第 ${draft.line} 行的岔路只有 ${draft.options.length} 个应对 —— 「+」至少写两行，否则不叫岔路`);
    } else if (!fin.branch) {
      fin.branch = {
        at: draft.at, kind: draft.kind, task: draft.task,
        prompt: draft.prompt, options: draft.options,
      };
      fin.line = draft.line;
    }
    draft = null;
  };

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

    /* ---------- 岔路：对方的意外发言 ---------- */
    if (line.startsWith('?')) {
      if (draft) closeDraft();
      if (branchLine) {
        errors.push(`第 ${at} 行：一场对话只能写一处岔路（第 ${branchLine} 行已经有一处）`);
        return;
      }
      branchLine = at;
      const last = lines.length - 1;
      if (last < 0 || lines[last].r !== 0) {
        errors.push(`第 ${at} 行：岔路要接在「我:」的台词后面 —— 它替换的是你这句话之后对方的回应`);
        return;
      }

      const seg = line.slice(1).split(/[|｜]/).map(x => x.trim());
      let kind: BranchKind = 'other';
      let task = '';
      let en = '';
      let zh = '';

      if (seg.length === 3) {
        [task, en, zh] = seg;
      } else if (seg.length === 4) {
        const k = asKind(seg[0]);
        if (!k) {
          errors.push(
            `第 ${at} 行岔路类型「${seg[0]}」不认识 —— 可写 ${Object.entries(BRANCH_KINDS)
              .map(([, label]) => label).join(' / ')}，或者整段省掉（写三个分段）`
          );
          return;
        }
        kind = k;
        [, task, en, zh] = seg;
      } else {
        errors.push(`第 ${at} 行岔路写成「? 类型 | 目标 | 英文 | 中文」，类型可以省`);
        return;
      }

      if (!task || !hasCJK(task)) {
        errors.push(`第 ${at} 行岔路缺「目标」—— 写清这一步你打算达成什么（中文，不是台词）`);
        return;
      }
      const prompt = pair(at, `${en} | ${zh}`, '岔路台词', errors);
      if (!prompt) return;

      draft = { line: at, at: last, kind, task, prompt, options: [] };
      return;
    }

    /* ---------- 岔路：你的应对 + 对方的反应 ---------- */
    if (line.startsWith('+')) {
      if (!draft) {
        errors.push(`第 ${at} 行的「+」前面没有「?」—— 先写一行「? 目标 | 对方的话」，再写应对`);
        return;
      }
      const body = line.slice(1).trim();
      const gt = body.indexOf('>');
      if (gt < 0) {
        errors.push(`第 ${at} 行没写对方的反应 —— 写成「+ 你的英文 | 中文 > 对方英文 | 中文」`);
        return;
      }
      const say = pair(at, body.slice(0, gt), '应对', errors);
      const react = pair(at, body.slice(gt + 1), '反应', errors);
      if (!say || !react) return;
      draft.options.push({ say, react });
      return;
    }

    /* ---------- 普通台词 ---------- */
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

    const said = pair(at, m[2], '', errors);
    if (!said) return;

    if (draft) closeDraft();
    if (!order.includes(who)) order.push(who);
    lines.push({ r: ME.test(who) ? 0 : 1, en: said.en, zh: said.zh });
  });

  closeDraft();

  // 岔路的 at+1 会被反应顶替，所以它必须是对方的台词
  const nb = fin.branch;
  if (nb) {
    const next = lines[nb.at + 1];
    if (next && next.r === 0) {
      errors.push(
        `第 ${fin.line} 行：岔路后面那句会是对方的台词（它会被两种应对的反应顶替）—— ` +
        '请把你要说的下一句挪到岔路块之后'
      );
    }
  }

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
    branch: fin.branch ?? undefined,
  };
  return { scene, errors, warnings };
}

/** 导入后给用户看的摘要 */
export function describe(scene: Scene): string {
  const mine = scene.lines.filter(l => l.r === scene.you).length;
  const b = scene.branch ? ` · ${scene.branch.options.length} 条路` : '';
  return `${scene.lines.length} 句 · 你 ${mine} 句 · 对方是${scene.roles[1]}${b}`;
}
