import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('report_activity_audits')
export class ReportActivityAudit {
  /** S. No */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @CreateDateColumn({ name: 'actTimeStamp' })
  actTimeStamp: Date;

  /** Reported user */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  forUser: string | null;

  /** Reporter */
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

  /** Deep/admin URL to open the reported profile quickly */
  @Column({ type: 'text', nullable: true })
  adminLink: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  reportId: string | null;

  @Column({ type: 'uuid', nullable: true })
  reportedPhotoId: string | null;
}
