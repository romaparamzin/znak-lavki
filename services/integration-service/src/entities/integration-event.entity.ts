import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('integration_events')
@Index(['status', 'eventType'])
@Index(['createdAt'])
export class IntegrationEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  eventType: string;

  @Column()
  source: string;

  @Column('jsonb')
  payload: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'dead_letter'],
    default: 'pending',
  })
  status: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
