import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QrService {
  async generateQrCode(productId: string, metadata?: any): Promise<any> {
    const code = uuidv4();
    const data = JSON.stringify({
      code,
      productId,
      metadata,
      createdAt: new Date().toISOString(),
    });

    const qrCodeImage = await QRCode.toDataURL(data);

    return {
      code,
      productId,
      qrCodeImage,
      data,
    };
  }

  async validateQrCode(code: string): Promise<any> {
    // Implement validation logic
    return {
      valid: true,
      code,
      message: 'QR code is valid',
    };
  }
}


