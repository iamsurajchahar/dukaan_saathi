export type SaleSource = 'manual' | 'csv_import' | 'pos';

export interface ISaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ISale {
  _id: string;
  storeId: string;
  items: ISaleItem[];
  totalAmount: number;
  saleDate: string;
  recordedBy: string;
  source: SaleSource;
  notes?: string;
  createdAt: string;
}

export interface IRecordSaleRequest {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  saleDate?: string;
  notes?: string;
}

export interface ISalesSummary {
  totalRevenue: number;
  totalUnits: number;
  totalTransactions: number;
  dailyData: { date: string; revenue: number; units: number }[];
}
