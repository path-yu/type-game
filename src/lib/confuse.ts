/**
 * 易混词检测。
 *
 * 间隔重复系统里被低估的一个问题：同一批复习里如果同时出现 affect / effect、adapt / adopt，
 * 两个词会互相干扰（interference），结果两个都记不牢。研究里这叫「辨别性对比」——
 * 形近词要么错开复习，要么放在一起专门辨析，最忌讳的是「随机混在一批里，谁也不认识谁」。
 *
 * 这里只判形近（编辑距离）。义近（big / large）理论上也会干扰，但没有可靠的自动判据，
 * 硬做只会误伤。
 */

/**
 * Damerau-Levenshtein 距离（带提前退出）。
 *
 * 用 Damerau 而不是普通 Levenshtein，是因为**相邻字母换位**是最典型的拼写失误：
 * quiet ↔ quite 只差最后两个字母换了位置，普通编辑距离算 2，会被长词阈值挡在外面。
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev2 = new Array(n + 1).fill(0);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let cur = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      // 相邻换位
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
      }
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    // 整行都超过阈值，后面不可能再降下来
    if (rowMin > max) return max + 1;
    [prev2, prev, cur] = [prev, cur, prev2];
  }
  return prev[n];
}

/**
 * 两个词是否容易混。
 *
 * 太短的词（≤3 字母）一律不算 —— cat / car 满屏都是，错开反而让队列排不满。
 * 长度差超过 1 的也不算，那是两个不同的词，不是"看串了"。
 * 距离 2 只在 ≥6 字母时接受，否则 have/make 这种也会被算进来。
 */
export function confusable(a: string, b: string): boolean {
  if (a === b) return false;
  if (a.length < 4 || b.length < 4) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  const d = editDistance(a, b, 2);
  if (d === 1) return true;
  // 距离 2 只对长词放行。四个字母差两个（have/make）已经是两个完全不同的词，
  // 判成「易混」只会把复习队列撕得七零八落 —— 全库能凑出四万对来。
  return d === 2 && Math.min(a.length, b.length) >= 6;
}

/**
 * 从候选里挑词，尽量让易混词分开批次。
 *
 * 做法：按优先级往下走，遇到和已选词易混的先放一边；实在凑不满再回头补。
 * 不追求最优解 —— 复习队列的排序本来就有噪声，这里只要别把易混的硬凑一起。
 */
export function spreadConfusable(candidates: string[], limit: number): string[] {
  const picked: string[] = [];
  const deferred: string[] = [];

  for (const w of candidates) {
    if (picked.length >= limit) break;
    if (picked.some(p => confusable(p, w))) {
      deferred.push(w);
      continue;
    }
    picked.push(w);
  }

  for (const w of deferred) {
    if (picked.length >= limit) break;
    picked.push(w);
  }
  return picked;
}

/** 给某个词找出所有易混词（用于「别和 effect 搞混」这类提示） */
export function rivalsOf(word: string, pool: string[], max = 2): string[] {
  const out: string[] = [];
  for (const w of pool) {
    if (w === word) continue;
    if (confusable(word, w)) {
      out.push(w);
      if (out.length >= max) break;
    }
  }
  return out;
}
