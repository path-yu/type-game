import type { Article, WordEntry } from './types';

export interface Token {
  raw: string;
  key: string;   // lemma 归一后的词
  start: number; // 在 text 中的字符下标
  end: number;
}

export interface Corpus {
  articles: Article[];
  byLevel: Article[][];
  dict: Map<string, WordEntry>;
  lemma: Map<string, string>;
  detail: Record<string, Record<string, string>>;
  tierOf: (w: string) => number;
  /** 专名表（人名地名等）：用于在句子解析里跳过，不当生词 */
  names: Set<string>;
}

const BASE = import.meta.env.BASE_URL || '/';

async function getJSON<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}data/${file}`);
  if (!res.ok) throw new Error(`读取 data/${file} 失败 (${res.status})`);
  return res.json() as Promise<T>;
}

let cache: Corpus | null = null;

export async function loadCorpus(): Promise<Corpus> {
  if (cache) return cache;
  const [a, d, l, n] = await Promise.all([
    getJSON<{ items: Article[] }>('articles.json'),
    getJSON<{ words: WordEntry[] }>('dict.json'),
    getJSON<{ map: Record<string, string>; detail: Record<string, Record<string, string>> }>('lemma.json'),
    getJSON<{ names: string[] }>('names.json').catch(() => ({ names: [] as string[] })),
  ]);

  const dict = new Map<string, WordEntry>();
  for (const w of d.words) dict.set(w.w, w);

  const lemma = new Map<string, string>(Object.entries(l.map));

  const articles = a.items;
  const byLevel: Article[][] = Array.from({ length: 8 }, () => []);
  for (const it of articles) byLevel[it.lv]?.push(it);

  const tierCache = new Map<string, number>();
  const tierOf = (w: string) => {
    const c = tierCache.get(w);
    if (c !== undefined) return c;
    const t = dict.get(w)?.t ?? 0;
    tierCache.set(w, t);
    return t;
  };

  cache = { articles, byLevel, dict, lemma, detail: l.detail, tierOf, names: new Set(n.names) };
  return cache;
}

/** 词形归一：running → run，children → child，went → go */
export function lemmaOf(corpus: Corpus, raw: string): string {
  const w = raw.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return raw;
  const direct = corpus.lemma.get(w);
  if (direct) return direct;
  if (corpus.dict.has(w)) return w;

  const rules: [RegExp, string[]][] = [
    [/'s$/, ['']],
    [/ies$/, ['y']],
    [/ves$/, ['f', 'fe']],
    [/es$/, ['', 'e']],
    [/s$/, ['']],
    [/ied$/, ['y']],
    [/ed$/, ['', 'e']],
    [/ing$/, ['', 'e']],
    [/er$/, ['', 'e']],
    [/est$/, ['', 'e']],
    [/ly$/, ['']],
  ];
  for (const [re, sufs] of rules) {
    if (!re.test(w)) continue;
    const stem = w.replace(re, '');
    if (stem.length < 2) continue;
    for (const s of sufs) {
      const cand = stem + s;
      if (corpus.dict.has(cand)) return cand;
    }
    // running → runn → run
    if (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      const cand = stem.slice(0, -1);
      if (corpus.dict.has(cand)) return cand;
    }
  }
  return w;
}

const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;

export function tokenize(corpus: Corpus, text: string): Token[] {
  const out: Token[] = [];
  let m: RegExpExecArray | null;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(text))) {
    out.push({
      raw: m[0],
      key: lemmaOf(corpus, m[0]),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return out;
}

/* ------------------------- 查询 ------------------------- */
export function lookup(corpus: Corpus, raw: string): WordEntry | null {
  const k = lemmaOf(corpus, raw);
  const e = corpus.dict.get(k);
  if (e) return e;
  const plain = raw.toLowerCase().replace(/[^a-z']/g, '');
  return corpus.dict.get(plain) ?? null;
}

/* ------------------------- 难度 ------------------------- */
/** 掌握度先验：没打过、没查过的词，按词频档位给一个合理估计 */
export function priorOf(corpus: Corpus, w: string): number {
  const t = corpus.dict.get(w)?.t ?? 0;
  return t === 1 ? 70 : t === 2 ? 45 : t === 3 ? 25 : 10;
}

export function masteryOf(corpus: Corpus, mastery: Record<string, { m: number }>, w: string): number {
  const st = mastery[w];
  if (st) return st.m;
  return priorOf(corpus, w);
}

/** 玩家当前的估算词汇量（掌握度 ≥ 70 计 1 词） */
export function estimateVocab(mastery: Record<string, { m: number }>, corpus: Corpus): number {
  let n = 0;
  for (const w of corpus.dict.keys()) {
    if (masteryOf(corpus, mastery, w) >= 70) n++;
  }
  return n;
}

/**
 * 词汇量拆解 —— 用来解释「为什么是这个数」。
 *
 * 这个数字里绝大部分**不是测出来的**：没打过、没查过的 Tier1 词按先验直接记 70（见 priorOf）。
 * 所以新玩家一进来就是 1000，练了几天反而可能变成 978——
 * 因为打错、查词、填空填错会把某些 Tier1 词从 70 打到 70 以下。
 *
 * 拆开显示比纠正数字更重要：用户看到「实测 12 · 先验 966」就不会再问"为什么少了 22 个"。
 */
export function vocabBreakdown(mastery: Record<string, { m: number }>, corpus: Corpus) {
  let measured = 0;   // 打过/查过的词里，掌握度 ≥ 70 的
  let prior = 0;      // 没碰过、按词频先验算作已掌握的
  let demoted = 0;    // 先验本可 ≥70，但被练习打到 70 以下的
  for (const w of corpus.dict.keys()) {
    const st = mastery[w];
    if (st) {
      if (st.m >= 70) measured++;
      else if (priorOf(corpus, w) >= 70) demoted++;
    } else if (priorOf(corpus, w) >= 70) {
      prior++;
    }
  }
  return { total: measured + prior, measured, prior, demoted };
}

/** 一条文本对当前玩家的生词率（0-1） */
export function newWordRate(
  corpus: Corpus,
  article: Article,
  mastery: Record<string, { m: number }>
): { rate: number; unknown: string[] } {
  const toks = tokenize(corpus, article.tx);
  const uniq = new Map<string, number>();
  for (const t of toks) uniq.set(t.key, (uniq.get(t.key) ?? 0) + 1);
  let unknown = 0;
  const list: string[] = [];
  for (const [w, c] of uniq) {
    const m = masteryOf(corpus, mastery, w);
    if (m < 40) {
      unknown += c;
      if (list.length < 24) list.push(w);
    }
  }
  return { rate: unknown / Math.max(1, toks.length), unknown: list };
}

/* ------------------------- 选文推荐（i+1） ------------------------- */
const TARGET_RATE = 0.06;

export function recommend(
  corpus: Corpus,
  mastery: Record<string, { m: number }>,
  level: number,
  recentIds: string[]
): Article {
  const pool = corpus.byLevel[level] ?? corpus.byLevel[1];
  const recent = new Set(recentIds);
  const last = recentIds.length ? corpus.articles.find(a => a.id === recentIds[0]) : undefined;

  // 接着往下读：同书里第一段没打过的后继。
  // 以前这里没有"顺序"概念 —— 建库时每个难度层被洗过牌，编号和原文毫无关系，
  // 于是连着三篇 Alice 可能隔着半本书，读起来像跳页。
  let follow: Article | undefined;
  if (last?.ord && last.tot) {
    const same = pool.filter(a => a.s === last.s).sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
    follow = same.find(a => (a.ord ?? 0) > last.ord! && !recent.has(a.id));
  }

  // 连续读同一本书时，只要下一段的生词没有失控，就直接接着读 ——
  // 加权打不过分数差（一篇 rate 0.058 的好文章能拉开 0.5 分），而"顺着读"
  // 对这个产品比"生词率再准一点"更重要。0.15 = 每 100 词 15 个生词，上限。
  if (follow) {
    const { rate } = newWordRate(corpus, follow, mastery);
    if (rate <= TARGET_RATE * 2.5) return follow;
  }

  let best: Article = pool[0];
  let bestScore = -Infinity;

  // 只在池子里抽样打分，保证 60fps 之外也够快；续读候选必须入列，不能被抽样漏掉
  const sample = pool.length > 120 ? pool.slice(0, 120) : pool;
  const cands = follow && !sample.includes(follow) ? [...sample, follow] : sample;

  for (const a of cands) {
    const { rate } = newWordRate(corpus, a, mastery);
    let s = 0.45 * (1 - Math.abs(rate - TARGET_RATE) / TARGET_RATE);
    s += 0.2 * (1 - Math.min(Math.abs(a.sc - 0.5), 0.5) / 0.5);
    if (a === follow) s += 0.4;                       // 顺着读优先
    else if (last && a.s === last.s) {
      // 同一本书里往前翻没有意义 —— 读者会以为"这书怎么倒着讲"
      s += (a.ord ?? 0) > (last.ord ?? 0) ? 0.08 : -0.8;
    }
    // 生词率离谱时才放弃续读（空掌握度状态下所有篇都会超标，所以门槛放宽）
    if (a === follow && rate > TARGET_RATE * 4) s -= 0.3;
    if (recent.has(a.id)) s -= 0.5;
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}
