import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ValidateMarkDto {
  @ApiProperty({ description: 'Mark code to validate' })
  @IsString()
  @IsNotEmpty()
  markCode: string;
}

export class BlockItemDto {
  @ApiProperty({ description: 'Mark code to block' })
  @IsString()
  @IsNotEmpty()
  markCode: string;

  @ApiProperty({ description: 'Reason for blocking' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GetOrderDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class NotifyExpiringItemsDto {
  @ApiProperty({ description: 'List of expiring items', type: 'array' })
  @IsArray()
  items: any[];
}

export class GetProductDto {
  @ApiProperty({ description: 'GTIN product code' })
  @IsString()
  @IsNotEmpty()
  gtin: string;
}

export class UpdateProductAttributeDto {
  @ApiProperty({ description: 'GTIN product code' })
  @IsString()
  @IsNotEmpty()
  gtin: string;

  @ApiProperty({ description: 'Product attributes to update' })
  attributes: Record<string, any>;
}

export class MarkGenerationRequestDto {
  @ApiProperty({ description: 'Request ID' })
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @ApiProperty({ description: 'Product GTIN' })
  @IsString()
  @IsNotEmpty()
  productGtin: string;

  @ApiProperty({ description: 'Quantity of marks to generate' })
  @IsNumber()
  @Min(1)
  @Max(10000)
  quantity: number;

  @ApiProperty({ description: 'Production batch ID', required: false })
  @IsOptional()
  @IsString()
  productionBatchId?: string;

  @ApiProperty({ description: 'Expiration date', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDate?: Date;

  @ApiProperty({ description: 'User who requested' })
  @IsString()
  @IsNotEmpty()
  requestedBy: string;

  @ApiProperty({ description: 'Request priority', enum: ['normal', 'high', 'urgent'] })
  @IsEnum(['normal', 'high', 'urgent'])
  priority: 'normal' | 'high' | 'urgent';
}

export class PrintRequestDto {
  @ApiProperty({ description: 'Print job ID' })
  @IsString()
  @IsNotEmpty()
  printJobId: string;

  @ApiProperty({ description: 'Marks to print', type: 'array' })
  @IsArray()
  marks: any[];

  @ApiProperty({ description: 'Printer queue name' })
  @IsString()
  @IsNotEmpty()
  printerQueue: string;

  @ApiProperty({ description: 'Print format', enum: ['datamatrix', 'qr', 'barcode'] })
  @IsEnum(['datamatrix', 'qr', 'barcode'])
  printFormat: 'datamatrix' | 'qr' | 'barcode';

  @ApiProperty({ description: 'Number of copies' })
  @IsNumber()
  @Min(1)
  @Max(100)
  copies: number;

  @ApiProperty({ description: 'Print priority' })
  @IsNumber()
  @Min(1)
  @Max(10)
  priority: number;
}

export class WebhookEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({ description: 'Event ID' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ description: 'Event source', enum: ['wms', 'pim', '1c'] })
  @IsEnum(['wms', 'pim', '1c'])
  source: 'wms' | 'pim' | '1c';

  @ApiProperty({ description: 'Event data' })
  data: any;

  @ApiProperty({ description: 'Signature for verification', required: false })
  @IsOptional()
  @IsString()
  signature?: string;
}
