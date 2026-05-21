import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BanType {
  IP = 'ip',
  PHONE = 'phone',
  EMAIL = 'email',
  DEVICE_ID = 'device_id',
}

@Entity('banned_identities')
export class BannedIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: BanType })
  type: BanType;

  @Index()
  @Column()
  value: string;   // the actual IP / phone / email / device token

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  bannedByAdminId: string;

  @Column({ nullable: true })
  relatedUserId: string;   // the user this identity belongs to (if known)

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
