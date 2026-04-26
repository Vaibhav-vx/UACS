import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './translations';

const resources = {};
Object.keys(translations).forEach(lang => {
  resources[lang] = {
    translation: translations[lang]
  };
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('uacs_lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
