'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, ShoppingCart } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, getApiErrorMessage } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import toast from 'react-hot-toast';

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export default function SalesPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['product-search', productSearch],
    queryFn: async () => {
      if (!productSearch) return [];
      const { data } = await apiClient.get('/products', { params: { search: productSearch, limit: 5 } });
      return data.data?.products || [];
    },
    enabled: productSearch.length >= 2,
  });

  const { data: salesHistory } = useQuery({
    queryKey: ['sales-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales', { params: { limit: 20 } });
      return data.data;
    },
    enabled: showHistory,
  });

  const recordSale = useMutation({
    mutationFn: (items: { productId: string; quantity: number; unitPrice: number }[]) =>
      apiClient.post('/sales', { items }),
    onSuccess: () => {
      setCart([]);
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      toast.success(t.sales.saleRecorded);
    },
    onError: (err: any) => toast.error(getApiErrorMessage(err, t.sales.saleFailed)),
  });

  const addToCart = (product: any) => {
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      setCart(cart.map((c) => c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product._id, name: product.name, sku: product.sku, quantity: 1, unitPrice: product.price.sellingPrice }]);
    }
    setProductSearch('');
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.productId !== productId));
    } else {
      setCart(cart.map((c) => c.productId === productId ? { ...c, quantity: qty } : c));
    }
  };

  const total = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.sales.title}
        voiceText={language === 'hi' ? 'यहां आप नई बिक्री दर्ज कर सकते हैं और पुरानी बिक्री देख सकते हैं।' : 'Here you can record new sales and view past sales.'}
        actions={
          <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary text-sm">
            {showHistory ? t.sales.newSale : t.sales.viewHistory}
          </button>
        }
      />

      {!showHistory ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* POS Interface */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input-field pl-12"
                placeholder={t.sales.searchProducts}
              />
              {products?.length > 0 && productSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                  {products.map((p: any) => (
                    <button key={p._id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3.5 hover:bg-gray-50 flex items-center justify-between border-b last:border-0 touch-target">
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sku} | {t.sales.stockLabel}: {p.currentStock}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-600">{formatCurrency(p.price.sellingPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cart.length === 0 && (
              <div className="card p-12 text-center text-gray-400">
                <ShoppingCart className="w-14 h-14 mx-auto mb-3 text-gray-300" />
                <p className="text-base">{t.sales.emptyCart}</p>
              </div>
            )}

            {cart.length > 0 && (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.product}</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.qty}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.price}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.total}</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="number" value={item.quantity} min={1} onChange={(e) => updateQty(item.productId, +e.target.value)} className="w-16 text-center input-field py-2" />
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        <td className="px-2">
                          <button onClick={() => updateQty(item.productId, 0)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="card p-6 h-fit sticky top-24">
            <h2 className="text-lg font-bold mb-4">{t.sales.orderSummary}</h2>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-bold">{t.sales.totalAmount}</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={cart.length === 0 || recordSale.isPending}
              className="btn-primary w-full mt-4 text-lg"
            >
              {recordSale.isPending ? t.sales.recording : t.sales.recordSale}
            </button>
          </div>
        </div>
      ) : (
        /* Sales History */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.date}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.items}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.sales.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {salesHistory?.sales?.map((sale: any) => (
                <tr key={sale._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(sale.saleDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sale.items.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(sale.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Confirmation */}
      <ConfirmDialog
        open={showConfirm}
        title={t.sales.recordSale}
        message={`${t.sales.totalAmount}: ${formatCurrency(total)}`}
        variant="info"
        confirmLabel={t.sales.recordSale}
        cancelLabel={t.cancel}
        onConfirm={() => recordSale.mutate(cart.map((c) => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })))}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
