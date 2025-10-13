export interface Product {
  gtin: string;
  name: string;
  description?: string;
  brand?: string;
  category: string;
  attributes: ProductAttributes;
  images?: string[];
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributes {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'm';
  };
  volume?: number;
  color?: string;
  material?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  shelfLife?: number; // in days
  storageConditions?: string;
  [key: string]: any;
}

export interface PIMIntegration {
  getProductByGTIN(gtin: string): Promise<Product>;
  updateProductAttribute(gtin: string, attributes: any): Promise<void>;
  syncProductCatalog(): Promise<void>;
}

export interface ProductSyncResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: SyncError[];
  duration: number; // in milliseconds
}

export interface SyncError {
  gtin: string;
  error: string;
  timestamp: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  attributes: string[];
}

export interface PriceInfo {
  gtin: string;
  price: number;
  currency: string;
  priceType: 'retail' | 'wholesale' | 'promotional';
  effectiveFrom: Date;
  effectiveTo?: Date;
}
