'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp, AlertTriangle,
  Bell, BarChart3, Store, Settings, Users, LogOut, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import LanguageSwitcher from '@/components/ui/language-switcher';
import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t, isHindi } = useLanguage();
  const [showLogout, setShowLogout] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/inventory', label: t.nav.inventory, icon: Package },
    { href: '/sales', label: t.nav.sales, icon: ShoppingCart },
    { href: '/forecasts', label: t.nav.forecasts, icon: TrendingUp },
    { href: '/restock', label: t.nav.restock, icon: AlertTriangle },
    { href: '/reports', label: t.nav.reports, icon: BarChart3 },
    { href: '/notifications', label: t.nav.notifications, icon: Bell },
    { href: '/stores', label: t.nav.stores, icon: Store },
    { href: '/team', label: t.nav.team, icon: Users },
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[272px] bg-white border-r border-gray-200 flex flex-col z-50',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:z-30',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className={cn(
              'font-bold text-gray-900 tracking-tight',
              isHindi ? 'text-lg font-noto' : 'text-lg'
            )}>
              {t.appName}
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150',
                  isHindi ? 'text-[15px] font-noto' : 'text-sm',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-[18px] h-[18px] flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0 space-y-2">
          {/* Language switcher */}
          <div className="px-2 pb-1">
            <LanguageSwitcher />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0 uppercase">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 w-full rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {t.signOut}
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={showLogout}
        title={t.signOut}
        message={t.signOutConfirm}
        variant="warning"
        confirmLabel={t.yes}
        cancelLabel={t.no}
        onConfirm={() => { setShowLogout(false); logout(); }}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}
