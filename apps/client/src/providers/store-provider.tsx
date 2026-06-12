'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import type { IStore } from '@stocksense/shared-types';

interface StoreContextType {
  stores: IStore[];
  activeStore: IStore | null;
  isLoading: boolean;
  fetchStores: () => Promise<void>;
  switchStore: (storeId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<IStore[]>([]);
  const [activeStore, setActiveStore] = useState<IStore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchStores = useCallback(async () => {
    if (hasFetched) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/stores');
      setStores(data.data);
      setHasFetched(true);
      const activeId = localStorage.getItem('activeStoreId');
      const active = data.data.find((s: IStore) => s._id === activeId) || data.data[0];
      if (active) {
        setActiveStore(active);
        localStorage.setItem('activeStoreId', active._id);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [hasFetched]);

  const switchStore = useCallback(async (storeId: string) => {
    await apiClient.post(`/stores/${storeId}/switch`);
    localStorage.setItem('activeStoreId', storeId);
    const store = stores.find((s) => s._id === storeId);
    if (store) setActiveStore(store);
  }, [stores]);

  return (
    <StoreContext.Provider value={{ stores, activeStore, isLoading, fetchStores, switchStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
