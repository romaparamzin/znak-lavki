import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  Matches,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for generating quality marks
 */
export class GenerateMarkDto {
  @ApiProperty({
    description: 'Product GTIN (barcode) - 8, 12, 13, or 14 digits',
    example: '04607177964089',
    pattern: '^\\d{8}$|^\\d{12,14}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$|^\d{12,14}$/, {
    message: 'GTIN must be 8, 12, 13, or 14 digits',
  })
  gtin: string;

  @ApiProperty({
    description: 'Number of marks to generate',
    example: 100,
    minimum: 1,
    maximum: 10000,
  })
  @IsInt()
  @Min(1, { message: 'Must generate at least 1 mark' })
  @Max(10000, { message: 'Cannot generate more than 10000 marks at once' })
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Production date in ISO 8601 format',
    example: '2025-10-10T00:00:00Z',
  })
  @IsDateString()
  productionDate: string;

  @ApiProperty({
    description: 'Expiry date in ISO 8601 format',
    example: '2026-10-10T00:00:00Z',
  })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Supplier ID',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Manufacturer ID',
    example: 67890,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  manufacturerId?: number;

  @ApiPropertyOptional({
    description: 'Order ID',
    example: 'ORD-2025-001234',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Generate QR codes for the marks',
    example: true,
    default: false,
  })
  @IsOptional()
  generateQrCodes?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { batchNumber: 'BATCH-001', location: 'Warehouse A' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

