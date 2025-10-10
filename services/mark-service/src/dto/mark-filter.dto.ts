import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * DTO for filtering and paginating marks
 */
export class MarkFilterDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by mark status',
    enum: MarkStatus,
    example: MarkStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MarkStatus)
  status?: MarkStatus;

  @ApiPropertyOptional({
    description: 'Filter by GTIN',
    example: '04607177964089',
  })
  @IsOptional()
  @IsString()
  gtin?: string;

  @ApiPropertyOptional({
    description: 'Filter by supplier ID',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filter by manufacturer ID',
    example: 67890,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  manufacturerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by order ID',
    example: 'ORD-2025-001234',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (from)',
    example: '2025-10-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (to)',
    example: '2025-10-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by expiry date (from)',
    example: '2025-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  expiryFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by expiry date (to)',
    example: '2026-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiryTo?: string;

  @ApiPropertyOptional({
    description: 'Search by mark code (partial match)',
    example: '99LAV046071779',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'expiryDate', 'markCode', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * DTO for getting expiring marks
 */
export class ExpiringMarksDto {
  @ApiPropertyOptional({
    description: 'Number of days before expiry',
    example: 30,
    minimum: 1,
    maximum: 365,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  daysBeforeExpiry?: number = 30;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

