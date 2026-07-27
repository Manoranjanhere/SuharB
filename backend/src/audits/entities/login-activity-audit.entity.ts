import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('login_activity_audits')
export class LoginActivityAudit {
  /** S. No */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @CreateDateColumn({ name: 'actTimeStamp' })
  actTimeStamp: Date;

  /** Subject of the login (the user who logged in) */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  forUser: string | null;

  /** Same as forUser for self-login; null for failed/anonymous if ever recorded */
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

  /** IP address and related login metadata */
  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
