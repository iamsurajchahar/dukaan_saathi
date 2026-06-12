'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { en, hi } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, hi };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('stocksense-language') as Language;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLang(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem('stocksense-language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = translations[language];
  const isHindi = language === 'hi';

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, isHindi }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
