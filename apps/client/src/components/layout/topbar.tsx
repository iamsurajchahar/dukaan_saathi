'use client';

import { useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useStore } from '@/providers/store-provider';
import { useLanguage } from '@/providers/language-provider';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { stores, activeStore, fetchStores, switchStore } = useStore();
  const { t, isHindi } = useLanguage();

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications/unread-count');
      return data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {stores.length > 1 && (
          <select
            value={activeStore?._id || ''}
            onChange={(e) => switchStore(e.target.value)}
            className="input-field py-2 text-sm w-48"
          >
            {stores.map((store) => (
              <option key={store._id} value={store._id}>{store.name}</option>
            ))}
          </select>
        )}
        {stores.length === 1 && activeStore && (
          <h2 className={`font-bold text-gray-900 ${isHindi ? 'font-noto text-lg' : 'text-base'}`}>
            {activeStore.name}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          aria-label={t.nav.notifications}
        >
          <Bell className="w-5 h-5" />
          {unreadData?.count > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadData.count > 9 ? '9+' : unreadData.count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
