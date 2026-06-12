'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications');
      return data.data;
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); queryClient.invalidateQueries({ queryKey: ['unread-count'] }); },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); queryClient.invalidateQueries({ queryKey: ['unread-count'] }); },
  });

  const typeColors: Record<string, string> = {
    low_stock: 'badge-critical',
    reorder_reminder: 'badge-warning',
    forecast_ready: 'badge-info',
    subscription: 'bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold',
    system: 'bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.notifications.title}
        actions={
          <button onClick={() => markAllRead.mutate()} className="btn-secondary text-sm gap-2">
            <CheckCheck className="w-4 h-4" /> {t.notifications.markAllRead}
          </button>
        }
      />

      <div className="space-y-2">
        {isLoading && <p className="text-gray-400">{t.loading}</p>}
        {data?.notifications?.map((n: any) => (
          <div
            key={n._id}
            onClick={() => !n.isRead && markRead.mutate(n._id)}
            className={`card p-5 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-start gap-3">
              <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${n.isRead ? 'text-gray-300' : 'text-primary-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
                  <span className={typeColors[n.type] || typeColors.system}>
                    {t.notifications.types[n.type as keyof typeof t.notifications.types] || n.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0" />}
            </div>
          </div>
        ))}
        {data?.notifications?.length === 0 && (
          <div className="card p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-base">{t.notifications.noNotifications}</p>
          </div>
        )}
      </div>
    </div>
  );
}
