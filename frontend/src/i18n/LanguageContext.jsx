import { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',    flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',   flag: '🇮🇳' },
];

export function LanguageProvider({ children }) {
  const [language, setLang] = useState(() => localStorage.getItem('uacs_lang') || 'en');

  const setLanguage = useCallback((code) => {
    setLang(code);
    localStorage.setItem('uacs_lang', code);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en?.[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { LANGUAGES };
