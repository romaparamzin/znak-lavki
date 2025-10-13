export interface MarkGenerationRequest {
  requestId: string;
  productGtin: string;
  quantity: number;
  productionBatchId?: string;
  expirationDate?: Date;
  requestedBy: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface PrintRequest {
  printJobId: string;
  marks: MarkData[];
  printerQueue: string;
  printFormat: 'datamatrix' | 'qr' | 'barcode';
  copies: number;
  priority: number;
}

export interface MarkData {
  markCode: string;
  gtin: string;
  serialNumber: string;
  expirationDate?: Date;
  batchNumber?: string;
}

export interface OneC_Integration {
  requestMarkCodes(request: MarkGenerationRequest): Promise<string[]>;
  sendMarksToPrinter(marks: PrintRequest): Promise<void>;
  syncProductionBatches(): Promise<void>;
}

export interface ProductionBatch {
  batchId: string;
  productGtin: string;
  productName: string;
  productionDate: Date;
  expirationDate?: Date;
  quantity: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  marks: string[];
  qualityCheck?: {
    passed: boolean;
    checkedBy: string;
    checkDate: Date;
    notes?: string;
  };
}

export interface MarkCodeResponse {
  success: boolean;
  requestId: string;
  marks: string[];
  generatedCount: number;
  errors?: string[];
}

export interface DocumentExport {
  documentId: string;
  documentType: 'invoice' | 'waybill' | 'act' | 'certificate';
  documentNumber: string;
  documentDate: Date;
  marks: string[];
  xmlData: string;
  status: 'pending' | 'sent' | 'confirmed' | 'rejected';
}

export interface ContractorInfo {
  contractorId: string;
  name: string;
  inn: string; // Taxpayer Identification Number
  kpp?: string; // Tax Registration Reason Code
  address: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}
