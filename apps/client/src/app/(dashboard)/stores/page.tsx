'use client';

import { useEffect, useState } from 'react';
import { Plus, Store, MapPin } from 'lucide-react';
import { useStore } from '@/providers/store-provider';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function StoresPage() {
  const { stores, fetchStores, activeStore, switchStore } = useStore();
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.stores.title}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t.stores.addStore}
          </button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <div key={store._id} className={`card p-6 cursor-pointer transition-all hover:shadow-md ${activeStore?._id === store._id ? 'ring-2 ring-primary-500 border-primary-200' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-3 rounded-xl">
                  <Store className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{store.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{t.storeCategories[store.category as keyof typeof t.storeCategories] || store.category}</p>
                </div>
              </div>
              {activeStore?._id === store._id && (
                <span className="badge-info">{t.stores.active}</span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              {store.address.city}, {store.address.state}
            </div>
            {activeStore?._id !== store._id && (
              <button onClick={() => switchStore(store._id)} className="mt-4 btn-secondary text-sm w-full">{t.stores.switchTo}</button>
            )}
          </div>
        ))}
      </div>

      {showCreate && <CreateStoreModal onClose={() => { setShowCreate(false); fetchStores(); }} />}
    </div>
  );
}

function CreateStoreModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '', category: 'general', phone: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
  });
  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = Object.entries(t.storeCategories).map(([value, label]) => ({ value, label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/stores', form);
      toast.success(t.stores.created);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t.stores.createFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t.stores.createTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">{t.stores.storeName}</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder={t.stores.storeNamePlaceholder} required />
          </div>
          <div>
            <label className="form-label">{t.stores.category}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">{t.onboarding.addressLine1}</label>
            <input type="text" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} className="input-field" placeholder={t.onboarding.addressLine1Placeholder} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">{t.onboarding.city}</label>
              <input type="text" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="input-field" required />
            </div>
            <div>
              <label className="form-label">{t.onboarding.state}</label>
              <input type="text" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="input-field" required />
            </div>
            <div>
              <label className="form-label">{t.onboarding.pincode}</label>
              <input type="text" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} className="input-field" required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t.cancel}</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? t.loading : t.stores.addStore}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
