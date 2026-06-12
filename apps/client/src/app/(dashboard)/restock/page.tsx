'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import VoiceButton from '@/components/ui/voice-button';
import toast from 'react-hot-toast';

export default function RestockPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['restock-recommendations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/restock/recommendations');
      return data.data;
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (productId: string) => apiClient.post(`/restock/acknowledge/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restock-recommendations'] });
      toast.success(t.restock.ordered);
    },
  });

  const criticalCount = recommendations?.filter((r: any) => r.forecast.priority === 'critical').length || 0;
  const warningCount = recommendations?.filter((r: any) => r.forecast.priority === 'warning').length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.restock.title}
        voiceText={language === 'hi' ? 'यह पेज बताता है कि कौन सा सामान कम है और कितना मंगाना चाहिए। लाल मतलब तुरंत मंगाएं, पीला मतलब जल्दी मंगाएं।' : 'This page shows which products are running low and how much to order. Red means order now, yellow means order soon.'}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 border border-red-200">
          <div className="bg-red-50 p-3 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t.restock.critical}</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <VoiceButton text={`${t.restock.critical}: ${criticalCount}`} />
        </div>
        <div className="card p-5 flex items-center gap-4 border border-amber-200">
          <div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t.restock.warning}</p>
            <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4 border border-green-200">
          <div className="bg-green-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t.restock.ok}</p>
            <p className="text-2xl font-bold text-green-600">{(recommendations?.length || 0) - criticalCount - warningCount}</p>
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      {isLoading && <p className="text-gray-400">{t.loading}</p>}

      <div className="space-y-3">
        {recommendations?.map((item: any) => {
          const priorityMap: Record<string, { bg: string; border: string; badge: string; icon: string; label: string }> = {
            critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'badge-critical', icon: 'text-red-500', label: t.restock.critical },
            warning: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'badge-warning', icon: 'text-amber-500', label: t.restock.warning },
            ok: { bg: 'bg-green-50', border: 'border-green-200', badge: 'badge-ok', icon: 'text-green-500', label: t.restock.ok },
          };
          const priorityConfig = priorityMap[item.forecast.priority] || { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'badge-info', icon: 'text-gray-500', label: '' };

          return (
            <div key={item.product._id} className={`card p-5 border ${priorityConfig.border} ${priorityConfig.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-white rounded-xl ${priorityConfig.icon}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{item.product.name}</h3>
                      <span className={priorityConfig.badge}>
                        {priorityConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.product.sku} | {item.product.category}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t.restock.currentStock}</p>
                        <p className="text-sm font-bold">{item.product.currentStock} {t.productUnits[item.product.unit as keyof typeof t.productUnits] || item.product.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t.restock.orderQty}</p>
                        <p className="text-sm font-bold text-primary-600">{item.forecast.suggestedOrderQty} {t.productUnits[item.product.unit as keyof typeof t.productUnits] || item.product.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t.restock.orderBy}</p>
                        <p className="text-sm font-bold">{formatDate(item.forecast.suggestedOrderDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t.restock.stockoutIn}</p>
                        <p className={`text-sm font-bold ${item.forecast.daysUntilStockout < 3 ? 'text-red-600' : ''}`}>
                          {item.forecast.daysUntilStockout < 999 ? `${item.forecast.daysUntilStockout} ${t.restock.days}` : t.restock.na}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeMutation.mutate(item.product._id)}
                  disabled={acknowledgeMutation.isPending}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {t.restock.markOrdered}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-semibold text-green-600">{t.restock.allStocked}</p>
          <p className="text-sm text-gray-400 mt-1">{t.restock.generateHint}</p>
        </div>
      )}
    </div>
  );
}
