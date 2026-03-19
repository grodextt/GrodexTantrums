import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { applyTheme, getThemeByName } from '@/lib/themes';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  const { settings } = useSiteSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply theme preset when settings or theme mode changes
  useEffect(() => {
    const presetName = (settings as any)?.theme?.preset || 'Obsidian';
    const preset = getThemeByName(presetName);
    if (preset) {
      applyTheme(preset, theme === 'dark');
    }
  }, [settings, theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
