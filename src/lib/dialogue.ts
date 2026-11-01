/**
 * 场景对话：纯逻辑层（不碰 DOM、不碰 fetch），浏览器与 Node 测试共用。
 *
 * 设计要点：
 * - 比对前先归一化（小写 / 去标点 / 折空白），否则「少了逗号」会被判成错，
 *   而对话练习要考的是能不能把这句话说出来，不是标点。
 * - 错位用**归一化后的下标**表示，再回推是哪个词错了 —— 只有出错的那几个词
 *   才进夜巡。整句 8 个词全部记一遍错误，会把掌握度砸得毫无意义。
 */

import { editDistance } from './confuse';

export interface DLine {
  r: number;         // 角色下标（0 = 你，1 = 对方）
  en: string;
  zh: string;
  note?: string;     // 用法提示（习语 / 语法 / 文化）
}

/** 岔路里的一句（对方的意外发言 / 你的应对 / 对方的反应） */
export interface DSay {
  en: string;
  zh: string;
  note?: string;
}

export interface BranchOption {
  say: DSay;     // 你可以这么接
  react: DSay;   // 对方听完的反应（顶替原本那一句）
}

/**
 * 岔路：对方在某个点上不按剧本说话。
 *
 * `at` 指的是**你的**某句台词的下标 —— 岔路接在这句之后。
 * 紧接着的那句对方的台词会被 `options[].react` 顶替（两条路各自有各自的反应），
 * 再往后从你的下一句接回主线。这个结构由 validate() 强制。
 */
export interface Branch {
  at: number;
  /** 这是哪一类意外 —— 报告里据此看「你最容易卡在哪种情况」 */
  kind: BranchKind;
  task: string;      // 你要达到的目的（中文，不泄露说法）
  prompt: DSay;      // 对方的意外发言
  options: BranchOption[];
}

/**
 * 岔路的类型。
 *
 * 分类不是为了做目录，是为了**诊断**：「实战 52 分」说明不了什么，
 * 「你卡住的三次里有两次是对方要加钱」才指向下一步该练什么。
 */
export type BranchKind = 'short' | 'cost' | 'change' | 'probe' | 'offer' | 'other';

export const BRANCH_KINDS: Record<BranchKind, string> = {
  short: '东西没了',
  cost: '要加钱',
  change: '流程变了',
  probe: '被追问',
  offer: '对方提议',
  // 自建对话里没标类型的岔路都归到这里 —— 猜一个更接近的标签是在编数据
  other: '其他意外',
};

export const isBranchKind = (k: unknown): k is BranchKind =>
  typeof k === 'string' && k in BRANCH_KINDS;

export interface DPhrase {
  en: string;
  zh: string;
  tip?: string;
}

export interface Scene {
  id: string;
  name: string;
  cat: string;
  lv: number;        // 1-7，与城区难度对齐
  cefr: string;
  setting: string;
  roles: string[];   // [你, 对方]
  you: number;       // 「你」在 roles 里的下标
  lines: DLine[];
  phrases: DPhrase[];
  branch?: Branch;
}

export interface DBank {
  v: number;
  scenes: Scene[];
}

/** 比对时忽略的虚词：它们错了也不值得单独进复习队列 */
const STOP = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'but',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'that', 'this',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'me', 'us', 'them',
  'do', 'does', 'did', 'so', 'if', 'as', 'by', 'with', 'from', 'just', 'not',
  // 对话里高频出现、但没有记忆价值的：记进夜巡只是噪音
  'could', 'would', 'should', 'please', 'thanks', 'thank', 'sorry', 'hello',
  'yeah', 'okay', 'what', 'where', 'when', 'why', 'how', 'can', 'will',
  'have', 'has', 'had', 'there', 'here', 'then', 'also', 'really', 'well',
  'some', 'any', 'get', 'got', 'like', 'want',
]);

interface Scan {
  norm: string;
  /** 归一化后每个字符属于原句的第几个词 */
  owner: number[];
  /** 原句的词（含大小写，去掉标点） */
  words: string[];
}

/**
 * 把一句话拆成「归一化字符串 + 每个字符的词归属」。
 *
 * 撇号既不参与比对也不切断单词（I'm 打 im 也算对）；
 * 连字符当作分词（front-end 打 front end 也算对）。
 */
