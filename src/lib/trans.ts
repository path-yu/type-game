/**
 * 句子译文（可选数据）。
 * 译文不在构建产物里预置 —— 由 scripts/translate.mjs 逐步补齐到 public/data/tr.json，
 * 没有译文的句子在界面上只显示生词解析，不显示空占位。
 */
interface TrFile {
  v: number;
  map: Record<string, string[]>;
}

const BASE = import.meta.env.BASE_URL || '/';
let loading: Promise<TrFile | null> | null = null;
let data: TrFile | null = null;

function load(): Promise<TrFile | null> {
  if (loading) return loading;
  loading = fetch(`${BASE}data/tr.json`)
    .then(r => (r.ok ? (r.json() as Promise<TrFile>) : null))
    .catch(() => null)
    .then(j => {
      data = j;
      return j;
    });
  return loading;
}

export async function translationsFor(articleId: string): Promise<string[] | null> {
  const d = data ?? (await load());
  const t = d?.map?.[articleId];
  return Array.isArray(t) && t.length ? t : null;
}

/** 已翻译的文章数（用于设置页显示覆盖率） */
export async function translationCoverage(): Promise<{ articles: number }> {
  const d = data ?? (await load());
  return { articles: Object.keys(d?.map ?? {}).length };
}
