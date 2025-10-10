import {
  IsArray,
  IsString,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for bulk blocking marks
 */
export class BulkBlockDto {
  @ApiProperty({
    description: 'Array of mark codes to block',
    example: ['99LAV04607177964089...', '99LAV04607177964089...'],
    minItems: 1,
    maxItems: 1000,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one mark code is required' })
  @ArrayMaxSize(1000, { message: 'Cannot block more than 1000 marks at once' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  markCodes: string[];

  @ApiProperty({
    description: 'Reason for blocking the marks',
    example: 'Batch recall due to safety concerns',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'User ID performing the bulk block action',
    example: 'admin-456',
  })
  @IsOptional()
  @IsString()
  blockedBy?: string;
}

/**
 * DTO for bulk unblocking marks
 */
export class BulkUnblockDto {
  @ApiProperty({
    description: 'Array of mark codes to unblock',
    example: ['99LAV04607177964089...', '99LAV04607177964089...'],
    minItems: 1,
    maxItems: 1000,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one mark code is required' })
  @ArrayMaxSize(1000, { message: 'Cannot unblock more than 1000 marks at once' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  markCodes: string[];

  @ApiPropertyOptional({
    description: 'Reason for unblocking the marks',
    example: 'Issue resolved after investigation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'User ID performing the bulk unblock action',
    example: 'admin-456',
  })
  @IsOptional()
  @IsString()
  unblockedBy?: string;
}

