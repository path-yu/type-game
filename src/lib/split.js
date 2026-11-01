/**
 * 切句规则：**全项目唯一定义处**。
 *
 * 为什么单独抽成一个 .js：浏览器端的 `sentences.ts`、Node 侧的导出脚本
 * `scripts/next-batch.mjs` 和校验脚本 `scripts/import-tr.mjs` 必须用同一套规则。
 * 这三处一旦漂移，「译文数组长度 === 句数」这道闸门就失去了意义 ——
 * 它校验的只是导出端自己的想法，而渲染端按另一套规则切。
 *
 * 历史教训：ABBR 曾经漏了 `i` 标志，全大写的 `MRS.` 被切成独立一句；
 * 修完之后渲染端的句数变了，而脚本端没变，导致同一条数据在两边长度不同。
 * （迁移见 `scripts/realign-tr.mjs`）
 */

/**
 * 常见缩写。`gi` 是必须的 —— 旧书排版常把称谓排成全大写 `MRS.` / `DR.`，
 * 区分大小写就挡不住，句点会被当成句界。
 */
export const ABBR_RE = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|vs|etc|No)\./gi;

/**
 * 句界：句末标点 + 可选收尾引号/括号 + 空白，**且后面必须紧跟大写字母或引号/括号**。
 *
 * 后面那个前瞻是 2026-11 补的。在此之前只要「标点 + 空格」就断句，于是
 * `Alas! it was too late` 被切成 `Alas!` 和 `it was too late`，
 * 全库 164 处这样的误断 —— 屏幕上的译文就成了孤零零的「唉！」。
 * 英文里感叹号后面接小写，几乎总是同一句还没说完。
 */
const BOUNDARY_RE = /[.!?]+["'\u201d)\]]?\s+(?=["'\u201c(]|[A-Z])/g;

/**
 * 按句切分，保留每句在原文中的字符区间（渲染端要靠它定位光标所在的句子）。
 * @param {string} text
 * @returns {{ text: string, start: number, end: number }[]}
 */
export function splitSentences(text) {
  // 把缩写里的句点换成 \u0001，让它不再匹配句界
  const guarded = text.replace(ABBR_RE, (m) => m.replace('.', '\u0001'));
  /** @type {{ text: string, start: number, end: number }[]} */
  const out = [];
  BOUNDARY_RE.lastIndex = 0;
  let start = 0;
  /** @type {RegExpExecArray | null} */
  let m;
  while ((m = BOUNDARY_RE.exec(guarded))) {
    const end = m.index + m[0].length;
    if (end > start) out.push({ text: text.slice(start, end).trim(), start, end });
    start = end;
  }
  if (start < text.length) {
    const tail = text.slice(start).trim();
    if (tail) out.push({ text: tail, start, end: text.length });
  }
  return out;
}
