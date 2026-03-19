'use client';

import { CursorContext, useCursorProvider } from '@/hooks/useCursorPosition';

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const pos = useCursorProvider();
  return <CursorContext.Provider value={pos}>{children}</CursorContext.Provider>;
}
