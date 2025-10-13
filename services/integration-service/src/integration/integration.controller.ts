import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WMSService } from '../integrations/wms.service';
import { PIMService } from '../integrations/pim.service';
import { OneCService } from '../integrations/1c.service';
import {
  ValidateMarkDto,
  BlockItemDto,
  GetOrderDto,
  NotifyExpiringItemsDto,
  GetProductDto,
  UpdateProductAttributeDto,
  MarkGenerationRequestDto,
  PrintRequestDto,
} from '../dto/integration.dto';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly wmsService: WMSService,
    private readonly pimService: PIMService,
    private readonly oneCService: OneCService,
    private readonly logger: CustomLoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  // WMS Endpoints
  @Post('wms/validate-mark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate mark code via WMS' })
  @ApiResponse({ status: 200, description: 'Mark validated successfully' })
  async validateMark(@Body() dto: ValidateMarkDto) {
    return await this.wmsService.validateMarkOnScan(dto.markCode);
  }

  @Post('wms/block-item')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block item in warehouse' })
  @ApiResponse({ status: 200, description: 'Item blocked successfully' })
  async blockItem(@Body() dto: BlockItemDto) {
    await this.wmsService.blockItemInWarehouse(dto.markCode, dto.reason);
    return { success: true, message: 'Item blocked successfully' };
  }

  @Get('wms/order/:orderId')
  @ApiOperation({ summary: 'Get order details from WMS' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  async getOrder(@Param('orderId') orderId: string) {
    return await this.wmsService.getOrderDetails(orderId);
  }

  @Post('wms/notify-expiring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify about expiring items' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async notifyExpiringItems(@Body() dto: NotifyExpiringItemsDto) {
    await this.wmsService.notifyExpiringItems(dto.items);
    return { success: true, message: 'Notification sent successfully' };
  }

  @Get('wms/inventory/:markCode')
  @ApiOperation({ summary: 'Get inventory status' })
  @ApiResponse({ status: 200, description: 'Inventory status retrieved' })
  async getInventoryStatus(@Param('markCode') markCode: string) {
    return await this.wmsService.getInventoryStatus(markCode);
  }

  // PIM Endpoints
  @Get('pim/product/:gtin')
  @ApiOperation({ summary: 'Get product by GTIN from PIM' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async getProduct(@Param('gtin') gtin: string) {
    return await this.pimService.getProductByGTIN(gtin);
  }

  @Post('pim/product/update-attributes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product attributes in PIM' })
  @ApiResponse({ status: 200, description: 'Attributes updated successfully' })
  async updateProductAttributes(@Body() dto: UpdateProductAttributeDto) {
    await this.pimService.updateProductAttribute(dto.gtin, dto.attributes);
    return { success: true, message: 'Attributes updated successfully' };
  }

  @Post('pim/sync-catalog')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger product catalog sync' })
  @ApiResponse({ status: 202, description: 'Sync started' })
  async syncCatalog() {
    // Run async
    this.pimService.syncProductCatalog().catch((error) => {
      this.logger.error('Catalog sync failed', error.stack, 'Integration');
    });
    return { success: true, message: 'Catalog sync started' };
  }

  @Post('pim/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search products in PIM' })
  @ApiResponse({ status: 200, description: 'Products found' })
  async searchProducts(@Body() body: { query: string; filters?: any }) {
    return await this.pimService.searchProducts(body.query, body.filters);
  }

  @Get('pim/categories')
  @ApiOperation({ summary: 'Get product categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories() {
    return await this.pimService.getProductCategories();
  }

  // 1C Endpoints
  @Post('1c/request-marks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request mark codes from 1C' })
  @ApiResponse({ status: 200, description: 'Mark codes generated' })
  async requestMarkCodes(@Body() dto: MarkGenerationRequestDto) {
    const marks = await this.oneCService.requestMarkCodes(dto);
    return { success: true, marks };
  }

  @Post('1c/send-to-printer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send marks to printer via 1C' })
  @ApiResponse({ status: 200, description: 'Marks sent to printer' })
  async sendToPrinter(@Body() dto: PrintRequestDto) {
    await this.oneCService.sendMarksToPrinter(dto);
    return { success: true, message: 'Marks sent to printer' };
  }

  @Post('1c/sync-batches')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger production batches sync' })
  @ApiResponse({ status: 202, description: 'Sync started' })
  async syncBatches() {
    // Run async
    this.oneCService.syncProductionBatches().catch((error) => {
      this.logger.error('Batch sync failed', error.stack, 'Integration');
    });
    return { success: true, message: 'Batch sync started' };
  }

  @Get('1c/document/:documentId/status')
  @ApiOperation({ summary: 'Get document status from 1C' })
  @ApiResponse({ status: 200, description: 'Document status retrieved' })
  async getDocumentStatus(@Param('documentId') documentId: string) {
    return await this.oneCService.getDocumentStatus(documentId);
  }

  @Get('1c/document/:documentId/export')
  @ApiOperation({ summary: 'Export document from 1C' })
  @ApiResponse({ status: 200, description: 'Document exported' })
  async exportDocument(@Param('documentId') documentId: string) {
    return await this.oneCService.exportDocument(documentId, 'xml');
  }

  // Health and Metrics
  @Get('health')
  @ApiOperation({ summary: 'Check health of all integrations' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async healthCheck() {
    const [wmsHealth, pimHealth, oneCHealth] = await Promise.all([
      this.wmsService.healthCheck(),
      this.pimService.healthCheck(),
      this.oneCService.healthCheck(),
    ]);

    return {
      wms: wmsHealth ? 'healthy' : 'unhealthy',
      pim: pimHealth ? 'healthy' : 'unhealthy',
      '1c': oneCHealth ? 'healthy' : 'unhealthy',
      overall:
        wmsHealth && pimHealth && oneCHealth
          ? 'healthy'
          : wmsHealth || pimHealth || oneCHealth
            ? 'degraded'
            : 'unhealthy',
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get integration metrics' })
  @ApiResponse({ status: 200, description: 'Metrics data' })
  async getMetrics() {
    return this.metricsService.getAllMetrics();
  }

  @Get('metrics/:service')
  @ApiOperation({ summary: 'Get metrics for specific service' })
  @ApiResponse({ status: 200, description: 'Service metrics' })
  async getServiceMetrics(@Param('service') service: string) {
    const metrics = this.metricsService.getMetrics(service);
    if (!metrics) {
      return { error: 'Service not found' };
    }
    return metrics;
  }
}
