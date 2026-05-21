import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CoinTxType {
  EARNED_DAILY = 'earned_daily',
  EARNED_REFERRAL = 'earned_referral',
  PURCHASED = 'purchased',
  SPENT_SUPER_LIKE = 'spent_super_like',
  SPENT_MSG = 'spent_msg',
  SPENT_COMPLIMENT = 'spent_compliment',
  TOPUP_PURCHASE = 'topup_purchase',
}

@Entity('coin_transactions')
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CoinTxType })
  type: CoinTxType;

  @Column({ type: 'int' })
  amount: number;       // positive = credit, negative = debit

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  referenceId: string;  // stripe payment intent, topup package id, etc.

  @CreateDateColumn()
  createdAt: Date;
}
