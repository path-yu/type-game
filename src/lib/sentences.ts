import type { Corpus } from './data';
import { lemmaOf } from './data';
import { splitSentences } from './split.js';

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Gloss {
  surface: string;
  key: string;
  zh: string;
  ipa?: string;
  tier: number;
}

// 切句规则唯一定义在 split.js —— 导出/校验脚本共用同一份，避免两边漂移
export { splitSentences };

/** 光标落在第几句 */
export function sentenceAt(sents: Sentence[], idx: number): number {
  for (let i = 0; i < sents.length; i++) {
    if (idx < sents[i].end) return i;
  }
  return Math.max(0, sents.length - 1);
}

const TOKEN = /[A-Za-z][A-Za-z'-]*/g;

/** 释义只留前三条 —— 胶囊只有一行宽，堆七八个义项反而没人看得下去 */
export function brief(zh: string): string {
  const parts = zh.split(/[,，;；]/).map(x => x.trim()).filter(Boolean);
  return parts.slice(0, 3).join(', ');
}

/* 前一个词能告诉我们这个词在干什么 —— stranger 不是 strange 的比较级，
   saw 也不是锯子。先把句法信号排出来，词形规则只当兜底。 */
const P_SUBJ = /^(i|you|he|she|it|we|they|who|which)$/i;
const P_MODAL = /^(can|could|will|would|shall|should|may|might|must|do|does|did|won't|can't|don't|doesn't|didn't|isn't|wasn't)$/i;
const P_BE = /^(am|is|are|was|were|be|been|being)$/i;
const P_HAVE = /^(have|has|had)$/i;

/**
 * 缩写展开：I'm / we've / it's 不展开的话，前面的系动词、助动词信号全丢，
 * 「I'm opening」会被当成「opening = n. 开始」。
 */
function prevCore(w: string): string {
  const m = /^(?:[A-Za-z]+)?(n't|'m|'re|'ve|'ll|'d|'s)$/i.exec(w);
  if (!m) return w;
  const to: Record<string, string> = {
    "n't": 'not', "'m": 'am', "'re": 'are', "'ve": 'have',
    "'ll": 'will', "'d": 'would', "'s": 'is',
  };
  return to[m[1].toLowerCase()] ?? w;
}

/**
 * 「to + 名词」的常见搭配：这些是介词用法，不能当不定式。
 * 只收真正高频的实词搭配 —— 更全的清单要语料统计，这里只挡住最刺眼的几条。
 */
const TO_NOUN = new Set([
  'school', 'bed', 'town', 'work', 'church', 'sea', 'market', 'hand', 'day', 'night',
  'pieces', 'piece', 'order', 'me', 'you', 'him', 'her', 'them', 'us', 'it',
  'this', 'that', 'which', 'whom', 'one', 'another', 'others',
]);
const P_CMP = /^(than|much|far|even|still|so|too)$/i;
const P_DET = /^(a|an|the|this|that|these|those|his|her|their|its|my|your|our|some|any|no|every|each|another)$/i;
const P_PREP = /^(in|on|at|of|for|with|by|from|into|about|after|before|under|over|through|without|within|upon|against|between|during|toward|towards|near|behind|beyond|across|like)$/i;

/**
 * -ly 结尾但不是副词（更多是名词或形容词）。这些词不套「-ly = 副词」的规则，
 * 否则 butterfly 会被当成副词、early 会被当成「提前地」。
 */
const LY_NOT_ADV = /^(friendly|lovely|lonely|likely|early|daily|weekly|monthly|yearly|hourly|only|silly|ugly|holy|elderly|orderly|deadly|costly|kindly|leisurely|manly|womanly|heavenly|ghostly|fatherly|motherly|brotherly|scholarly|curly|jolly|assembly|family|italy|jelly|belly)$/i;

/**
 * 词典义项的顺序不等于常用度 —— multiply 头一个义项是"繁殖"，
 * 摆在"异议成倍增长"这句话下面读着就像机翻。这张表只给实测中真被
 * 误解的几个词开小口子，不做成第二本词典。
 */
const GLOSS_HINT: Record<string, string> = {
  multiply: '增加',
  objection: '反对',
  unfamiliar: '不熟悉的',
  according: '根据',
};

const linesOf = (t?: string) => (t || '').split('\n').map(x => x.trim()).filter(Boolean);

/**
 * 词根兜底：making / opening / changed 在词库里自成词条，lemma 也是它自己，
 * 于是永远只看得到它们的名词义项（making → n. 制造），
 * 「be making」就翻成了名词。这里往词根再找一层，只取带动词义项的。
 */
function baseOf(corpus: Corpus, w: string): string {
  const cands: string[] = [];
  if (/ies$/.test(w)) cands.push(`${w.slice(0, -3)}y`);
  if (/(ing|ed)$/.test(w)) {
    const stem = w.replace(/(ing|ed)$/, '');
    cands.push(stem, `${stem}e`);
    // beginning → begin（去 ing 后剩 beginn，去掉叠字）
    if (/([b-df-hj-np-tv-z])\1$/.test(stem)) cands.push(stem.slice(0, -1));
  }
  if (/es$/.test(w)) cands.push(w.slice(0, -2));
  if (/s$/.test(w) && !/ss$/.test(w)) cands.push(w.slice(0, -1));

  for (const c of cands) {
    if (!c || c === w) continue;
    const e = corpus.dict.get(c);
    if (e?.z && /^(vt|vi|v)\./im.test(e.z)) return e.z;
  }
  return '';
}

/**
 * 一个词往往有"两本账"：它自己的条目（stranger → n. 陌生人）和归一后的原形条目
 * （strange → a. 奇怪的）。句法决定该翻哪一本：
 *   主语代词 / 情态动词后面 → 原形（I saw → see，it means → mean）
 *   冠词、介词、系动词后面 → 自己（the evening、was born、was tired）
 */
export function pickZh(
  z: string,
  surface: string,
  prev = '',
  atEnd = false,
  ownZ = '',
  next = '',
  nextIsNoun = false,
  /** 词根本体的释义（making / opening 在词库里自成词条时，用它兜底找动词义项） */
  baseZ = '',
): string {
  const s = surface.toLowerCase();
  const p = prevCore(prev.trim());
  const nx = next.trim();
  // to + 实词：不定式（to protest）远比介词（to school）常见，例外表挡掉后者
  const infSignal = /^to$/i.test(p) && !TO_NOUN.has(s);
  const verbSignal = P_SUBJ.test(p) || P_MODAL.test(p) || infSignal;
  const ownFirst = !!ownZ && !verbSignal && !P_CMP.test(p);
  const pools = ownFirst ? [ownZ, z] : [z, ownZ];

  const want: RegExp[] = [];
  // -ly 是最强的形态信号：排在句法信号之前。
  // 「it was earnestly said」里前一个词是 it（本该是主语代词），但 earnestly 仍是副词。
  // 词库常常没有 -ly 副词自己的条目（gravely 不在库里），退一步取它的形容词义项
  // 也好过取原形的名词义（grave → n. 墓穴）
  // 只是**排在前面**，不是独占：supply / reply / apply 也以 -ly 结尾，
  // 它们前面出现情态动词时仍要按动词处理，所以下面那条链照常接上。
  if (/ly$/.test(s) && !LY_NOT_ADV.test(s)) want.push(/^adv\./i, /^(a|adj)\./i);
  if (P_CMP.test(p)) want.push(/^(a|adj)\./i, /^adv\./i);
  else if (verbSignal) want.push(/^(vt|vi|v|aux)\./i);
  else if (P_BE.test(p) || P_HAVE.test(p)) {
    // be/have + -ing 多半是进行时（I'm opening），先找动词；
    // + -ed 两种都常见（was changed / was tired），形容词排在前面更安全
    if (/ing$/.test(s)) want.push(/^(vt|vi|v)\./i, /^(a|adj)\./i);
    else if (/ed$/.test(s)) want.push(/^(a|adj)\./i, /^(vt|vi|v)\./i);
    else want.push(/^(a|adj)\./i);
  }
  else if (P_DET.test(p)) {
    // 冠词后面跟着名词，那这个词多半是定语（an unknown stranger）；否则它自己就是名词（the evening）
    if (nx && nextIsNoun) want.push(/^(a|adj)\./i, /^n\./i);
    else want.push(/^n\./i, /^(a|adj)\./i);
  } else if (P_PREP.test(p)) want.push(/^n\./i, /^(a|adj)\./i);

  // 句法没给出信号时，才退回到词形判断
  if (!want.length) {
    if (/(ied|ed|ing)$/.test(s)) want.push(/^(vt|vi|v)\./i);
    else if (/(ies|es|s)$/.test(s) && !/ss$/.test(s)) want.push(/^(vt|vi|v)\./i, /^(n)\./i);
    else if (/ly$/.test(s)) want.push(/^adv\./i);
    // 有独立条目的词不按比较级处理（stranger / longer / others 都有自己的义项）
    else if (/(er|est)$/.test(s) && !ownZ) want.push(/^(a|adj)\./i);
  }
  // 出现在句末又带 adv. 义项，多半是状语（it was all dark overhead）
  if (atEnd && pools.some(pool => /^adv\./im.test(pool))) want.unshift(/^adv\./i);

  // 先在自己那本账里按信号找完，确实没有才去翻原形 ——
  // a stranger harpooneer 里 stranger 没有形容词义项，它就是个名词，
  // 不该顺着 strange 借一个 a. 奇怪的 过来。
  // 两级搜索：
  //   ①「自己的账」（含词根，making 的动词义项只在 make 里）
  //   ②「原形的账」
  // 每一级内部按词性优先级走。反过来（一本账翻到底再换下一本）opening 会拿到
  // a. 开始的；而全局按词性走，an unknown stranger 又会借到 strange 的 a. 奇怪的。
  const primary = ownFirst ? ownZ : z;
  const secondary = ownFirst ? z : ownZ;
  const tiers = [
    [primary, baseZ].filter(Boolean).map(linesOf),
    [secondary].filter(Boolean).map(linesOf),
  ];
  for (const tier of tiers) {
    for (const re of want) {
      for (const lines of tier) {
        const hit = lines.find(l => re.test(l));
        if (hit) return hit;
      }
    }
  }
  // 没有任何信号命中：自己那本账比原形更贴切
  return linesOf(ownFirst ? ownZ : z)[0] || linesOf(z)[0] || '';
}

/** 词典义项里命中 hint 的那一条单独拿出来 —— 命中不了就返回 null，走正常挑义项的路径 */
export function hintZh(z: string, hint?: string): string | null {
  if (!hint) return null;
  for (const line of linesOf(z)) {
    const parts = line.split(/[,，]/).map(x => x.trim()).filter(Boolean);
    const at = parts.findIndex(p => p.includes(hint));
    if (at < 0) continue;
    const pos = (parts[0].match(/^([a-z]+)\.\s*/i) || [])[1] || '';
    const frag = parts[at].replace(/^[a-z]+\.\s*/i, '');
    return pos ? `${pos}. ${frag}` : frag;
  }
  return null;
}

/**
 * 专名过滤：句首之外的词若首字母大写，多半是人名地名（Darling、Munchkin），
 * 词库里往往只有它作为普通词的无关义项，列出来只会误导。
 */
function isProperNoun(surface: string, atSentenceStart: boolean): boolean {
  if (atSentenceStart) return false;
  return /^[A-Z]/.test(surface) && !/^[A-Z]{2,}$/.test(surface);
}

/**
 * 句子里的"值得看"的词：三档以上词频、或词库外但够长的词。
 * 已经掌握（mastery ≥ 70）的不再列出。
 */
export function glossOf(
  corpus: Corpus,
  sentence: string,
  mastery: Record<string, { m: number }>,
  limit = 6
): Gloss[] {
  const seen = new Set<string>();
  const out: Gloss[] = [];
  const toks = [...sentence.matchAll(TOKEN)].map(x => ({ surface: x[0], index: x.index ?? 0 }));
  const nounish = (w: string) => {
    if (!w) return false;
    if (P_PREP.test(w) || P_MODAL.test(w) || P_BE.test(w) || P_DET.test(w)) return false;
    // 先看这个词自己的条目 —— stranger 被归到 strange，但它是名词
    const e = corpus.dict.get(w.toLowerCase()) ?? corpus.dict.get(lemmaOf(corpus, w));
    return /^n\./im.test(e?.z || '');
  };
  let prev = '';
  let first = true;
  const tail = sentence.replace(/[\s.!?"'”’)\]]+$/, '').length;
  for (let i = 0; i < toks.length; i++) {
    const { surface, index } = toks[i];
    const key = lemmaOf(corpus, surface);
    const atStart = first;
    const before = prev;
    const atEnd = index + surface.length >= tail;
    const next = toks[i + 1]?.surface ?? '';
    prev = surface;
    first = false;
    if (seen.has(key)) continue;
    seen.add(key);
    if (isProperNoun(surface, atStart)) continue;
    // 语料里统计出来的专名（Matthew / Munchkin / Thornfield）：
    // 句首也能挡住 —— 单靠「首字母大写 + 非句首」永远抓不到句首那些。
    if (corpus.names.has(surface)) continue;

    const e = corpus.dict.get(key);
    const tier = e?.t ?? 0;
    const worth = tier >= 3 || (tier === 2 && key.length >= 6) || (tier === 0 && key.length >= 5);
    if (!worth) continue;

    if (!e?.z) continue;              // 词库没有释义的不列，免得显示"—"

    // 这个词自己也可能在词库里另有条目（stranger 有 n. 陌生人，saw 有 n. 锯子），
    // 归一后的原形释义不一定对得上眼前这句，交给 pickZh 按上下文挑。
    const own = surface.toLowerCase().replace(/[^a-z']/g, '');
    const ownEntry = own !== key ? corpus.dict.get(own) : undefined;
    // 派生词自成词条时（making/opening），往词根找一层带动词义项的释义
    const baseZ = own === key ? baseOf(corpus, own) : '';

    // 分词/过去式用法：词条里连动词义项都没有时，拿名词义（coming → n. 来临）解释只会误导。
    // 除非能顺着词根找到动词义项（coming → come → v. 来）。
    const noVerb =
      /(ing|ed)$/i.test(surface) && !/^(vt|vi|v)\./im.test(e.z) && /^n\./im.test(e.z);
    if (noVerb && !baseZ) continue;

    const st = mastery[key];
    if (st && st.m >= 70) continue;

    const zh = hintZh(`${ownEntry?.z || ''}\n${e.z}`, GLOSS_HINT[key])
      ?? brief(pickZh(e.z, surface, before, atEnd, ownEntry?.z, next, nounish(next), baseZ));
    out.push({
      surface,
      key,
      zh,
      ipa: ownEntry?.p ?? e?.p,
      tier,
    });
    if (out.length >= limit) break;
  }
  // 越靠后（越生僻）排越前
  return out.sort((a, b) => b.tier - a.tier).slice(0, limit);
}
