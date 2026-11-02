/**
 * 词库侧的分析工具：给脚本用，不参与打包。
 *
 * 场景语料要回答一个界面之外的问题：「这场对话里有多少词是学习者没学过的」。
 * 词形归一必须和 src/lib/data.ts 的 lemmaOf 同一套规则 ——
 * 两处不一致的话，界面上标出来的「生词」和这里算的「超纲」就会打架，
 * 而这种不一致最难查（各自都对，只是口径不同）。
 */
import fs from 'node:fs';
import path from 'node:path';

export function loadLexicon(root) {
  const dict = JSON.parse(fs.readFileSync(path.join(root, 'public/data/dict.json'), 'utf8'));
  const lem = JSON.parse(fs.readFileSync(path.join(root, 'public/data/lemma.json'), 'utf8'));
  const names = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(root, 'public/data/names.json'), 'utf8')).names; }
    catch { return []; }
  })();

  const TIER = new Map(dict.words.map(w => [w.w, w.t]));
  const LEMMA = new Map(Object.entries(lem.map));
  // 专名表是文章语料的（人名地名），对话里也会出现：Seattle / Elena 不算超纲
  const NAMES = new Set(names.map(n => n.toLowerCase().replace(/[^a-z]/g, '')));

  function lemmaOf(raw) {
    const w = raw.toLowerCase().replace(/[^a-z']/g, '');
    if (!w) return raw;
    const direct = LEMMA.get(w);
    if (direct) return direct;
    if (TIER.has(w)) return w;
    const rules = [
      [/'s$/, ['']], [/ies$/, ['y']], [/ves$/, ['f', 'fe']], [/es$/, ['', 'e']],
      [/s$/, ['']], [/ied$/, ['y']], [/ed$/, ['', 'e']], [/ing$/, ['', 'e']],
      [/er$/, ['', 'e']], [/est$/, ['', 'e']], [/ly$/, ['']],
    ];
    for (const [re, sufs] of rules) {
      if (!re.test(w)) continue;
      const stem = w.replace(re, '');
      if (stem.length < 2) continue;
      for (const s of sufs) if (TIER.has(stem + s)) return stem + s;
      if (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
        const cand = stem.slice(0, -1);
        if (TIER.has(cand)) return cand;
      }
    }
    return w;
  }

  const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;

  /**
   * 一句话里的词：词形、词频档位（0 表示不在词库）、是不是句首。
   * 句首大写当不了专名线索 —— 每句第一个词都大写。
   */
  function tokensOf(text) {
    const out = [];
    let m;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(text))) {
      const before = text.slice(0, m.index).trimEnd();
      const sentenceStart = before === '' || /[.!?…:]$/.test(before);
      out.push({ raw: m[0], key: lemmaOf(m[0]), tier: TIER.get(lemmaOf(m[0])) ?? 0, sentenceStart });
    }
    return out;
  }

  /** 这个词算不算「学习者可能没见过」：不在词库，也不是专名 */
  const isHard = t => t.tier === 0
    && !NAMES.has(t.key)
    && !(t.raw[0] === t.raw[0].toUpperCase() && !t.sentenceStart);

  /** 一场对话的词汇画像：超纲词（去重）与词频统计 */
  function profileLines(lines) {
    const hard = new Set();
    const tiers = [];
    let words = 0;
    for (const line of lines) {
      for (const t of tokensOf(line)) {
        words++;
        if (isHard(t)) hard.add(t.key);
        else tiers.push(t.tier || 1);   // 专名当最低档，不拉高均值
      }
    }
    const mean = tiers.length ? tiers.reduce((a, b) => a + b, 0) / tiers.length : 0;
    return { hard: [...hard], hardN: hard.size, mean, words };
  }

  return { size: dict.words.length, tierOf: w => TIER.get(w) ?? 0, lemmaOf, tokensOf, isHard, profileLines };
}
