import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * Response DTO for a single mark
 */
export class MarkResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: '99LAV0460717796408966LAV1234567890ABCDEF' })
  markCode: string;

  @ApiProperty({ example: '04607177964089' })
  gtin: string;

  @ApiProperty({ enum: MarkStatus, example: MarkStatus.ACTIVE })
  status: MarkStatus;

  @ApiProperty({ example: '2025-10-10T00:00:00Z' })
  productionDate: Date;

  @ApiProperty({ example: '2026-10-10T00:00:00Z' })
  expiryDate: Date;

  @ApiPropertyOptional({ example: 12345 })
  supplierId?: number;

  @ApiPropertyOptional({ example: 67890 })
  manufacturerId?: number;

  @ApiPropertyOptional({ example: 'ORD-2025-001234' })
  orderId?: string;

  @ApiPropertyOptional({ example: 'Product recall' })
  blockedReason?: string;

  @ApiPropertyOptional({ example: 'admin-123' })
  blockedBy?: string;

  @ApiPropertyOptional({ example: '2025-10-15T10:30:00Z' })
  blockedAt?: Date;

  @ApiProperty({ example: 5 })
  validationCount: number;

  @ApiPropertyOptional({ example: '2025-10-15T10:30:00Z' })
  lastValidatedAt?: Date;

  @ApiPropertyOptional({ example: { batchNumber: 'BATCH-001' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2025-10-10T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-10T12:00:00Z' })
  updatedAt: Date;
}

/**
 * Response DTO for mark generation
 */
export class GenerateMarkResponseDto {
  @ApiProperty({ description: 'Generated marks', type: [MarkResponseDto] })
  marks: MarkResponseDto[];

  @ApiProperty({ example: 100 })
  count: number;

  @ApiPropertyOptional({
    description: 'QR code data URLs (if generateQrCodes was true)',
    example: ['data:image/png;base64,...'],
    type: [String],
  })
  qrCodes?: string[];

  @ApiProperty({ example: 1250 })
  processingTimeMs: number;
}

/**
 * Paginated response DTO
 */
export class PaginatedMarkResponseDto {
  @ApiProperty({ description: 'Marks in current page', type: [MarkResponseDto] })
  data: MarkResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 500 })
  total: number;

  @ApiProperty({ example: 25 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

/**
 * Response DTO for mark validation
 */
export class ValidateMarkResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({ description: 'Mark details', type: MarkResponseDto, nullable: true })
  mark: MarkResponseDto | null;

  @ApiPropertyOptional({ example: 'Mark is blocked due to product recall' })
  reason?: string;

  @ApiProperty({ example: '2025-10-15T10:30:00Z' })
  validatedAt: Date;
}

/**
 * Response DTO for bulk operations
 */
export class BulkOperationResponseDto {
  @ApiProperty({ example: 50 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failureCount: number;

  @ApiProperty({
    example: ['99LAV0460717796408966LAV1234567890ABCDEF'],
    type: [String],
  })
  successfulMarkCodes: string[];

  @ApiProperty({
    example: [{ markCode: '99LAV...', reason: 'Mark not found' }],
    type: [Object],
  })
  failures: Array<{ markCode: string; reason: string }>;

  @ApiProperty({ example: 850 })
  processingTimeMs: number;
}

