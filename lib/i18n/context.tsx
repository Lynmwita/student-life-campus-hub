'use client';

import * as React from 'react';
import { SupportedLanguage, TranslationDictionary } from './types';
import { getTranslation } from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = React.createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => getTranslation(key, 'en'),
});

const LANG_STORAGE_KEY = 'campus-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<SupportedLanguage>('en');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
      if (stored === 'en' || stored === 'sw') {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  const setLanguage = React.useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      document.cookie = `${LANG_STORAGE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  }, []);

  const toggleLanguage = React.useCallback(() => {
    const nextLang: SupportedLanguage = language === 'en' ? 'sw' : 'en';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  const t = React.useCallback(
    (key: keyof TranslationDictionary) => getTranslation(key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
