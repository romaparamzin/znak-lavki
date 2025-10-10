import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for validating a mark
 */
export class ValidateMarkDto {
  @ApiProperty({
    description: 'Mark code to validate',
    example: '99LAV0460717796408966LAV1234567890ABCDEF',
  })
  @IsString()
  @IsNotEmpty()
  markCode: string;

  @ApiPropertyOptional({
    description: 'Location where validation is performed',
    example: 'Warehouse-A',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'User ID performing the validation',
    example: 'scanner-user-123',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

