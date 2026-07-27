import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('payment_activity_audits')
export class PaymentActivityAudit {
  /** S. No */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @CreateDateColumn({ name: 'actTimeStamp' })
  actTimeStamp: Date;

  /** Purchasing user */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  forUser: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  byUser: string | null;

  @Column({ type: 'varchar', length: 64 })
  activityName: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  affectedDataName: string | null;

  @Column({ type: 'text', nullable: true })
  fromValue: string | null;

  @Column({ type: 'text', nullable: true })
  toValue: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
