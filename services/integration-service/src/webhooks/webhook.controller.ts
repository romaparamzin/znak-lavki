import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { WebhookEventDto } from '../dto/integration.dto';
import { CustomLoggerService } from '../common/logger.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Post('wms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from WMS system' })
  @ApiHeader({ name: 'X-WMS-Signature', description: 'Webhook signature for verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleWMSWebhook(
    @Body() payload: WebhookEventDto,
    @Headers('x-wms-signature') signature: string,
  ) {
    this.logger.log(`Received WMS webhook: ${payload.eventType}`, 'Webhook');

    // Verify signature
    if (!this.webhookService.verifySignature(payload, signature, 'wms')) {
      this.logger.warn('Invalid WMS webhook signature', 'Webhook');
      throw new UnauthorizedException('Invalid signature');
    }

    try {
      await this.webhookService.processWMSWebhook(payload);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Failed to process WMS webhook', error.stack, 'Webhook');
      throw new BadRequestException('Failed to process webhook');
    }
  }

  @Post('pim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from PIM system' })
  @ApiHeader({ name: 'X-PIM-Signature', description: 'Webhook signature for verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handlePIMWebhook(
    @Body() payload: WebhookEventDto,
    @Headers('x-pim-signature') signature: string,
  ) {
    this.logger.log(`Received PIM webhook: ${payload.eventType}`, 'Webhook');

    // Verify signature
    if (!this.webhookService.verifySignature(payload, signature, 'pim')) {
      this.logger.warn('Invalid PIM webhook signature', 'Webhook');
      throw new UnauthorizedException('Invalid signature');
    }

    try {
      await this.webhookService.processPIMWebhook(payload);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Failed to process PIM webhook', error.stack, 'Webhook');
      throw new BadRequestException('Failed to process webhook');
    }
  }

  @Post('1c')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from 1C system' })
  @ApiHeader({ name: 'X-1C-Signature', description: 'Webhook signature for verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleOneCWebhook(
    @Body() payload: WebhookEventDto,
    @Headers('x-1c-signature') signature: string,
  ) {
    this.logger.log(`Received 1C webhook: ${payload.eventType}`, 'Webhook');

    // Verify signature
    if (!this.webhookService.verifySignature(payload, signature, '1c')) {
      this.logger.warn('Invalid 1C webhook signature', 'Webhook');
      throw new UnauthorizedException('Invalid signature');
    }

    try {
      await this.webhookService.processOneCWebhook(payload);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Failed to process 1C webhook', error.stack, 'Webhook');
      throw new BadRequestException('Failed to process webhook');
    }
  }

  @Post('generic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive generic webhook from any system' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleGenericWebhook(@Body() payload: any) {
    this.logger.log(`Received generic webhook`, 'Webhook');

    try {
      await this.webhookService.processGenericWebhook(payload);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Failed to process generic webhook', error.stack, 'Webhook');
      throw new BadRequestException('Failed to process webhook');
    }
  }
}
