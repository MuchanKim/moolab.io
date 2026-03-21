'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// 역할: data-theme attribute 상태만 관리.
// 실제 색상값은 globals.css에서만 정의한다.
function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // useLayoutEffect: DOM 변경 후 브라우저 paint 전에 동기 실행 → FOUC 방지
  useLayoutEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial = stored ?? 'light';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      applyTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
