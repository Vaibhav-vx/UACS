import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('uacs_theme');
    if (stored === 'amber-ops' || stored === 'dark') return 'nordic-frost';
    if (stored) return stored;
    return 'nordic-frost';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'nordic-frost');
    root.classList.add(theme);
    localStorage.setItem('uacs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'nordic-frost' : 'light'));
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
