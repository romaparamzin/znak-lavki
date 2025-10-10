import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { MarkService } from '../services/mark.service';
import {
  GenerateMarkDto,
  BlockMarkDto,
  UnblockMarkDto,
  BulkBlockDto,
  BulkUnblockDto,
  ValidateMarkDto,
  MarkFilterDto,
  ExpiringMarksDto,
} from '../dto';
import {
  MarkResponseDto,
  GenerateMarkResponseDto,
  PaginatedMarkResponseDto,
  ValidateMarkResponseDto,
  BulkOperationResponseDto,
} from '../dto/mark-response.dto';
import { MetricsInterceptor } from '../interceptors/metrics.interceptor';

/**
 * Mark Controller
 * Handles all quality mark REST API endpoints
 */
@ApiTags('Quality Marks')
@Controller('marks')
@UseGuards(ThrottlerGuard)
@UseInterceptors(MetricsInterceptor)
@ApiBearerAuth()
export class MarkController {
  private readonly logger = new Logger(MarkController.name);

  constructor(private readonly markService: MarkService) {}

  /**
   * Generate new quality marks
   * Rate limit: 10 requests per minute
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Generate new quality marks',
    description:
      'Generate unique quality marks with optional QR code generation. Supports batch generation up to 10,000 marks.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Marks generated successfully',
    type: GenerateMarkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async generateMarks(
    @Body() dto: GenerateMarkDto,
    @Req() req: Request,
  ): Promise<GenerateMarkResponseDto> {
    const userId = this.extractUserId(req);
    this.logger.log(`Generate marks request from user: ${userId}`);
    return await this.markService.generateMarks(dto, userId);
  }

  /**
   * Get mark by ID
   * Rate limit: 100 requests per minute
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'Get mark by ID',
    description: 'Retrieve detailed information about a specific quality mark by its UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mark UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark found',
    type: MarkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mark not found',
  })
  async getMarkById(@Param('id') id: string): Promise<MarkResponseDto> {
    return await this.markService.getMarkById(id);
  }

  /**
   * Get mark by mark code
   * Rate limit: 100 requests per minute
   */
  @Get('code/:markCode')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get mark by mark code',
    description: 'Retrieve mark information using the unique mark code. Results are cached.',
  })
  @ApiParam({
    name: 'markCode',
    description: 'Unique mark code',
    example: '99LAV0460717796408966LAV1234567890ABCDEF',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark found',
    type: MarkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mark not found',
  })
  async getMarkByCode(@Param('markCode') markCode: string): Promise<MarkResponseDto> {
    return await this.markService.getMarkByCode(markCode);
  }

  /**
   * List marks with filters and pagination
   * Rate limit: 50 requests per minute
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({
    summary: 'List marks with filters',
    description:
      'Get paginated list of marks with optional filters for status, GTIN, dates, etc.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marks retrieved successfully',
    type: PaginatedMarkResponseDto,
  })
  async getMarks(@Query() filterDto: MarkFilterDto): Promise<PaginatedMarkResponseDto> {
    return await this.markService.getMarks(filterDto);
  }

  /**
   * Block a mark
   * Rate limit: 20 requests per minute
   */
  @Put(':markCode/block')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Block a mark',
    description:
      'Block a quality mark to prevent its use. Requires a reason for auditing purposes.',
  })
  @ApiParam({
    name: 'markCode',
    description: 'Mark code to block',
    example: '99LAV0460717796408966LAV1234567890ABCDEF',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark blocked successfully',
    type: MarkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mark not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mark is already blocked',
  })
  async blockMark(
    @Param('markCode') markCode: string,
    @Body() dto: BlockMarkDto,
    @Req() req: Request,
  ): Promise<MarkResponseDto> {
    const userId = this.extractUserId(req);
    const ipAddress = this.extractIpAddress(req);
    this.logger.log(`Block mark request from user: ${userId} for mark: ${markCode}`);
    return await this.markService.blockMark(markCode, dto, userId, ipAddress);
  }

  /**
   * Unblock a mark
   * Rate limit: 20 requests per minute
   */
  @Put(':markCode/unblock')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Unblock a mark',
    description: 'Remove the block from a quality mark, allowing it to be used again.',
  })
  @ApiParam({
    name: 'markCode',
    description: 'Mark code to unblock',
    example: '99LAV0460717796408966LAV1234567890ABCDEF',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark unblocked successfully',
    type: MarkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mark not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mark is not blocked',
  })
  async unblockMark(
    @Param('markCode') markCode: string,
    @Body() dto: UnblockMarkDto,
    @Req() req: Request,
  ): Promise<MarkResponseDto> {
    const userId = this.extractUserId(req);
    const ipAddress = this.extractIpAddress(req);
    this.logger.log(`Unblock mark request from user: ${userId} for mark: ${markCode}`);
    return await this.markService.unblockMark(markCode, dto, userId, ipAddress);
  }

  /**
   * Bulk block marks
   * Rate limit: 5 requests per minute
   */
  @Post('bulk-block')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Bulk block marks',
    description:
      'Block multiple marks at once (up to 1000). Useful for batch recalls or quality issues.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk block operation completed',
    type: BulkOperationResponseDto,
  })
  async bulkBlockMarks(
    @Body() dto: BulkBlockDto,
    @Req() req: Request,
  ): Promise<BulkOperationResponseDto> {
    const userId = this.extractUserId(req);
    const ipAddress = this.extractIpAddress(req);
    this.logger.log(
      `Bulk block request from user: ${userId} for ${dto.markCodes.length} marks`,
    );
    return await this.markService.bulkBlockMarks(dto, userId, ipAddress);
  }

  /**
   * Bulk unblock marks
   * Rate limit: 5 requests per minute
   */
  @Post('bulk-unblock')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Bulk unblock marks',
    description: 'Unblock multiple marks at once (up to 1000).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk unblock operation completed',
    type: BulkOperationResponseDto,
  })
  async bulkUnblockMarks(
    @Body() dto: BulkUnblockDto,
    @Req() req: Request,
  ): Promise<BulkOperationResponseDto> {
    const userId = this.extractUserId(req);
    const ipAddress = this.extractIpAddress(req);
    this.logger.log(
      `Bulk unblock request from user: ${userId} for ${dto.markCodes.length} marks`,
    );
    return await this.markService.bulkUnblockMarks(dto, userId, ipAddress);
  }

  /**
   * Get expiring marks
   * Rate limit: 30 requests per minute
   */
  @Get('expiring/list')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get expiring marks',
    description:
      'Retrieve marks that will expire within a specified number of days (default 30 days).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring marks retrieved successfully',
    type: PaginatedMarkResponseDto,
  })
  async getExpiringMarks(
    @Query() dto: ExpiringMarksDto,
  ): Promise<PaginatedMarkResponseDto> {
    return await this.markService.getExpiringMarks(dto);
  }

  /**
   * Validate mark for WMS
   * Rate limit: 200 requests per minute (high traffic endpoint)
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Validate mark',
    description:
      'Validate a mark for WMS operations. Checks if mark is active, not blocked, and not expired. Results are cached.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed',
    type: ValidateMarkResponseDto,
  })
  async validateMark(
    @Body() dto: ValidateMarkDto,
    @Req() req: Request,
  ): Promise<ValidateMarkResponseDto> {
    const userId = this.extractUserId(req);
    const ipAddress = this.extractIpAddress(req);
    return await this.markService.validateMark(dto, userId, ipAddress);
  }

  /**
   * Extract user ID from request
   * In production, this would extract from JWT token or session
   */
  private extractUserId(req: Request): string | undefined {
    // Placeholder - in production, extract from JWT/session
    return req.headers['x-user-id'] as string || undefined;
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

