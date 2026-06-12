'use client';

import { useLanguage } from '@/providers/language-provider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
      aria-label={t.chooseLanguage}
      title={t.chooseLanguage}
    >
      <Globe className="w-4 h-4 text-primary-600" />
      {!compact && (
        <span className={language === 'hi' ? 'font-noto' : ''}>
          {language === 'en' ? 'हिंदी' : 'English'}
        </span>
      )}
    </button>
  );
}
