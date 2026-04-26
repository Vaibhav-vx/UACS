import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { i18n, t: i18nt } = useTranslation();
  const [language, setLang] = useState(() => localStorage.getItem('uacs_lang') || 'en');

  // Sync state with i18next if they differ
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const setLanguage = useCallback((code) => {
    setLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem('uacs_lang', code);
  }, [i18n]);

  const t = useCallback((key, options) => {
    return i18nt(key, options);
  }, [i18nt]);

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
