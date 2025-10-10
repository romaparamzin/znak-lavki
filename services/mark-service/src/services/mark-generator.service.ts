import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityMark } from '../entities/quality-mark.entity';
import * as crypto from 'crypto';

/**
 * Mark Generator Service
 * Handles the generation of unique mark codes with collision detection
 * Format: 99LAV{GTIN}66LAV{16-chars}
 */
@Injectable()
export class MarkGeneratorService {
  private readonly logger = new Logger(MarkGeneratorService.name);

  // Character set for random string generation (alphanumeric)
  private readonly CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private readonly RANDOM_LENGTH = 16;
  private readonly PREFIX = '99LAV';
  private readonly SEPARATOR = '66LAV';

  // Maximum retry attempts for collision resolution
  private readonly MAX_RETRY_ATTEMPTS = 5;

  constructor(
    @InjectRepository(QualityMark)
    private readonly markRepository: Repository<QualityMark>,
  ) {}

  /**
   * Generate a single unique mark code
   * @param gtin - Product GTIN
   * @returns Promise<string> - Generated mark code
   */
  async generateMarkCode(gtin: string): Promise<string> {
    let attempts = 0;

    while (attempts < this.MAX_RETRY_ATTEMPTS) {
      const randomPart = this.generateRandomString(this.RANDOM_LENGTH);
      const markCode = `${this.PREFIX}${gtin}${this.SEPARATOR}${randomPart}`;

      // Check for collision
      const exists = await this.markRepository.findOne({
        where: { markCode },
      });

      if (!exists) {
        this.logger.debug(`Generated unique mark code: ${markCode}`);
        return markCode;
      }

      attempts++;
      this.logger.warn(
        `Mark code collision detected (attempt ${attempts}/${this.MAX_RETRY_ATTEMPTS}): ${markCode}`,
      );
    }

    throw new Error(
      `Failed to generate unique mark code after ${this.MAX_RETRY_ATTEMPTS} attempts`,
    );
  }

  /**
   * Generate multiple unique mark codes in batch
   * Uses optimized collision checking with SET operations
   * @param gtin - Product GTIN
   * @param quantity - Number of codes to generate
   * @returns Promise<string[]> - Array of generated mark codes
   */
  async generateMarkCodesBatch(
    gtin: string,
    quantity: number,
  ): Promise<string[]> {
    const startTime = Date.now();
    this.logger.log(`Starting batch generation of ${quantity} marks for GTIN: ${gtin}`);

    const generatedCodes = new Set<string>();
    let attempts = 0;
    const maxTotalAttempts = quantity * 10; // Safety limit

    // Pre-generate candidates with high probability of uniqueness
    while (generatedCodes.size < quantity && attempts < maxTotalAttempts) {
      const randomPart = this.generateRandomString(this.RANDOM_LENGTH);
      const markCode = `${this.PREFIX}${gtin}${this.SEPARATOR}${randomPart}`;
      
      generatedCodes.add(markCode);
      attempts++;
    }

    if (generatedCodes.size < quantity) {
      throw new Error(
        `Failed to generate ${quantity} unique codes (only generated ${generatedCodes.size})`,
      );
    }

    // Convert Set to Array for batch collision check
    const candidates = Array.from(generatedCodes);

    // Batch collision check (much more efficient than individual queries)
    const existingMarks = await this.markRepository.find({
      where: candidates.map((markCode) => ({ markCode })),
      select: ['markCode'],
    });

    const existingCodes = new Set(existingMarks.map((m) => m.markCode));

    // Filter out collisions and regenerate if needed
    let uniqueCodes = candidates.filter((code) => !existingCodes.has(code));

    // If we have collisions, regenerate the missing ones
    while (uniqueCodes.length < quantity) {
      const needed = quantity - uniqueCodes.length;
      this.logger.warn(
        `Collision detected in batch. Regenerating ${needed} codes...`,
      );

      const additionalCodes = await this.generateMarkCodesBatch(gtin, needed);
      uniqueCodes.push(...additionalCodes);
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `Batch generation completed: ${uniqueCodes.length} marks in ${elapsed}ms`,
    );

    return uniqueCodes.slice(0, quantity);
  }

  /**
   * Generate cryptographically secure random string
   * @param length - Length of the random string
   * @returns string - Random string using defined CHARSET
   */
  private generateRandomString(length: number): string {
    const randomBytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % this.CHARSET.length;
      result += this.CHARSET[randomIndex];
    }

    return result;
  }

  /**
   * Validate mark code format
   * @param markCode - Mark code to validate
   * @returns boolean - True if format is valid
   */
  validateMarkCodeFormat(markCode: string): boolean {
    // Format: 99LAV{GTIN}66LAV{16-chars}
    const pattern = new RegExp(
      `^${this.PREFIX}\\d{8,14}${this.SEPARATOR}[${this.CHARSET}]{${this.RANDOM_LENGTH}}$`,
    );
    return pattern.test(markCode);
  }

  /**
   * Extract GTIN from mark code
   * @param markCode - Mark code
   * @returns string | null - Extracted GTIN or null if invalid
   */
  extractGtin(markCode: string): string | null {
    if (!this.validateMarkCodeFormat(markCode)) {
      return null;
    }

    const startIndex = this.PREFIX.length;
    const endIndex = markCode.indexOf(this.SEPARATOR);

    return markCode.substring(startIndex, endIndex);
  }
}

