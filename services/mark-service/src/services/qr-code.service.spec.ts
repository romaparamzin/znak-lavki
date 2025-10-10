import { Test, TestingModule } from '@nestjs/testing';
import { QrCodeService } from './qr-code.service';

describe('QrCodeService', () => {
  let service: QrCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrCodeService],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
  });

  describe('generateQrCode', () => {
    it('should generate QR code data URL', async () => {
      const data = '99LAV0460717796408966LAV1234567890ABCDEF';
      const qrCode = await service.generateQrCode(data, false);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle invalid data', async () => {
      const data = '';

      await expect(service.generateQrCode(data, false)).rejects.toThrow();
    });
  });

  describe('generateQrCodesBatch', () => {
    it('should generate multiple QR codes', async () => {
      const dataArray = [
        '99LAV0460717796408966LAV1234567890ABCDEF',
        '99LAV0460717796408966LAV2234567890ABCDEF',
        '99LAV0460717796408966LAV3234567890ABCDEF',
      ];

      const qrCodes = await service.generateQrCodesBatch(dataArray, false);

      expect(qrCodes).toHaveLength(3);
      qrCodes.forEach((qrCode) => {
        expect(qrCode).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('should handle batch generation efficiently', async () => {
      const dataArray = Array.from({ length: 100 }, (_, i) =>
        `99LAV0460717796408966LAV${i.toString().padStart(14, '0')}AB`,
      );

      const startTime = Date.now();
      const qrCodes = await service.generateQrCodesBatch(dataArray, false);
      const elapsed = Date.now() - startTime;

      expect(qrCodes).toHaveLength(100);
      expect(elapsed).toBeLessThan(10000); // Should complete in < 10 seconds
    });
  });

  describe('validateQrData', () => {
    it('should validate correct data', () => {
      const data = '99LAV0460717796408966LAV1234567890ABCDEF';
      expect(service.validateQrData(data)).toBe(true);
    });

    it('should reject empty data', () => {
      expect(service.validateQrData('')).toBe(false);
    });

    it('should reject data exceeding max length', () => {
      const longData = 'a'.repeat(2001);
      expect(service.validateQrData(longData)).toBe(false);
    });
  });
});

