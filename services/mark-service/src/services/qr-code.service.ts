import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as sharp from 'sharp';

/**
 * QR Code Service
 * Handles QR code generation with optional logo embedding
 */
@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  // QR Code generation options
  private readonly QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H', // High error correction (allows logo embedding)
    type: 'image/png',
    quality: 0.95,
    margin: 1,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };

  // Logo options
  private readonly LOGO_SIZE_RATIO = 0.2; // Logo takes 20% of QR code size

  /**
   * Generate QR code as data URL
   * @param data - Data to encode in QR code
   * @param embedLogo - Whether to embed logo
   * @returns Promise<string> - Data URL of the QR code image
   */
  async generateQrCode(
    data: string,
    embedLogo: boolean = false,
  ): Promise<string> {
    try {
      // Generate base QR code
      const qrCodeDataUrl = await QRCode.toDataURL(data, this.QR_OPTIONS);

      // If logo embedding is requested
      if (embedLogo) {
        return await this.embedLogo(qrCodeDataUrl);
      }

      return qrCodeDataUrl;
    } catch (error: any) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate multiple QR codes in batch
   * @param dataArray - Array of data to encode
   * @param embedLogo - Whether to embed logo
   * @returns Promise<string[]> - Array of data URLs
   */
  async generateQrCodesBatch(
    dataArray: string[],
    embedLogo: boolean = false,
  ): Promise<string[]> {
    const startTime = Date.now();
    this.logger.log(`Starting batch QR code generation for ${dataArray.length} codes`);

    // Generate QR codes in parallel with concurrency limit
    const BATCH_SIZE = 50;
    const results: string[] = [];

    for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
      const batch = dataArray.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((data) => this.generateQrCode(data, embedLogo)),
      );
      results.push(...batchResults);

      this.logger.debug(
        `Generated ${results.length}/${dataArray.length} QR codes`,
      );
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `Batch QR code generation completed: ${results.length} codes in ${elapsed}ms`,
    );

    return results;
  }

  /**
   * Generate QR code as buffer (for file storage)
   * @param data - Data to encode
   * @param embedLogo - Whether to embed logo
   * @returns Promise<Buffer> - PNG image buffer
   */
  async generateQrCodeBuffer(
    data: string,
    embedLogo: boolean = false,
  ): Promise<Buffer> {
    try {
      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(data, {
        ...this.QR_OPTIONS,
        type: 'png',
      });

      // If logo embedding is requested
      if (embedLogo) {
        return await this.embedLogoToBuffer(qrBuffer);
      }

      return qrBuffer;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate QR code buffer: ${error.message}`,
        error.stack,
      );
      throw new Error(`QR code buffer generation failed: ${error.message}`);
    }
  }

  /**
   * Embed logo into QR code (data URL)
   * @param qrCodeDataUrl - Base QR code data URL
   * @returns Promise<string> - QR code with embedded logo
   */
  private async embedLogo(qrCodeDataUrl: string): Promise<string> {
    try {
      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      // Create a simple circular logo using sharp
      // In production, you would load an actual logo file
      const qrMetadata = await sharp(qrBuffer).metadata();
      const qrSize = qrMetadata.width;
      const logoSize = Math.floor(qrSize * this.LOGO_SIZE_RATIO);

      // Create a simple logo (circle with "LAV" text simulation)
      // In production, replace this with actual logo loading
      const logo = await this.createSimpleLogo(logoSize);

      // Composite logo onto QR code
      const finalBuffer = await sharp(qrBuffer)
        .composite([
          {
            input: logo,
            gravity: 'center',
          },
        ])
        .png()
        .toBuffer();

      // Convert back to data URL
      return `data:image/png;base64,${finalBuffer.toString('base64')}`;
    } catch (error: any) {
      this.logger.warn(
        `Failed to embed logo, returning base QR code: ${error.message}`,
      );
      return qrCodeDataUrl;
    }
  }

  /**
   * Embed logo into QR code buffer
   * @param qrBuffer - Base QR code buffer
   * @returns Promise<Buffer> - QR code with embedded logo
   */
  private async embedLogoToBuffer(qrBuffer: Buffer): Promise<Buffer> {
    try {
      const qrMetadata = await sharp(qrBuffer).metadata();
      const qrSize = qrMetadata.width;
      const logoSize = Math.floor(qrSize * this.LOGO_SIZE_RATIO);

      const logo = await this.createSimpleLogo(logoSize);

      return await sharp(qrBuffer)
        .composite([
          {
            input: logo,
            gravity: 'center',
          },
        ])
        .png()
        .toBuffer();
    } catch (error: any) {
      this.logger.warn(
        `Failed to embed logo to buffer, returning base QR code: ${error.message}`,
      );
      return qrBuffer;
    }
  }

  /**
   * Create a simple logo (placeholder)
   * In production, load actual logo from file system or assets
   * @param size - Logo size
   * @returns Promise<Buffer> - Logo buffer
   */
  private async createSimpleLogo(size: number): Promise<Buffer> {
    // Create a simple white circle with border as logo placeholder
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" 
                fill="white" stroke="black" stroke-width="3"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
              font-family="Arial" font-size="${size / 3}" font-weight="bold" fill="black">
          LAV
        </text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  /**
   * Validate QR code data
   * @param data - Data to validate
   * @returns boolean - True if data is valid for QR code generation
   */
  validateQrData(data: string): boolean {
    // QR codes can store up to ~4296 alphanumeric characters (version 40)
    // We'll set a reasonable limit
    const MAX_LENGTH = 2000;
    return data.length > 0 && data.length <= MAX_LENGTH;
  }
}