export function scan(line: string): Scan {
  const chars: string[] = [];
  const owner: number[] = [];
  const words: string[] = [];
  let inWord = false;
  for (const ch of line) {
    if (/[A-Za-z0-9]/.test(ch)) {
      if (!inWord) {
        words.push('');
        inWord = true;
      }
      const idx = words.length - 1;
      words[idx] += ch;
      chars.push(ch.toLowerCase());
      owner.push(idx);
    } else if (ch === "'" || ch === '\u2019') {
      // 撇号：不进归一化，也不结束单词 —— 但留在 words 里，
      // 否则 That's 会变成 thats，词库里查不到，夜巡里就成了没释义的空词。
      if (inWord) words[words.length - 1] += ch;
      continue;
    } else {
      inWord = false;
    }
  }
  return { norm: chars.join(''), owner, words };
}

/** 归一化：小写、去标点、折空白。用于宽松比对。 */
export function normalize(s: string): string {
  return scan(s).norm;
}

export interface DiffResult {
  ok: boolean;
  /** 归一化下标，出错的位置 */
  wrong: number[];
  /** 少了多少个字符（打不全时为正） */
  missing: number;
}

/** 逐字符比对。只有完全一致才算对 —— 但标点、大小写、撇号都不计较。 */
export function diff(target: string, typed: string): DiffResult {
  const t = normalize(target);
  const y = normalize(typed);
  if (t === y) return { ok: true, wrong: [], missing: 0 };
  const n = Math.min(t.length, y.length);
  const wrong: number[] = [];
  for (let i = 0; i < n; i++) if (t[i] !== y[i]) wrong.push(i);
  // 长度不同但前面全对：把差异归到折断点，别记成整句错
  if (wrong.length === 0) wrong.push(Math.min(n, t.length - 1));
  return { ok: false, wrong, missing: Math.max(0, t.length - y.length) };
}

/**
 * 出错的位置回推成词。只返回值得进复习队列的词：
 * 长度 ≥4、不是虚词、去重。
 */
export function errorWords(line: string, wrongAt: number[]): string[] {
  if (!wrongAt.length) return [];
  const { owner, words } = scan(line);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const at of wrongAt) {
    const raw = words[owner[Math.max(0, Math.min(at, owner.length - 1))]];
    if (!raw) continue;
    // Monday's → monday，That's → that；剩下的字母才拿去查词库
    const low = raw.replace(/'s$/i, '').toLowerCase().replace(/[^a-z]/g, '');
    if (low.length < 4 || STOP.has(low) || seen.has(low)) continue;
    seen.add(low);
    out.push(low);
  }
  return out;
}

/**
 * 空位提示：每个词画成等长的下划线。
 * 比一串 • • • 有用 —— 词数和词长就是最基础的脚手架，又不泄露字母。
 */
export function maskOf(line: string): string {
  return maskWords(line).join('  ');
}

/**
 * 按词拆开的空位。
 *
 * 用空格连接的字符串在等宽字体里靠「两个空格」区分词边界，字距一拉就看不清了；
 * 拆成数组交给 flex 排版，词与词之间才有真正的间隙。
 */
