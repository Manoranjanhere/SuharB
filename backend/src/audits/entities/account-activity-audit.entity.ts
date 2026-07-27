import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('account_activity_audits')
export class AccountActivityAudit {
  /** S. No */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @CreateDateColumn({ name: 'actTimeStamp' })
  actTimeStamp: Date;

  /** Account being created/deleted */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  forUser: string | null;

  /** Actor (self or admin) */
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
