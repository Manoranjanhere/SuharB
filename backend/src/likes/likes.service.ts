import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { User } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { ComplimentDto, PaginationDto, SuperLikeDto } from './dto/likes.dto';
import { DevicesService } from '../devices/devices.service';
import { CoinsService } from '../coins/coins.service';
import { MessagesService } from '../messages/messages.service';
import { CoinTxType } from '../coins/entities/coin-transaction.entity';
import { getDailyQuotasForTier, canInteractWithMember, getMemberTierLabel, getPlanBadge, COIN_ACTION_COST } from '../subscriptions/subscription.constants';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
    private readonly devicesService: DevicesService,
    private readonly coinsService: CoinsService,
    private readonly messagesService: MessagesService,
  ) {}

  private isPaidDisabled(): boolean {
    return (
      process.env.DISABLE_PAID_FEATURES === 'true' ||
      process.env.NODE_ENV === 'development'
    );
  }

  private ensureSubscribed(sender: User): void {
    if (this.isPaidDisabled()) return;
    if (sender.subscriptionTier === 0) {
      throw new ForbiddenException('Subscribe to a plan to like profiles');
    }
    if (
      sender.subscriptionExpiresAt &&
      new Date(sender.subscriptionExpiresAt) < new Date()
    ) {
      throw new ForbiddenException(
        'Your subscription has expired. Renew to like profiles',
      );
    }
  }

  private ensureCanInteract(sender: User, target: User): void {
    this.ensureSubscribed(sender);
    if (this.isPaidDisabled()) return;
    if (!canInteractWithMember(sender.subscriptionTier, target.subscriptionTier ?? 0)) {
      const senderBadge = getPlanBadge(sender.subscriptionPlan);
      const recipientBadge = getMemberTierLabel(target.subscriptionPlan, target.subscriptionTier ?? 0);
      throw new ForbiddenException(
        `Your ${senderBadge} plan cannot like or message ${recipientBadge}. Upgrade to continue.`,
      );
    }
  }

  private async ensureTarget(fromUserId: string, toUserId: string): Promise<User> {
    if (fromUserId === toUserId) {
      throw new ConflictException('Cannot like yourself');
    }
    const target = await this.userRepository.findOne({ where: { id: toUserId } });
    if (!target) throw new NotFoundException('User not found');
    return target;
  }

  private withCacheBuster(url: string, version: string): string {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${version}`;
  }

  private async notifyLikeOrMatch(fromUserId: string, toUserId: string, senderName: string, targetName: string) {
    const mutualLike = await this.likeRepository.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    if (mutualLike) {
      await Promise.all([
        this.devicesService.sendPushToUser(toUserId, {
          title: "🎉 It's a Match!",
          body: `You and ${senderName} liked each other!`,
          data: { type: 'match', userId: fromUserId },
        }),
        this.devicesService.sendPushToUser(fromUserId, {
          title: "🎉 It's a Match!",
          body: `You matched with ${targetName}!`,
          data: { type: 'match', userId: toUserId },
        }),
      ]);
    } else {
      await this.devicesService.sendPushToUser(toUserId, {
        title: '❤️ Someone liked you!',
        body: `${senderName} liked your profile`,
        data: { type: 'like', userId: fromUserId },
      });
    }

    return { isMatch: !!mutualLike };
  }

  async likeUser(fromUserId: string, toUserId: string): Promise<{ liked: boolean; isMatch: boolean }> {
    const sender = await this.userRepository.findOne({ where: { id: fromUserId } });
    if (!sender) throw new NotFoundException('User not found');

    const target = await this.ensureTarget(fromUserId, toUserId);

    const existing = await this.likeRepository.findOne({
      where: { fromUserId, toUserId },
    });
    if (existing) {
      await this.likeRepository.remove(existing);
      return { liked: false, isMatch: false };
    }

    this.ensureCanInteract(sender, target);

    await this.likeRepository.save(
      this.likeRepository.create({
        fromUserId,
        toUserId,
        isSuperLike: false,
        complimentMessage: null,
      }),
    );

    const notify = await this.notifyLikeOrMatch(
      fromUserId,
      toUserId,
      sender.name || 'Someone',
      target.name || 'member',
    );
    return { liked: true, isMatch: notify.isMatch };
  }

  async superLikeUser(fromUserId: string, toUserId: string, dto: SuperLikeDto): Promise<{ liked: boolean; isMatch: boolean }> {
    const target = await this.ensureTarget(fromUserId, toUserId);
    let sender = await this.userRepository.findOne({ where: { id: fromUserId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }
    this.ensureCanInteract(sender, target);

    if (!this.isPaidDisabled()) {
      sender = await this.coinsService.checkAndResetDailyQuotas(fromUserId);
      const superLikeQuota = getDailyQuotasForTier(sender.subscriptionTier ?? 0).superLikes;

      if ((sender.dailySuperLikeCount || 0) < superLikeQuota) {
        await this.userRepository.update(fromUserId, {
          dailySuperLikeCount: (sender.dailySuperLikeCount || 0) + 1,
        });
      } else {
        await this.coinsService.deductCoins(
          fromUserId,
          COIN_ACTION_COST,
          CoinTxType.SPENT_SUPER_LIKE,
          `Super like sent to ${target.name || 'member'}`,
        );
      }
    }

    const complimentMessage = dto.message?.trim() || null;
    const existing = await this.likeRepository.findOne({ where: { fromUserId, toUserId } });
    if (existing) {
      existing.isSuperLike = true;
      if (complimentMessage) {
        existing.complimentMessage = complimentMessage;
      }
      await this.likeRepository.save(existing);
    } else {
      await this.likeRepository.save(
        this.likeRepository.create({
          fromUserId,
          toUserId,
          isSuperLike: true,
          complimentMessage,
        }),
      );
    }

    const notify = await this.notifyLikeOrMatch(
      fromUserId,
      toUserId,
      sender.name || 'Someone',
      target.name || 'member',
    );

    await this.devicesService.sendPushToUser(toUserId, {
      title: '⭐ Super Like!',
      body: complimentMessage || `${sender.name || 'Someone'} sent you a super like`,
      data: { type: 'super_like', userId: fromUserId },
    });

    return { liked: true, isMatch: notify.isMatch };
  }

  async sendCompliment(
    fromUserId: string,
    toUserId: string,
    dto: ComplimentDto,
  ): Promise<{ sent: boolean; messageId: string }> {
    const target = await this.ensureTarget(fromUserId, toUserId);
    const message = dto.message?.trim();
    if (!message) {
      throw new BadRequestException('Compliment message is required');
    }

    const sender = await this.userRepository.findOne({ where: { id: fromUserId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }
    this.ensureCanInteract(sender, target);

    let billedSender = sender;
    if (!this.isPaidDisabled()) {
      billedSender = await this.coinsService.checkAndResetDailyQuotas(fromUserId);
      const complimentQuota = getDailyQuotasForTier(billedSender.subscriptionTier ?? 0).compliments;

      if ((billedSender.dailyComplimentCount || 0) < complimentQuota) {
        await this.userRepository.update(fromUserId, {
          dailyComplimentCount: (billedSender.dailyComplimentCount || 0) + 1,
        });
      } else {
        await this.coinsService.deductCoins(
          fromUserId,
          COIN_ACTION_COST,
          CoinTxType.SPENT_COMPLIMENT,
          `Compliment sent to ${target.name || 'member'}`,
        );
      }
    }

    const saved = await this.messagesService.deliverCompliment(fromUserId, toUserId, message);

    return { sent: true, messageId: saved.id };
  }

  async getYouLiked(userId: string, dto: PaginationDto) {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { fromUserId: userId },
      relations: ['toUser'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const users = await Promise.all(
      likes.map(async (like) => {
        const photos = await this.photoRepository.find({
          where: { userId: like.toUserId },
          order: { order: 'ASC' },
          take: 1,
        });
        return {
          ...like.toUser,
          primaryPhoto: photos[0] ? this.withCacheBuster(photos[0].url, photos[0].id) : null,
          likedAt: like.createdAt,
          isSuperLike: like.isSuperLike,
          complimentMessage: like.complimentMessage || null,
        };
      }),
    );

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getLikedBy(userId: string, dto: PaginationDto) {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { toUserId: userId },
      relations: ['fromUser'],
      order: { isSuperLike: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const users = await Promise.all(
      likes.map(async (like) => {
        const photos = await this.photoRepository.find({
          where: { userId: like.fromUserId },
          order: { order: 'ASC' },
          take: 1,
        });
        return {
          ...like.fromUser,
          primaryPhoto: photos[0] ? this.withCacheBuster(photos[0].url, photos[0].id) : null,
          likedAt: like.createdAt,
          isSuperLike: like.isSuperLike,
          complimentMessage: like.complimentMessage || null,
        };
      }),
    );

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getMatches(userId: string, dto: PaginationDto) {
    const { page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const rows = await this.likeRepository.query(
      `
      SELECT
        l1."toUserId" AS "userId",
        GREATEST(l1."createdAt", l2."createdAt") AS "matchedAt"
      FROM likes l1
      INNER JOIN likes l2
        ON l1."fromUserId" = l2."toUserId"
       AND l1."toUserId" = l2."fromUserId"
      WHERE l1."fromUserId" = $1
      ORDER BY "matchedAt" DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, skip],
    );

    const countResult = await this.likeRepository.query(
      `
      SELECT COUNT(*)::int AS total
      FROM likes l1
      INNER JOIN likes l2
        ON l1."fromUserId" = l2."toUserId"
       AND l1."toUserId" = l2."fromUserId"
      WHERE l1."fromUserId" = $1
      `,
      [userId],
    );

    const users = await Promise.all(
      rows.map(async (row: any) => {
        const matchUser = await this.userRepository.findOne({ where: { id: row.userId } });
        const photos = await this.photoRepository.find({
          where: { userId: row.userId },
          order: { order: 'ASC' },
          take: 1,
        });
        return {
          ...matchUser,
          primaryPhoto: photos[0] ? this.withCacheBuster(photos[0].url, photos[0].id) : null,
          matchedAt: row.matchedAt,
        };
      }),
    );

    const total = parseInt(countResult[0]?.total || '0', 10);
    return { users: users.filter(Boolean), total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getFullProfile(viewerId: string, targetUserId: string) {
    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');

    const photos = await this.photoRepository.find({
      where: { userId: targetUserId },
      order: { order: 'ASC' },
    });
    const photosWithCache = photos.map((photo) => ({
      ...photo,
      url: this.withCacheBuster(photo.url, photo.id),
    }));

    const like = await this.likeRepository.findOne({
      where: { fromUserId: viewerId, toUserId: targetUserId },
    });

    const { googleId, facebookId, appleId, stripeCustomerId, ...safeUser } = user as any;

    return {
      ...safeUser,
      photos: photosWithCache,
      hasLiked: !!like,
      isSuperLike: !!like?.isSuperLike,
      complimentMessage: like?.complimentMessage || null,
    };
  }
}