export function maskWords(line: string): string[] {
  return scan(line).words.map(w => '_'.repeat(w.replace(/'/g, '').length));
}

/** 首字母提示：Could I get a large latte? → C I g a l l */
export function initials(line: string): string {
  return scan(line).words.map(w => w[0]).join(' ');
}

export type Role = 'you' | 'other';

/**
 * 按角色取台词。
 *
 * 默认只练「你」的话；换成 other 就是**角色互换** —— 练对方的台词。
 * 换角不是重复劳动：对方的话你得先听懂，再替他说出来，压力完全不同。
 */
export function linesOf(scene: Scene, as: Role = 'you'): DLine[] {
  return scene.lines.filter(l => (as === 'you' ? l.r === scene.you : l.r !== scene.you));
}

export type Step =
  | { kind: 'line'; line: DLine }
  | { kind: 'branch'; branch: Branch };

/**
 * 把「主线 + 岔路」摊成一条时间线。
 *
 * 岔路接在你第 at 句之后，同时**吃掉**原本第 at+1 句（对方的台词）——
 * 因为两种应对各自有各自的反应，那句主线台词不再是唯一的下文了。
 */
export function timelineOf(scene: Scene): Step[] {
  const b = scene.branch;
  if (!b) return scene.lines.map(line => ({ kind: 'line', line }));
  const out: Step[] = [];
  scene.lines.forEach((line, i) => {
    if (i === b.at + 1) return;
    out.push({ kind: 'line', line });
    if (i === b.at) out.push({ kind: 'branch', branch: b });
  });
  return out;
}

/** 时间线里需要你自己开口的次数（你的台词 + 岔路） */
export function typedSteps(scene: Scene): number {
  return timelineOf(scene).filter(s => s.kind === 'branch' || s.line.r === scene.you).length;
}

/** 这一场里需要你打的句子 */
export function yourLines(scene: Scene): DLine[] {
  return linesOf(scene, 'you');
}

/* ------------------------- 跟读判分 ------------------------- */

/** 常见缩写的展开：识别器常把 I'm 写成 I am，两边都展开才能对齐 */
function spokenWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/n't\b/g, ' not')
    .replace(/'re\b/g, ' are')
    .replace(/'ll\b/g, ' will')
    .replace(/'ve\b/g, ' have')
    .replace(/'m\b/g, ' am')
    .replace(/'d\b/g, ' would')
    .replace(/'s\b/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * 两个词算不算「说对了」。
 *
 * 允许一个字母的出入（iced / ice、latte / lattes）—— 识别器对词尾变化本来就不稳。
 * 但只有较长的那一边 ≥4 字母才放宽：cat / car 差一个字母是两个完全不同的词，
 * 在口语里听错就是听错了，不该算过。
 */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.max(a.length, b.length) < 4) return false;
  return editDistance(a, b, 1) <= 1;
}

export interface SayResult {
  /** 逐词判对，用于给用户看哪里没说清 */
  words: { w: string; ok: boolean }[];
  matched: number;
  total: number;
  /** 多说了几个词（不扣分，只提示） */
  extra: number;
  ratio: number;
  pass: boolean;
}

/**
 * 跟读判分：按**词**对齐，不按字符。
 *
 * 语音识别本来就有误差（口音、连读、麦克风），字符级比对会把「说得很好但识别错了一个词」
 * 判成灾难。用最长公共子序列对齐后，容忍 20% 的词没被识别出来 ——
 * 但 3 个词的短句必须全对，因为短句里漏一个就是漏了一半意思。
 */
export function scoreSay(target: string, said: string): SayResult {
  const t = spokenWords(target);
  const s = spokenWords(said);
  const n = t.length;
  const m = s.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = sameWord(t[i - 1], s[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const ok = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (sameWord(t[i - 1], s[j - 1]) && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ok[i - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }

  const matched = dp[n][m];
  const allow = Math.floor(n / 5);          // 20% 的容错，短句自动收紧到 0
  return {
    words: t.map((w, k) => ({ w, ok: ok[k] })),
    matched,
    total: n,
    extra: m - matched,
    ratio: n ? matched / n : 0,
    pass: n > 0 && matched >= n - allow,
  };
}

/**
 * 结构校验：返回问题清单（空数组＝合格）。
 * 构建期与测试共用，避免手写语料时漏字段。
 */
export function validate(bank: DBank): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(bank?.scenes) || bank.scenes.length < 3) bad.push('场景数少于 3');

  for (const s of bank?.scenes ?? []) {
    const tag = s.id || '(无 id)';
    if (!s.id) bad.push('有空 id');
    else if (ids.has(s.id)) bad.push(`${tag} id 重复`);
    ids.add(s.id);

    if (!s.name) bad.push(`${tag} 缺名字`);
    if (!s.setting) bad.push(`${tag} 缺情境描述`);
    if (!(s.lv >= 1 && s.lv <= 7)) bad.push(`${tag} 难度越界：${s.lv}`);
    if (!/^[ABC][12]\+?$/.test(s.cefr ?? '')) bad.push(`${tag} CEFR 不合法：${s.cefr}`);
    if (s.roles?.length !== 2) bad.push(`${tag} 角色必须是两个`);
    if (!(s.you >= 0 && s.you < 2)) bad.push(`${tag} you 下标越界`);
    if (s.lines?.length < 6) bad.push(`${tag} 台词少于 6 句`);

    let mine = 0;
    for (const [i, l] of (s.lines ?? []).entries()) {
      const at = `${tag}#${i}`;
      if (!(l.r >= 0 && l.r < 2)) bad.push(`${at} 角色越界`);
      if (l.r === s.you) mine++;
      if (!l.en) bad.push(`${at} 缺英文`);
      else {
        if (/[^\x20-\x7E]/.test(l.en)) bad.push(`${at} 英文含非 ASCII 字符`);
        if (!/[.!?]$/.test(l.en)) bad.push(`${at} 英文没有句末标点`);
        if (scan(l.en).words.length < 2) bad.push(`${at} 英文太短`);
      }
      if (!l.zh) bad.push(`${at} 缺中文`);
      else if (!/[\u4e00-\u9fa5]/.test(l.zh)) bad.push(`${at} 中文不含汉字`);
    }
    if (mine < 3) bad.push(`${tag} 你的台词少于 3 句（没法练）`);

    const b = s.branch;
    if (b) {
      const checkSay = (say: DSay | undefined, where: string) => {
        if (!say?.en || !say?.zh) { bad.push(`${where} 缺字段`); return; }
        if (/[^\x20-\x7E]/.test(say.en)) bad.push(`${where} 英文含非 ASCII 字符`);
        if (!/[.!?]$/.test(say.en)) bad.push(`${where} 英文没有句末标点`);
        if (!/[\u4e00-\u9fa5]/.test(say.zh)) bad.push(`${where} 中文不含汉字`);
      };
      if (!(b.at >= 0 && b.at < (s.lines?.length ?? 0))) bad.push(`${tag} 岔路位置越界：${b.at}`);
      else {
        if (s.lines[b.at].r !== s.you) bad.push(`${tag} 岔路必须接在你的台词之后`);
        const next = s.lines[b.at + 1];
        if (!next) bad.push(`${tag} 岔路后面没有可被顶替的台词`);
        else if (next.r === s.you) bad.push(`${tag} 岔路后面应该是对方的台词（react 要顶替它）`);
        const back = s.lines[b.at + 2];
        if (back && back.r !== s.you) bad.push(`${tag} 岔路结束后应接回你的台词`);
      }
      if (!isBranchKind(b.kind)) bad.push(`${tag} 岔路类型非法：${String(b.kind)}`);
      if (!b.task || !/[\u4e00-\u9fa5]/.test(b.task)) bad.push(`${tag} 岔路缺目标说明`);
      checkSay(b.prompt, `${tag} 岔路 prompt`);
      if (!(b.options?.length >= 2)) bad.push(`${tag} 岔路少于两个选项`);
      for (const [k, o] of (b.options ?? []).entries()) {
        checkSay(o.say, `${tag} 岔路选项${k}.say`);
        checkSay(o.react, `${tag} 岔路选项${k}.react`);
      }
    }
    if ((s.phrases?.length ?? 0) < 2) bad.push(`${tag} 句型少于 2 条`);
    for (const [i, p] of (s.phrases ?? []).entries()) {
      if (!p.en || !p.zh) bad.push(`${tag} 句型 #${i} 缺字段`);
      if (p.zh && !/[\u4e00-\u9fa5]/.test(p.zh)) bad.push(`${tag} 句型 #${i} 中文不含汉字`);
    }
  }
  return bad;
}

/** 语料只有一份，两个页面（对话 / 体检报告）共用同一个请求 */
let bankCache: DBank | null = null;

export async function loadDialogues(): Promise<DBank | null> {
  if (bankCache) return bankCache;
  try {
    const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    const res = await fetch(`${base}data/dialogues.json`);
    if (!res.ok) return null;
    bankCache = (await res.json()) as DBank;
    return bankCache;
  } catch {
    return null;
  }
}

/** 场景总进度：已完成的场景数 / 总数 */
export function sceneProgress(bank: DBank, done: Record<string, unknown>): { done: number; total: number } {
  const total = bank.scenes.length;
  const n = bank.scenes.filter(s => done[s.id]).length;
  return { done: n, total };
}
