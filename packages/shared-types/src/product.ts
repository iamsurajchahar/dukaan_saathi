export type ProductUnit = 'piece' | 'kg' | 'litre' | 'pack' | 'dozen';

export interface IProduct {
  _id: string;
  storeId: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: ProductUnit;
  price: {
    costPrice: number;
    sellingPrice: number;
    mrp: number;
  };
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  barcode?: string;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateProductRequest {
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: ProductUnit;
  price: IProduct['price'];
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays?: number;
  barcode?: string;
  tags?: string[];
}
