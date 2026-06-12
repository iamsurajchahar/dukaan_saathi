'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import HelpTooltip from '@/components/ui/help-tooltip';
import VoiceButton from '@/components/ui/voice-button';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ForecastsPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['forecasts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/forecasts');
      return data.data;
    },
  });

  const { data: accuracy } = useQuery({
    queryKey: ['forecast-accuracy'],
    queryFn: async () => {
      const { data } = await apiClient.get('/forecasts/accuracy');
      return data.data;
    },
  });

  const { data: detail } = useQuery({
    queryKey: ['forecast-detail', selectedProduct],
    queryFn: async () => {
      const { data } = await apiClient.get(`/forecasts/${selectedProduct}`);
      return data.data;
    },
    enabled: !!selectedProduct,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post('/forecasts/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
      toast.success(t.forecasts.generated);
    },
    onError: () => toast.error(t.forecasts.failed),
  });

  const chartData = detail?.predictions?.map((p: any) => ({
    date: formatDate(p.date),
    predicted: p.predictedDemand,
    low: p.confidenceLow,
    high: p.confidenceHigh,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.forecasts.title}
        voiceText={language === 'hi' ? 'यह पेज बताता है कि आगे कौन सा सामान कितना बिकेगा। अनुमान बनाएं बटन दबाएं।' : 'This page shows predictions for future product demand. Click Generate to create predictions.'}
        actions={
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            {generateMutation.isPending ? t.forecasts.generating : t.forecasts.generate}
          </button>
        }
      />

      {/* Accuracy Stats */}
      {accuracy && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-gray-500">{t.forecasts.avgMape}</p>
              <HelpTooltip text={t.help.mape} />
            </div>
            <p className="text-2xl font-bold text-primary-600 mt-1">{accuracy.avgMape?.toFixed(1)}%</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-gray-500">{t.forecasts.totalForecasts}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{accuracy.totalForecasts}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-gray-500">{t.forecasts.bestMethod}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{(accuracy.bestMethod && t.forecasts.methods[accuracy.bestMethod]) || accuracy.bestMethod || 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="card p-4 max-h-[600px] overflow-y-auto">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">{t.forecasts.products}</h2>
          {isLoading && <p className="text-sm text-gray-400">{t.loading}</p>}
          {forecasts?.map((f: any) => (
            <button
              key={f.productId}
              onClick={() => setSelectedProduct(f.productId)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors touch-target ${
                selectedProduct === f.productId ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'hover:bg-gray-50'
              }`}
            >
              <p className="text-sm font-semibold">{f.productName || f.productId}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  f.priority === 'critical' ? 'badge-critical' :
                  f.priority === 'warning' ? 'badge-warning' : 'badge-ok'
                }`}>
                  {f.priority === 'critical' ? t.restock.critical :
                   f.priority === 'warning' ? t.restock.warning : t.restock.ok}
                </span>
              </div>
            </button>
          ))}
          {forecasts?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">{t.forecasts.noForecasts}</p>
          )}
        </div>

        {/* Forecast Chart */}
        <div className="lg:col-span-2 card p-6">
          {selectedProduct && chartData ? (
            <>
              <h2 className="text-lg font-bold mb-4">{t.forecasts.chart30d}</h2>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area dataKey="high" fill="#dbeafe" stroke="none" name="Upper Bound" />
                  <Area dataKey="low" fill="#ffffff" stroke="none" name="Lower Bound" />
                  <Line type="monotone" dataKey="predicted" stroke="#2563eb" strokeWidth={2} dot={false} name="Predicted Demand" />
                </ComposedChart>
              </ResponsiveContainer>
              {detail && (
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">{t.forecasts.method}</p>
                    <p className="text-sm font-bold mt-1">{t.forecasts.methods[detail.method] || detail.method}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs text-gray-500 font-medium">{t.forecasts.reorderPoint}</p>
                      <HelpTooltip text={t.help.reorderPoint} />
                    </div>
                    <p className="text-sm font-bold mt-1">{detail.reorderPoint}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs text-gray-500 font-medium">{t.forecasts.safetyStock}</p>
                      <HelpTooltip text={t.help.safetyStock} />
                    </div>
                    <p className="text-sm font-bold mt-1">{detail.safetyStock}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">{t.forecasts.orderQty}</p>
                    <p className="text-sm font-bold mt-1 text-primary-600">{detail.suggestedOrderQty}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-14 h-14 mb-3 text-gray-300" />
              <p className="text-base">{t.forecasts.selectProduct}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
