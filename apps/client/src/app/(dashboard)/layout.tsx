'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import VoiceAssistant from '@/components/ui/voice-assistant';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isHindi } = useLanguage();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen bg-gray-50 ${isHindi ? 'font-noto' : ''}`}>
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:ml-[272px] min-h-screen flex flex-col transition-[margin] duration-300">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <VoiceAssistant />
    </div>
  );
}
