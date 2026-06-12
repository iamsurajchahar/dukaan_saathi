'use client';

import Link from 'next/link';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useLanguage } from '@/providers/language-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, isHindi } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 ${isHindi ? 'font-noto' : ''}`}>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-3xl font-bold text-primary-600">
          {t.appName}
        </Link>
        <LanguageSwitcher />
      </div>
      <p className="text-gray-500 text-sm mb-6">{t.appTagline}</p>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
