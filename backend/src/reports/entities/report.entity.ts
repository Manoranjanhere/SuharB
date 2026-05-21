import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportReason {
  FAKE_PROFILE = 'fake_profile',
  INAPPROPRIATE_PHOTO = 'inappropriate_photo',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  UNDERAGE = 'underage',
  OTHER = 'other',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  reporterId: string;

  @Index()
  @Column()
  reportedUserId: string;

  @Column({ nullable: true })
  reportedPhotoId: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: false })
  isReviewed: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
