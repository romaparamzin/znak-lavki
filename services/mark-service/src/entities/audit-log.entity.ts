import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Action types for audit logging
 */
export enum AuditAction {
  MARK_GENERATED = 'mark_generated',
  MARK_BLOCKED = 'mark_blocked',
  MARK_UNBLOCKED = 'mark_unblocked',
  MARK_VALIDATED = 'mark_validated',
  MARK_EXPIRED = 'mark_expired',
  MARK_USED = 'mark_used',
  BULK_BLOCK = 'bulk_block',
  BULK_UNBLOCK = 'bulk_unblock',
}

/**
 * AuditLog Entity
 * Tracks all operations performed on quality marks
 */
@Entity('audit_logs')
@Index(['markCode']) // Index for mark lookup
@Index(['action']) // Index for action filtering
@Index(['userId']) // Index for user activity tracking
@Index(['createdAt']) // Index for temporal queries
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Mark code associated with this action
   */
  @Column({ length: 50, nullable: true })
  markCode: string;

  /**
   * Action performed
   */
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  /**
   * User ID who performed the action
   */
  @Column({ length: 100, nullable: true })
  userId: string;

  /**
   * IP address of the request
   */
  @Column({ length: 45, nullable: true })
  ipAddress: string;

  /**
   * User agent of the request
   */
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  /**
   * Previous state (for update operations)
   */
  @Column({ type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  /**
   * New state (for update operations)
   */
  @Column({ type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  /**
   * Additional metadata about the action
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * Reason for the action (e.g., block reason)
   */
  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}

