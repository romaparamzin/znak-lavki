export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidSKU(sku: string): boolean {
  // SKU should be alphanumeric and can contain dashes and underscores
  const skuRegex = /^[A-Z0-9_-]{3,50}$/i;
  return skuRegex.test(sku);
}

export function isValidBarcode(barcode: string): boolean {
  // Basic validation for common barcode formats (EAN-13, UPC-A, etc.)
  const barcodeRegex = /^\d{8,14}$/;
  return barcodeRegex.test(barcode);
}


