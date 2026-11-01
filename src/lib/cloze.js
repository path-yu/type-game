/**
 * 阅读填空：从一篇既有文章里挖空，让用户在上下文中把词填回来。
 *
 * 与「夜巡」的区别：夜巡是**脱离上下文**的单词回忆（看中文打英文）；
 * 填空是**在上下文里**补全，考的是搭配、时态、介词，以及"这个位置应该是什么词性"。
 *
 * 选词原则（按重要性排序）：
 *  1. **优先半熟词**（掌握度 20–70）。太生的词填不出来只会挫败，太熟的词填了也没收获。
 *  2. **必须是内容词**（有中文释义、Tier ≥ 2）。空 the / of 这种虚词没有练习价值。
 *  3. **避开专名**。`Matthew` 挖空了只能靠记住原文，学不到东西。
 *  4. **控制间距**。两个空太近会让整句失去可推断性——留够上下文才好猜。
 */

/**
 * @typedef {{ raw: string, key: string, start: number, end: number }} Token
 * @typedef {{ start: number, end: number }} Sentence
 * @typedef {{
 *   articleId: string,
 *   text: string,
 *   tokens: Token[],
 *   sentences: Sentence[],
 *   names: Set<string>,
 *   dict: Map<string, { z?: string, t?: number }>,
 *   mastery: Record<string, { m: number }>,
 *   count?: number,
 *   seed?: string,
 * }} ClozeInput
 */

/** FNV-1a：把 seed 揉成稳定整数，保证同一篇文章每次挖同样的空 */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 功能词黑名单。
 * 入门文章（L1/L2）几乎全是 Tier 1 高频词，如果直接要求 Tier ≥ 2，候选会所剩无几；
 * 所以改成「高频词里只排除真正的虚词」——the / that / with 这类挖空没有练习价值，
 * 但 business / speaking 这种同样是高频的内容词应该保留。
 */
const STOP = new Set((
  'the and that with have this from they will your what when which there their would could should been were was ' +
  'for but not you are his her she him has had its our out all can may who whom whose into than then them these ' +
  'those such some any only very just also even more most much many does did doing being about after before again ' +
  'against because while where why how too off over under between during without within upon shall must might'
).split(' '));

/** 半熟词优先级：介于"认识一点"和"基本会"之间最值得练 */
function scoreOf(entry, m) {
  let s = 0;
  if (m < 20) s += 2;            // 生词：能填出来收益最大，但失败率也高
  else if (m < 70) s += 3;       // 半熟：最佳区间
  else if (m < 90) s += 1;       // 熟：只当保持
  else s -= 2;                   // 很熟：不挖
  if ((entry.t ?? 1) >= 3) s += 1;   // 低频词更有区分度
  return s;
}

/**
 * 生成填空。
 * @param {ClozeInput} input
 * @returns {{ blanks: Array<{ answer: string, key: string, zh: string, firstChar: string, start: number, end: number, sentence: number }>, segments: Array<{ text: string } | { blank: number }>, count: number }}
 */
