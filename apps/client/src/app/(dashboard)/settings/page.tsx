'use client';

import { useAuth } from '@/providers/auth-provider';
import { useStore } from '@/providers/store-provider';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import LanguageSwitcher from '@/components/ui/language-switcher';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeStore } = useStore();
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={t.settings.title} />

      {/* Language */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-2">{t.settings.languageSettings}</h2>
        <p className="text-sm text-gray-500 mb-4">{t.settings.languageDesc}</p>
        <LanguageSwitcher />
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">{t.settings.profile}</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-gray-500 font-medium">{t.settings.name}</span>
            <span className="text-sm font-semibold">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-gray-500 font-medium">{t.settings.emailLabel}</span>
            <span className="text-sm font-semibold">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-gray-500 font-medium">{t.settings.emailVerified}</span>
            <span className={`text-sm font-bold ${user?.isEmailVerified ? 'text-green-600' : 'text-amber-600'}`}>
              {user?.isEmailVerified ? t.settings.verified : t.settings.pending}
            </span>
          </div>
        </div>
      </div>

      {/* Store Settings */}
      {activeStore && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">{t.settings.storeSettings}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-gray-500 font-medium">{t.settings.storeName}</span>
              <span className="text-sm font-semibold">{activeStore.name}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-gray-500 font-medium">{t.settings.storeCategory}</span>
              <span className="text-sm font-semibold capitalize">
                {t.storeCategories[activeStore.category as keyof typeof t.storeCategories] || activeStore.category}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-gray-500 font-medium">{t.settings.lowStockThreshold}</span>
              <span className="text-sm font-semibold">{activeStore.settings?.lowStockThreshold} {t.settings.units}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-500 font-medium">{t.settings.defaultLeadTime}</span>
              <span className="text-sm font-semibold">{activeStore.settings?.defaultLeadTimeDays} {t.settings.days}</span>
            </div>
          </div>
        </div>
      )}

      {/* Billing Link */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-2">{t.settings.billing}</h2>
        <p className="text-sm text-gray-500 mb-4">{t.settings.billingDesc}</p>
        <Link href="/settings/billing" className="btn-secondary text-sm inline-flex">{t.settings.manageBilling}</Link>
      </div>
    </div>
  );
}
