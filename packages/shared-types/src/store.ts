export type StoreCategory = 'grocery' | 'pharmacy' | 'electronics' | 'clothing' | 'general' | 'other';

export interface IStoreSettings {
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  defaultLeadTimeDays: number;
}

export interface IStore {
  _id: string;
  ownerId: string;
  name: string;
  category: StoreCategory;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  phone?: string;
  gstNumber?: string;
  settings: IStoreSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateStoreRequest {
  name: string;
  category: StoreCategory;
  address: IStore['address'];
  phone?: string;
  gstNumber?: string;
}
