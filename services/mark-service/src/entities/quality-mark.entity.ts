import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * QualityMark Entity
 * Represents a unique quality mark for product tracking
 * Format: 99LAV{GTIN}66LAV{16-chars}
 */
@Entity('quality_marks')
@Index(['status', 'expiryDate']) // Composite index for expiry checking
@Index(['gtin']) // Index for product lookup
@Index(['supplierId']) // Index for supplier queries
@Index(['manufacturerId']) // Index for manufacturer queries
@Index(['orderId']) // Index for order tracking
@Index(['createdAt']) // Index for temporal queries
export class QualityMark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique mark code
   * Format: 99LAV{GTIN}66LAV{16-chars}
   */
  @Column({ unique: true, length: 50 })
  @Index()
  markCode: string;

  /**
   * Global Trade Item Number (GTIN/Barcode)
   * Used to identify the product
   */
  @Column({ length: 14 })
  gtin: string;

  /**
   * Current status of the mark
   */
  @Column({
    type: 'enum',
    enum: MarkStatus,
    default: MarkStatus.ACTIVE,
  })
  status: MarkStatus;

  /**
   * Date when the product was produced
   */
  @Column({ type: 'timestamp' })
  productionDate: Date;

  /**
   * Expiry date of the product
   */
  @Column({ type: 'timestamp' })
  expiryDate: Date;

  /**
   * ID of the supplier associated with this mark
   */
  @Column({ nullable: true, type: 'integer' })
  supplierId: number;

  /**
   * ID of the manufacturer associated with this mark
   */
  @Column({ nullable: true, type: 'integer' })
  manufacturerId: number;

  /**
   * Order ID associated with this mark
   */
  @Column({ nullable: true, length: 100 })
  orderId: string;

  /**
   * Reason why the mark was blocked (if applicable)
   */
  @Column({ nullable: true, type: 'text' })
  blockedReason: string;

  /**
   * User ID or system that blocked the mark
   */
  @Column({ nullable: true, length: 100 })
  blockedBy: string;

  /**
   * Timestamp when the mark was blocked
   */
  @Column({ nullable: true, type: 'timestamp' })
  blockedAt: Date;

  /**
   * Number of times this mark has been validated
   */
  @Column({ default: 0, type: 'integer' })
  validationCount: number;

  /**
   * Last time the mark was validated
   */
  @Column({ nullable: true, type: 'timestamp' })
  lastValidatedAt: Date;

  /**
   * Metadata for additional information (stored as JSON)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

