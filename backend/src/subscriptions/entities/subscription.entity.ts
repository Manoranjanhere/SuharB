import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  planId: string;           // silver | gold | platinum | rich | very_rich | super_rich

  @Column({ type: 'int' })
  tier: number;

  @Column({ type: 'int' })
  amountPaid: number;       // INR paise × 100

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeSessionId: string;

  /** monthly | quarterly */
  @Column({ type: 'varchar', length: 16, default: 'quarterly' })
  billingPeriod: string;

  @Column({ nullable: true })
  googlePlayProductId: string;

  @Column({ nullable: true, unique: true })
  googlePlayPurchaseToken: string;

  @Column({ nullable: true })
  googlePlayOrderId: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
