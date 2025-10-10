import { BaseEntity } from './common.types';

export enum QrCodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCANNED = 'scanned',
  EXPIRED = 'expired',
}

export interface QrCode extends BaseEntity {
  code: string;
  productId: string;
  status: QrCodeStatus;
  imageUrl?: string;
  metadata?: Record<string, any>;
  scannedAt?: Date;
  scannedBy?: string;
  expiresAt?: Date;
}

export interface QrCodeGenerateRequest {
  productId: string;
  quantity?: number;
  expiresInDays?: number;
  metadata?: Record<string, any>;
}

export interface QrCodeGenerateResponse {
  codes: QrCode[];
  count: number;
}

export interface QrCodeValidateRequest {
  code: string;
}

export interface QrCodeValidateResponse {
  valid: boolean;
  qrCode?: QrCode;
  product?: any;
  message?: string;
}

export interface QrCodeScanRequest {
  code: string;
  scannedBy: string;
  location?: string;
  metadata?: Record<string, any>;
}


