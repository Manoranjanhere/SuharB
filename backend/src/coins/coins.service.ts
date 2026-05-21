import {
  Injectable, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CoinTransaction, CoinTxType } from './entities/coin-transaction.entity';
import {
  DAILY_LOGIN_COINS,
  REFERRAL_REWARD_COINS,
} from '../subscriptions/subscription.constants';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CoinTransaction)
    private readonly txRepository: Repository<CoinTransaction>,
  ) {}

  // ─── Daily login reward ───────────────────────────────────────────────────

  async claimDailyReward(userId: string): Promise<{ awarded: boolean; coins: number; balance: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const today = new Date().toISOString().split('T')[0];
    const lastReward = user.lastDailyRewardAt
      ? new Date(user.lastDailyRewardAt).toISOString().split('T')[0]
      : null;

    if (lastReward === today) {
      return { awarded: false, coins: 0, balance: user.coins };
    }

    const newBalance = (user.coins || 0) + DAILY_LOGIN_COINS;
    await this.userRepository.update(userId, {
      coins: newBalance,
      lastDailyRewardAt: new Date(),
    });

    await this.txRepository.save(this.txRepository.create({
      userId,
      type: CoinTxType.EARNED_DAILY,
      amount: DAILY_LOGIN_COINS,
      balanceAfter: newBalance,
      description: 'Daily login reward',
    }));

    return { awarded: true, coins: DAILY_LOGIN_COINS, balance: newBalance };
  }

  // ─── Check & reset daily quotas ───────────────────────────────────────────

  async checkAndResetDailyQuotas(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const today = new Date().toISOString().split('T')[0];

    const updates: Partial<User> = {};

    const msgReset = user.dailyMsgResetAt
      ? new Date(user.dailyMsgResetAt).toISOString().split('T')[0]
      : null;
    if (msgReset !== today) {
      updates.dailyMsgCount = 0;
      updates.dailyMsgResetAt = new Date();
    }

    const slReset = user.dailySuperLikeResetAt
      ? new Date(user.dailySuperLikeResetAt).toISOString().split('T')[0]
      : null;
    if (slReset !== today) {
      updates.dailySuperLikeCount = 0;
      updates.dailySuperLikeResetAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepository.update(userId, updates);
      return { ...user, ...updates };
    }
    return user;
  }

  // ─── Referral reward ──────────────────────────────────────────────────────

  async processReferral(newUserId: string, referralCode: string): Promise<void> {
    const referrer = await this.userRepository.findOne({
      where: { referralCode },
    });
    if (!referrer || referrer.id === newUserId) return;

    const newBalance = (referrer.coins || 0) + REFERRAL_REWARD_COINS;
    await this.userRepository.update(referrer.id, { coins: newBalance });

    await this.txRepository.save(this.txRepository.create({
      userId: referrer.id,
      type: CoinTxType.EARNED_REFERRAL,
      amount: REFERRAL_REWARD_COINS,
      balanceAfter: newBalance,
      description: `Referral reward — new member joined`,
      referenceId: newUserId,
    }));
  }

  // ─── Get balance & transactions ───────────────────────────────────────────

  async getBalance(userId: string): Promise<{ coins: number; transactions: CoinTransaction[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const transactions = await this.txRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    return { coins: user.coins || 0, transactions };
  }

  // ─── Deduct coins for feature use ─────────────────────────────────────────

  async deductCoins(userId: string, amount: number, type: CoinTxType, description: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if ((user.coins || 0) < amount) {
      throw new BadRequestException('Insufficient coins');
    }
    const newBalance = user.coins - amount;
    await this.userRepository.update(userId, { coins: newBalance });
    await this.txRepository.save(this.txRepository.create({
      userId,
      type,
      amount: -amount,
      balanceAfter: newBalance,
      description,
    }));
    return newBalance;
  }
}