export function buildCloze(input) {
  const { articleId, text, tokens, sentences, names, dict, mastery = {} } = input;
  const seed = input.seed ?? articleId;

  // 每句最多挖几个空：按句长分配（约每 60 字符一个，上限 3）。
  // 全文不足 5 句时放宽到每句 2 个 —— 否则短文章连 4 个空都凑不出来，练习太单薄。
  const dense = sentences.length <= 5 ? 2 : 1;
  const perSentence = sentences.map(s =>
    Math.max(dense, Math.min(6, Math.round((s.end - s.start) / 55)))
  );

  /** @type {{ tok: Token, sent: number, score: number, tie: number, entry: { z?: string, t?: number } }[]} */
  const pickedable = [];

  tokens.forEach((tok) => {
    const raw = tok.raw;
    if (raw.replace(/[^A-Za-z']/g, '').length < 4) return;
    if (names.has(raw)) return;                       // 专名
    if (/^[A-Z]/.test(raw) && names.has(raw.toLowerCase())) return;

    const entry = dict.get(tok.key);
    if (!entry || !entry.z) return;                   // 没释义的词不挖，提示阶段没法给中文
    const lower = raw.toLowerCase();
    if ((entry.t ?? 1) < 2 && (lower.length < 6 || STOP.has(lower))) return;   // 高频词里只留内容词

    const si = sentences.findIndex(s => tok.start >= s.start && tok.start < s.end);
    if (si < 0) return;

    // 句首词不挖：它是这句话的骨架，缺了整句读不通
    const s = sentences[si];
    if (tok.start - s.start < 2) return;

    pickedable.push({
      tok,
      sent: si,
      entry,
      score: scoreOf(entry, mastery[tok.key]?.m ?? 0),
      tie: hash(`${seed}:${tok.start}`),
    });
  });

  // 先按分数，再按哈希排序：同分时顺序稳定但看起来是打散的
  pickedable.sort((a, b) => b.score - a.score || a.tie - b.tie);

  // 间距按文章长度自适应：长文留 45 字符上下文，短文只能收紧（否则整篇挖不到几个空）
  const MIN_GAP = Math.max(22, Math.min(45, Math.round(text.length / 12)));
  const maxTotal = input.count ?? Math.max(5, Math.min(14, Math.round(sentences.length * 1.6)));
  const used = [];
  const perSent = new Array(sentences.length).fill(0);

  for (const c of pickedable) {
    if (used.length >= maxTotal) break;
    if (perSent[c.sent] >= perSentence[c.sent]) continue;
    // 用「前一个词的结尾」到「这一个词的开头」算间隔，避免长词把间距吃掉
    if (used.some(u => c.tok.start < u.tok.end + MIN_GAP && c.tok.end + MIN_GAP > u.tok.start)) continue;
    used.push(c);
    perSent[c.sent]++;
  }

  used.sort((a, b) => a.tok.start - b.tok.start);

  /** @type {Array<{ text: string } | { blank: number }>} */
  const segments = [];
  let cursor = 0;
  const blanks = used.map((c, i) => {
    if (c.tok.start > cursor) segments.push({ text: text.slice(cursor, c.tok.start) });
    segments.push({ blank: i });
    cursor = c.tok.end;
    return {
      answer: c.tok.raw,
      key: c.tok.key,
      zh: (c.entry.z ?? '').split('\n')[0].replace(/^[a-z]+\.\s*/i, ''),
      firstChar: c.tok.raw[0],
      start: c.tok.start,
      end: c.tok.end,
      sentence: c.sent,
    };
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return { blanks, segments, count: blanks.length };
}

/** 判定：忽略大小写与首尾空白；把弯引号/直引号视作等价 */
export function normalizeAnswer(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ');
}

/**
 * @param {{ answer: string }} blank
 * @param {string} input
 */
export function isCorrect(blank, input) {
  return normalizeAnswer(input) === normalizeAnswer(blank.answer);
}

/**
 * 选题：从某个城区里挑一篇「出得了题」的文章。
 *
 * 有少数文章几乎全是虚词、内容词又缺词条（实测 6/1156），挖不出 4 个空。
 * 与其放宽算法硬凑出无意义的空，不如在选题时跳过——所以先试几篇，取第一个够数的；
 * 都不够就用空最多的那篇（总比报错强）。
 *
 * @param {{
 *   candidates: Array<{ id: string, tx: string, lv: number }>,
 *   tokensOf: (text: string) => Token[],
 *   sentencesOf: (text: string) => Sentence[],
 *   names: Set<string>,
 *   dict: Map<string, { z?: string, t?: number }>,
 *   mastery: Record<string, { m: number }>,
 *   seed?: string,
 * }} opts
 * @returns {{ article: any, doc: ReturnType<typeof buildCloze> } | null}
 */
export function pickClozeArticle(opts) {
  const { candidates, tokensOf, sentencesOf, names, dict, mastery, seed = '' } = opts;
  if (!candidates.length) return null;

  let best = null;
  const tries = Math.min(candidates.length, 8);
  for (let i = 0; i < tries; i++) {
    const a = candidates[i];
    const doc = buildCloze({
      articleId: a.id,
      text: a.tx,
      tokens: tokensOf(a.tx),
      sentences: sentencesOf(a.tx),
      names,
      dict,
      mastery,
      seed: `${seed}:${a.id}`,
    });
    if (!best || doc.count > best.doc.count) best = { article: a, doc };
    if (doc.count >= 4) return { article: a, doc };
  }
  return best;
}
