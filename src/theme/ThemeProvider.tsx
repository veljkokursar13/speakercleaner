import { Asset } from 'expo-asset';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { QuantumTheme } from './styles';

type Theme = typeof QuantumTheme;

const ThemeContext = createContext<{ theme: Theme } | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useMemo(() => ({ theme: QuantumTheme }), []);

  // Prefetch background noise asset on app start to avoid late appearance
  useEffect(() => {
    try {
      const img: any = QuantumTheme.background.image;
      if (img) {
        Asset.fromModule(img).downloadAsync().catch(() => {});
      }
    } catch {}
  }, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}


