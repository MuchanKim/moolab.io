'use client';

import { createContext, useContext, useEffect, useRef } from 'react';

interface Vec2 {
  x: number;
  y: number;
}

// ref 기반으로 공유 — re-render 없이 rAF 루프에서 직접 읽음
export const CursorContext = createContext<React.MutableRefObject<Vec2>>(
  { current: { x: -9999, y: -9999 } } as React.MutableRefObject<Vec2>,
);

export function useCursorPosition() {
  return useContext(CursorContext);
}

export function useCursorProvider() {
  const pos = useRef<Vec2>({ x: -9999, y: -9999 });

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  return pos;
}
