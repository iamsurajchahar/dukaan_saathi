'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Download, Search, Trash2, Edit2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import HelpTooltip from '@/components/ui/help-tooltip';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: async () => {
      const { data } = await apiClient.get('/products', { params: { search, page, limit: 20 } });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t.inventory.productDeleted);
      setDeleteTarget(null);
    },
  });

  const exportCSV = async () => {
    const { data } = await apiClient.get('/products/export', { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.inventory.title}
        actions={
          <>
            <button onClick={exportCSV} className="btn-secondary gap-2 text-sm"><Download className="w-4 h-4" />{t.inventory.export}</button>
            <a href="/inventory/import" className="btn-secondary gap-2 text-sm"><Upload className="w-4 h-4" />{t.inventory.importCsv}</a>
            <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn-primary gap-2 text-sm"><Plus className="w-4 h-4" />{t.inventory.addProduct}</button>
          </>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-12" placeholder={t.inventory.searchPlaceholder} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.product}</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.sku}</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.category}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.price}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.stock}</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                {t.inventory.reorderLevel} <HelpTooltip text={t.help.reorderLevel} />
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.inventory.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {data?.products?.map((product: any) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(product.price?.sellingPrice)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${product.currentStock <= product.reorderLevel ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {product.currentStock}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500">{product.reorderLevel}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { setEditProduct(product); setShowForm(true); }} className="text-gray-400 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 mr-1" aria-label={t.edit}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(product)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50" aria-label={t.delete}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.products?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-base">{t.inventory.noProducts}</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">{t.page} {data.pagination.page} {t.of} {data.pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-sm py-2">{t.previous}</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= data.pagination.totalPages} className="btn-secondary text-sm py-2">{t.next}</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && <ProductModal product={editProduct} onClose={() => setShowForm(false)} />}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t.delete}
        message={t.inventory.deleteConfirm}
        variant="danger"
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ProductModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    category: product?.category || '',
    unit: product?.unit || 'piece',
    costPrice: product?.price?.costPrice || 0,
    sellingPrice: product?.price?.sellingPrice || 0,
    mrp: product?.price?.mrp || 0,
    currentStock: product?.currentStock || 0,
    reorderLevel: product?.reorderLevel || 10,
    reorderQuantity: product?.reorderQuantity || 50,
    leadTimeDays: product?.leadTimeDays || 3,
  });
  const [isLoading, setIsLoading] = useState(false);

  const unitOptions = Object.entries(t.productUnits).map(([value, label]) => ({ value, label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        price: { costPrice: form.costPrice, sellingPrice: form.sellingPrice, mrp: form.mrp },
      };
      if (product) {
        await apiClient.put(`/products/${product._id}`, payload);
        toast.success(t.inventory.productUpdated);
      } else {
        await apiClient.post('/products', payload);
        toast.success(t.inventory.productAdded);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.inventory.saveFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string | number) => setForm({ ...form, [field]: value });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold">{product ? t.inventory.editTitle : t.inventory.addTitle}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t.inventory.sku} <HelpTooltip text={t.help.sku} /></label>
              <input type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} className="input-field" required disabled={!!product} />
            </div>
            <div>
              <label className="form-label">{t.inventory.productName}</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t.inventory.category}</label>
              <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)} className="input-field" placeholder="e.g., Grocery, Medicine" required />
            </div>
            <div>
              <label className="form-label">{t.inventory.unit}</label>
              <select value={form.unit} onChange={(e) => update('unit', e.target.value)} className="input-field">
                {unitOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">{t.inventory.costPrice}</label>
              <input type="number" value={form.costPrice} onChange={(e) => update('costPrice', +e.target.value)} className="input-field" min={0} required />
            </div>
            <div>
              <label className="form-label">{t.inventory.sellingPrice}</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => update('sellingPrice', +e.target.value)} className="input-field" min={0} required />
            </div>
            <div>
              <label className="form-label">{t.inventory.mrp}</label>
              <input type="number" value={form.mrp} onChange={(e) => update('mrp', +e.target.value)} className="input-field" min={0} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">{t.inventory.currentStock}</label>
              <input type="number" value={form.currentStock} onChange={(e) => update('currentStock', +e.target.value)} className="input-field" min={0} />
            </div>
            <div>
              <label className="form-label">{t.inventory.reorderLevel} <HelpTooltip text={t.help.reorderLevel} /></label>
              <input type="number" value={form.reorderLevel} onChange={(e) => update('reorderLevel', +e.target.value)} className="input-field" min={0} />
            </div>
            <div>
              <label className="form-label">{t.inventory.leadTime} <HelpTooltip text={t.help.leadTime} /></label>
              <input type="number" value={form.leadTimeDays} onChange={(e) => update('leadTimeDays', +e.target.value)} className="input-field" min={0} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t.cancel}</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? t.inventory.saving : product ? t.inventory.update : t.inventory.addProduct}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
