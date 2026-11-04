/**
 * 精讲正文里的轻量标记。
 *
 * 只支持一种：`**加粗**`。写解析时偶尔要压一下重点（「**长女**才能叫 Miss + 姓」），
 * 但为这一处引入一整套 markdown 不划算，也不安全 —— 只要这一条，就实现这一条。
 */
export interface RichSeg {
  text: string;
  b?: boolean;
}

export function splitEmphasis(text: string): RichSeg[] {
  const out: RichSeg[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i) });
    out.push({ text: m[1], b: true });
    last = i + m[1].length + 4;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text }];
}
