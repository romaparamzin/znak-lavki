export interface ValidationResult {
  isValid: boolean;
  markCode: string;
  status: 'valid' | 'expired' | 'blocked' | 'invalid';
  message?: string;
  productInfo?: {
    gtin: string;
    name: string;
    expirationDate?: Date;
  };
  warehouseLocation?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress?: string;
  notes?: string;
}

export interface OrderItem {
  itemId: string;
  gtin: string;
  productName: string;
  quantity: number;
  markCodes?: string[];
  unitPrice: number;
  totalPrice: number;
}

export interface ExpiringItem {
  markCode: string;
  gtin: string;
  productName: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  warehouseLocation: string;
  quantity: number;
  batchNumber?: string;
}

export interface WMSIntegration {
  validateMarkOnScan(markCode: string): Promise<ValidationResult>;
  blockItemInWarehouse(markCode: string, reason: string): Promise<void>;
  getOrderDetails(orderId: string): Promise<Order>;
  notifyExpiringItems(items: ExpiringItem[]): Promise<void>;
}

export interface WarehouseMovement {
  movementId: string;
  markCode: string;
  fromLocation: string;
  toLocation: string;
  timestamp: Date;
  operatorId: string;
  movementType: 'receipt' | 'shipment' | 'transfer' | 'adjustment';
}

export interface InventoryItem {
  markCode: string;
  gtin: string;
  location: string;
  status: 'available' | 'reserved' | 'blocked' | 'shipped';
  quantity: number;
  lastUpdated: Date;
}
