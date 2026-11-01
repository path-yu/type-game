/**
 * 义项体检：把全库的释义条目按「形态 ↔ 选取的词性」对一遍，数出可疑的几类。
 *
 * 这不是测试（它允许有一定比例的可疑项），是**改进前后的同一把尺子**：
 *   node scripts/audit-gloss.mjs
 *
 * 判据都是「形态应该指向某类词性」的强规则：
 *   - -ly 结尾却给了动词/名词（副词义项丢了）
 *   - 前面是主语代词/情态动词/to（该是动词）却给了名词
 *   - 前面是冠词/介词（该是名词）却给了动词
 *   - -ing/-ed 给了名词（动名词勉强算对，所以这类只统计不判错）
 *
 * 每一条都先问「词库里到底有没有那一类义项」——没有的算词库的缺口，不算挑错；
 * 否则 supper（to supper）/ woolly 这类无解的词会把数字撑得没法比较。
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'node_modules', '.tmp-gloss-audit.mjs');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/lib/sentences.ts')],
  bundle: true, format: 'esm', platform: 'neutral', outfile: TMP, logLevel: 'silent',
  define: { 'import.meta.env.BASE_URL': '"\\/"' },
});
const S = await import(`file://${TMP.replace(/\\/g, '/')}?t=${Date.now()}`);

const dict = new Map(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/dict.json'), 'utf8')).words.map(w => [w.w, w])
);
const lemma = new Map(Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/lemma.json'), 'utf8')).map));
const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/articles.json'), 'utf8')).items;
const corpus = { articles: items, byLevel: [], dict, lemma, detail: {}, tierOf: w => dict.get(w)?.t ?? 0, names: new Set() };

const TOKEN = /[A-Za-z][A-Za-z'-]*/g;
const P_SUBJ = /^(i|you|he|she|it|we|they|who|which)$/i;
const P_MODAL = /^(can|could|will|would|shall|should|may|might|must|do|does|did|to)$/i;
const P_PREP = /^(in|on|at|of|for|with|by|from|into|about|after|before|under|over|through|without|upon|against|between|during|near)$/i;
const P_DET = /^(a|an|the|this|that|these|those|his|her|their|its|my|your|our)$/i;
const LY_NOT_ADV = /^(friendly|lovely|lonely|likely|early|daily|weekly|monthly|yearly|only|silly|ugly|holy|elderly|orderly|deadly|costly|kindly|leisurely|manly|womanly|heavenly|ghostly|fatherly|motherly|brotherly|scholarly|jolly|assembly|family|italy|jelly|belly|butterfly)$/i;

const posOf = zh => ((zh.match(/^([a-z]+)\./i) || [])[1] || '').toLowerCase();
const buckets = {
  advLost: { label: '-ly 结尾却给了动词/名词', n: 0, samples: [] },
  nounForVerb: { label: '该是动词却给了名词', n: 0, samples: [] },
  verbForNoun: { label: '该是名词却给了动词', n: 0, samples: [] },
  participleAsNoun: { label: '-ing/-ed 给了名词（动名词算对，仅统计）', n: 0, samples: [] },
};
const seen = new Set();
let shown = 0;

const hit = (k, s) => {
  const b = buckets[k];
  b.n++;
  if (b.samples.length < 3 && !seen.has(s)) { seen.add(s); b.samples.push(s); }
};

for (const a of items) {
  for (const sent of S.splitSentences(a.tx).map(x => x.text)) {
    const glosses = S.glossOf(corpus, sent, {}, 6);
    if (!glosses.length) continue;
    const toks = [...sent.matchAll(TOKEN)].map(x => x[0]);
    for (const g of glosses) {
      shown++;
      const at = toks.findIndex(t => t === g.surface);
      const prev = at > 0 ? toks[at - 1] : '';
      const next = toks[at + 1] ?? '';
      const pos = posOf(g.zh);
      const low = g.surface.toLowerCase();
      const isVerb = pos === 'v' || pos === 'vt' || pos === 'vi' || pos === 'aux';
      // 词库（含它自己的条目）里有哪些词性可选
      const zs = [dict.get(g.key)?.z, dict.get(low)?.z].filter(Boolean).join('\n');
      const has = {
        adv: /^adv\./im.test(zs),
        adj: /^(a|adj)\./im.test(zs),
        noun: /^n\./im.test(zs),
        verb: /^(vt|vi|v|aux)\./im.test(zs),
      };

      if (/ly$/.test(low) && low.length > 4 && !LY_NOT_ADV.test(low) && (has.adv || has.adj) && (isVerb || pos === 'n')) {
        hit('advLost', `${g.surface} ← 「${prev}」 → ${g.zh}`);
      }
      if ((P_SUBJ.test(prev) || P_MODAL.test(prev)) && pos === 'n' && has.verb) {
        hit('nounForVerb', `${g.surface} ← 「${prev} ${g.surface} ${next}」 → ${g.zh}`);
      }
      if ((P_DET.test(prev) || P_PREP.test(prev)) && isVerb && has.noun) {
        hit('verbForNoun', `${g.surface} ← 「${prev} ${g.surface}」 → ${g.zh}`);
      }
      if (/(ing|ed)$/.test(low) && pos === 'n' && has.verb) {
        hit('participleAsNoun', `${g.surface} ← 「${prev} ${g.surface}」 → ${g.zh}`);
      }
    }
  }
}

console.log(`全库会显示的释义 ${shown} 条\n`);
for (const [k, b] of Object.entries(buckets)) {
  const pct = shown ? (b.n / shown * 100).toFixed(2) : '0.00';
  console.log(`${b.label}：${b.n} 条（${pct}%）`);
  for (const s of b.samples) console.log(`    ${s}`);
  console.log('');
}

try { fs.unlinkSync(TMP); } catch { /* ignore */ }
