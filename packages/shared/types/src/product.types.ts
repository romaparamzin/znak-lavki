import { BaseEntity, Status } from './common.types';

export interface Product extends BaseEntity {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: string;
  manufacturer?: string;
  status: Status;
  metadata?: Record<string, any>;
}

export interface ProductCreateRequest {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: string;
  manufacturer?: string;
  metadata?: Record<string, any>;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  status?: Status;
  metadata?: Record<string, any>;
}


