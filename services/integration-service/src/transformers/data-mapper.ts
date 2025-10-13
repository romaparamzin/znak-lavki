import { Product } from '../interfaces/pim.interface';
import { Order } from '../interfaces/wms.interface';
import { ProductionBatch } from '../interfaces/1c.interface';

export class DataMapper {
  /**
   * Transform WMS order data to internal format
   */
  static transformWMSOrder(externalOrder: any): Order {
    return {
      orderId: externalOrder.id || externalOrder.order_id,
      customerId: externalOrder.customer_id || externalOrder.customerId,
      orderDate: new Date(externalOrder.order_date || externalOrder.createdAt),
      status: this.mapOrderStatus(externalOrder.status),
      items: this.transformOrderItems(externalOrder.items || externalOrder.order_items || []),
      totalAmount: parseFloat(externalOrder.total_amount || externalOrder.totalAmount || 0),
      deliveryAddress: externalOrder.delivery_address || externalOrder.shippingAddress,
      notes: externalOrder.notes || externalOrder.comments,
    };
  }

  /**
   * Transform PIM product data to internal format
   */
  static transformPIMProduct(externalProduct: any): Product {
    return {
      gtin: externalProduct.gtin || externalProduct.ean || externalProduct.barcode,
      name: externalProduct.name || externalProduct.title,
      description: externalProduct.description || externalProduct.desc,
      brand: externalProduct.brand || externalProduct.manufacturer,
      category: externalProduct.category || externalProduct.category_name || 'Unknown',
      attributes: this.transformProductAttributes(
        externalProduct.attributes || externalProduct.properties || {},
      ),
      images: Array.isArray(externalProduct.images)
        ? externalProduct.images
        : externalProduct.image
          ? [externalProduct.image]
          : [],
      specifications: externalProduct.specifications || externalProduct.specs || {},
      createdAt: new Date(externalProduct.created_at || externalProduct.createdAt || Date.now()),
      updatedAt: new Date(externalProduct.updated_at || externalProduct.updatedAt || Date.now()),
    };
  }

  /**
   * Transform 1C production batch to internal format
   */
  static transform1CProductionBatch(externalBatch: any): ProductionBatch {
    return {
      batchId: externalBatch.id || externalBatch.batch_id || externalBatch.BatchId,
      productGtin: externalBatch.gtin || externalBatch.product_gtin || externalBatch.ProductGTIN,
      productName: externalBatch.product_name || externalBatch.ProductName || '',
      productionDate: new Date(externalBatch.production_date || externalBatch.ProductionDate),
      expirationDate:
        externalBatch.expiration_date || externalBatch.ExpirationDate
          ? new Date(externalBatch.expiration_date || externalBatch.ExpirationDate)
          : undefined,
      quantity: parseInt(externalBatch.quantity || externalBatch.Quantity || 0),
      status: this.mapBatchStatus(externalBatch.status || externalBatch.Status),
      marks: Array.isArray(externalBatch.marks) ? externalBatch.marks : [],
      qualityCheck:
        externalBatch.quality_check || externalBatch.QualityCheck
          ? this.transformQualityCheck(externalBatch.quality_check || externalBatch.QualityCheck)
          : undefined,
    };
  }

  /**
   * Map order status from external to internal format
   */
  private static mapOrderStatus(
    status: string,
  ): 'pending' | 'processing' | 'completed' | 'cancelled' {
    const statusMap = {
      new: 'pending',
      created: 'pending',
      pending: 'pending',
      in_progress: 'processing',
      processing: 'processing',
      shipped: 'completed',
      delivered: 'completed',
      completed: 'completed',
      done: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled',
      rejected: 'cancelled',
    };

    return statusMap[status?.toLowerCase()] || 'pending';
  }

  /**
   * Map batch status from external to internal format
   */
  private static mapBatchStatus(
    status: string,
  ): 'planned' | 'in_progress' | 'completed' | 'cancelled' {
    const statusMap = {
      planned: 'planned',
      scheduled: 'planned',
      in_progress: 'in_progress',
      processing: 'in_progress',
      active: 'in_progress',
      completed: 'completed',
      finished: 'completed',
      done: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled',
      aborted: 'cancelled',
    };

    return statusMap[status?.toLowerCase()] || 'planned';
  }

