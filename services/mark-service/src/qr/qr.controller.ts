import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QrService } from './qr.service';

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate QR code' })
  async generateQr(@Body() data: { productId: string; metadata?: any }) {
    return this.qrService.generateQrCode(data.productId, data.metadata);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate QR code' })
  async validateQr(@Param('code') code: string) {
    return this.qrService.validateQrCode(code);
  }
}


