import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for blocking a single mark
 */
export class BlockMarkDto {
  @ApiProperty({
    description: 'Reason for blocking the mark',
    example: 'Product recall due to quality issues',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description: 'User ID performing the block action',
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  blockedBy?: string;
}

/**
 * DTO for unblocking a mark
 */
export class UnblockMarkDto {
  @ApiPropertyOptional({
    description: 'Reason for unblocking the mark',
    example: 'Issue resolved after quality check',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'User ID performing the unblock action',
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  unblockedBy?: string;
}

