import { createContext, useContext } from 'react';
import type { Corpus } from './data';

export const CorpusCtx = createContext<Corpus | null>(null);

export function useCorpus(): Corpus {
  const c = useContext(CorpusCtx);
  if (!c) throw new Error('Corpus 未加载');
  return c;
}
