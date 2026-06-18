import {
  Injectable, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CoinTransaction, CoinTxType } from './entities/coin-transaction.entity';
import {
  DAILY_LOGIN_COINS,
  REFERRAL_REWARD_COINS,
  REFERRAL_SIGNUP_BONUS_COINS,
  COIN_PACKS,
  parsePlayCoinProductId,
} from '../subscriptions/subscription.constants';
import { GooglePlayBillingService } from '../subscriptions/google-play-billing.service';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CoinTransaction)
    private readonly txRepository: Repository<CoinTransaction>,
    private readonly googlePlay: GooglePlayBillingService,
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

    const newBalance = await this.addCoins(
      userId,
      DAILY_LOGIN_COINS,
      CoinTxType.EARNED_DAILY,
      'Daily login reward',
    );

    await this.userRepository.update(userId, { lastDailyRewardAt: new Date() });

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

    const complimentReset = user.dailyComplimentResetAt
      ? new Date(user.dailyComplimentResetAt).toISOString().split('T')[0]
      : null;
    if (complimentReset !== today) {
      updates.dailyComplimentCount = 0;
      updates.dailyComplimentResetAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepository.update(userId, updates);
      return { ...user, ...updates };
    }
    return user;
  }

  // ─── Referral rewards ─────────────────────────────────────────────────────

  async processReferral(newUserId: string, referralCode: string): Promise<void> {
    const code = referralCode.trim().toUpperCase();
    const referrer = await this.userRepository.findOne({ where: { referralCode: code } });
    if (!referrer || referrer.id === newUserId) return;

    const alreadyRewarded = await this.txRepository.findOne({
      where: {
        userId: referrer.id,
        type: CoinTxType.EARNED_REFERRAL,
        referenceId: newUserId,
      },
    });
    if (alreadyRewarded) return;

    await this.addCoins(
      referrer.id,
      REFERRAL_REWARD_COINS,
      CoinTxType.EARNED_REFERRAL,
      'Referral reward — new member joined',
      newUserId,
    );

    await this.addCoins(
      newUserId,
      REFERRAL_SIGNUP_BONUS_COINS,
      CoinTxType.EARNED_REFERRAL,
      'Welcome bonus for using a referral code',
      referrer.id,
    );
  }

  // ─── Google Play coin purchase ────────────────────────────────────────────

  async verifyGooglePlayCoinPurchase(
    userId: string,
    productId: string,
    purchaseToken: string,
  ): Promise<{ success: boolean; coins: number; balance: number; packId: string }> {
    const packId = parsePlayCoinProductId(productId);
    if (!packId) {
      throw new BadRequestException('Unknown Google Play coin product');
    }

    const pack = COIN_PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new BadRequestException('Invalid coin pack');
    }

    const existing = await this.txRepository.findOne({
      where: { referenceId: purchaseToken, type: CoinTxType.PURCHASED },
    });
    if (existing) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      return {
        success: true,
        coins: pack.coins,
        balance: user?.coins || 0,
        packId,
      };
    }

    const verification = await this.googlePlay.verifyProduct(productId, purchaseToken);
    if (!verification.valid) {
      throw new BadRequestException('Google Play purchase is not valid');
    }

    const balance = await this.addCoins(
      userId,
      pack.coins,
      CoinTxType.PURCHASED,
      `Purchased ${pack.label} via Google Play`,
      purchaseToken,
    );

    return { success: true, coins: pack.coins, balance, packId };
  }

  getCoinPacks() {
    return COIN_PACKS.map((pack) => ({
      ...pack,
      playProductId: `sugarbf_${pack.id}`,
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
    return { coins: user?.coins || 0, transactions };
  }

  // ─── Deduct coins for feature use ─────────────────────────────────────────

  async deductCoins(userId: string, amount: number, type: CoinTxType, description: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if ((user?.coins || 0) < amount) {
      throw new BadRequestException('Insufficient coins');
    }
    const newBalance = user!.coins - amount;
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

  private async addCoins(
    userId: string,
    amount: number,
    type: CoinTxType,
    description: string,
    referenceId?: string,
  ): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const newBalance = (user.coins || 0) + amount;
    await this.userRepository.update(userId, { coins: newBalance });
    await this.txRepository.save(this.txRepository.create({
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      referenceId,
    }));
    return newBalance;
  }
}
