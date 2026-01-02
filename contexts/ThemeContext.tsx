import React, { createContext, useState, useEffect, useMemo, ReactNode, useContext, useCallback } from 'react';
import { generateTheme, ThemeColors } from '../src/utils/theme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState(false);

  // We use the same seed color as defined in the plan: "Paw Print Teal" (#008080)
  const themePalette = useMemo(() => generateTheme('#008080'), []);

  useEffect(() => {
    const root = window.document.documentElement;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => 
      theme === 'dark' || (theme === 'system' && mediaQuery.matches);
    
    const darkActive = checkDark();
    setIsDark(darkActive);
    root.classList.toggle('dark', darkActive);

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const active = e.matches;
        setIsDark(active);
        root.classList.toggle('dark', active);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
    }
    setThemeState(newTheme);
  }, []);

  const colors = useMemo(() => {
    return isDark ? themePalette.dark : themePalette.light;
  }, [isDark, themePalette]);

  const value = useMemo(() => ({ theme, isDark, colors, setTheme }), [theme, isDark, colors, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};