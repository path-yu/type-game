/**
 * 全书译文的索引。
 *
 * 只有 100% 翻完的书才会出现在 public/data/full/index.json 里，
 * 阅读页据此决定要不要显示「读全书」入口 —— 半本译文不该给入口。
 */
export interface FullBookInfo {
  title: string;
  n: number;
  kb: number;
}

let cache: Promise<Record<string, FullBookInfo>> | null = null;

export function loadFullIndex(): Promise<Record<string, FullBookInfo>> {
  if (cache) return cache;
  const base = import.meta.env.BASE_URL || '/';
  cache = fetch(`${base}data/full/index.json`)
    .then(r => (r.ok ? r.json() : { books: {} }))
    .then(j => (j.books ?? {}) as Record<string, FullBookInfo>)
    .catch(() => ({}));
  return cache;
}

/** 这本书有没有全书译文 */
export async function hasFullBook(title: string): Promise<boolean> {
  const books = await loadFullIndex();
  return Object.values(books).some(b => b.title === title);
}