  /**
   * Transform order items
   */
  private static transformOrderItems(items: any[]): any[] {
    return items.map((item) => ({
      itemId: item.id || item.item_id || item.ItemId,
      gtin: item.gtin || item.ean || item.barcode,
      productName: item.name || item.product_name || item.ProductName || '',
      quantity: parseInt(item.quantity || item.qty || 0),
      markCodes: Array.isArray(item.mark_codes) ? item.mark_codes : item.marks || [],
      unitPrice: parseFloat(item.unit_price || item.price || 0),
      totalPrice: parseFloat(item.total_price || item.total || 0),
    }));
  }

  /**
   * Transform product attributes
   */
  private static transformProductAttributes(attributes: any): any {
    const transformed: any = {};

    // Weight
    if (attributes.weight || attributes.Weight) {
      transformed.weight = parseFloat(attributes.weight || attributes.Weight);
    }

    // Dimensions
    if (
      attributes.dimensions ||
      attributes.Dimensions ||
      (attributes.length && attributes.width && attributes.height)
    ) {
      transformed.dimensions = {
        length: parseFloat(
          attributes.dimensions?.length || attributes.length || attributes.Length || 0,
        ),
        width: parseFloat(
          attributes.dimensions?.width || attributes.width || attributes.Width || 0,
        ),
        height: parseFloat(
          attributes.dimensions?.height || attributes.height || attributes.Height || 0,
        ),
        unit: attributes.dimensions?.unit || attributes.dimension_unit || 'mm',
      };
    }

    // Volume
    if (attributes.volume || attributes.Volume) {
      transformed.volume = parseFloat(attributes.volume || attributes.Volume);
    }

    // Color
    if (attributes.color || attributes.Color) {
      transformed.color = attributes.color || attributes.Color;
    }

    // Material
    if (attributes.material || attributes.Material) {
      transformed.material = attributes.material || attributes.Material;
    }

    // Country of origin
    if (attributes.country_of_origin || attributes.CountryOfOrigin || attributes.country) {
      transformed.countryOfOrigin =
        attributes.country_of_origin || attributes.CountryOfOrigin || attributes.country;
    }

    // Manufacturer
    if (attributes.manufacturer || attributes.Manufacturer) {
      transformed.manufacturer = attributes.manufacturer || attributes.Manufacturer;
    }

    // Shelf life
    if (attributes.shelf_life || attributes.ShelfLife) {
      transformed.shelfLife = parseInt(attributes.shelf_life || attributes.ShelfLife);
    }

    // Storage conditions
    if (attributes.storage_conditions || attributes.StorageConditions) {
      transformed.storageConditions = attributes.storage_conditions || attributes.StorageConditions;
    }

    // Copy any other attributes
    Object.keys(attributes).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (
        ![
          'weight',
          'dimensions',
          'volume',
          'color',
          'material',
          'country_of_origin',
          'manufacturer',
          'shelf_life',
          'storage_conditions',
          'length',
          'width',
          'height',
        ].includes(lowerKey)
      ) {
        transformed[key] = attributes[key];
      }
    });

    return transformed;
  }

  /**
   * Transform quality check data
   */
  private static transformQualityCheck(qualityCheck: any): any {
    return {
      passed:
        qualityCheck.passed === true ||
        qualityCheck.passed === 'true' ||
        qualityCheck.Passed === 'true',
      checkedBy: qualityCheck.checked_by || qualityCheck.CheckedBy || '',
      checkDate: new Date(qualityCheck.check_date || qualityCheck.CheckDate || Date.now()),
      notes: qualityCheck.notes || qualityCheck.Notes,
    };
  }

  /**
   * Transform internal order to WMS format
   */
  static toWMSOrder(order: Order): any {
    return {
      order_id: order.orderId,
      customer_id: order.customerId,
      order_date: order.orderDate.toISOString(),
      status: order.status,
      items: order.items.map((item) => ({
        item_id: item.itemId,
        gtin: item.gtin,
        product_name: item.productName,
        quantity: item.quantity,
        mark_codes: item.markCodes || [],
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })),
      total_amount: order.totalAmount,
      delivery_address: order.deliveryAddress,
      notes: order.notes,
    };
  }

  /**
   * Transform internal product to PIM format
   */
  static toPIMProduct(product: Product): any {
    return {
      gtin: product.gtin,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      attributes: product.attributes,
      images: product.images || [],
      specifications: product.specifications || {},
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  /**
   * Validate and sanitize data
   */
  static sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data.trim();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== null && value !== undefined && value !== '') {
          sanitized[key] = this.sanitizeData(value);
        }
      });
      return sanitized;
    }

    return data;
  }
}
