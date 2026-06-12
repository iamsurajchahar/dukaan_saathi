'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import VoiceButton from '@/components/ui/voice-button';
import Link from 'next/link';

export default function DashboardPage() {
  const { t, language } = useLanguage();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/summary', { params: { period: 'daily', days: 30 } });
      return data.data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products/low-stock');
      return data.data;
    },
  });

  const { data: restock } = useQuery({
    queryKey: ['restock-preview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/restock/recommendations');
      return data.data?.slice(0, 5);
    },
  });

  const stats = [
    { label: t.dashboard.todaySales, value: summary?.totalTransactions || 0, icon: ShoppingCart, color: 'text-primary-600', bg: 'bg-primary-50', borderColor: 'border-primary-200' },
    { label: t.dashboard.revenue30d, value: formatCurrency(summary?.totalRevenue || 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' },
    { label: t.dashboard.totalProducts, value: summary?.totalProducts || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', borderColor: 'border-purple-200' },
    { label: t.dashboard.lowStockItems, value: lowStock?.length || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', borderColor: 'border-red-200' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.title}
        voiceText={language === 'hi' ? 'यह आपकी दुकान का मुख्य पेज है। यहां आप बिक्री, सामान, और कम स्टॉक की जानकारी देख सकते हैं।' : 'This is your store overview. Here you can see sales, products, and low stock information.'}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-5 border ${stat.borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <VoiceButton text={`${stat.label}: ${stat.value}`} />
                </div>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Lists */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t.dashboard.revenueChart}</h2>
          {summaryLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">{t.loading}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{t.dashboard.lowStockAlerts}</h2>
            <Link href="/restock" className="text-sm text-primary-600 hover:underline font-semibold">{t.dashboard.viewAll}</Link>
          </div>
          <div className="space-y-3">
            {lowStock?.length === 0 && (
              <div className="text-center py-4">
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-green-600 font-medium">{t.dashboard.allStocked}</p>
              </div>
            )}
            {lowStock?.slice(0, 6).map((product: any) => (
              <div key={product._id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                </div>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${product.currentStock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  {product.currentStock} {t.dashboard.left}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Restock Recommendations */}
      {restock?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{t.dashboard.topRestock}</h2>
            <Link href="/restock" className="text-sm text-primary-600 hover:underline font-semibold">{t.dashboard.seeAll}</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restock.map((item: any) => (
              <div key={item.product._id} className={`rounded-xl border-l-4 p-4 bg-gray-50 ${
                item.forecast.priority === 'critical' ? 'border-red-500' :
                item.forecast.priority === 'warning' ? 'border-amber-500' : 'border-green-500'
              }`}>
                <p className="font-semibold text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.dashboard.stock}: {item.product.currentStock} | {t.dashboard.order}: {item.forecast.suggestedOrderQty}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {item.forecast.daysUntilStockout < 999
                    ? t.dashboard.stockoutIn.replace('{days}', item.forecast.daysUntilStockout)
                    : t.dashboard.stockOk}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
