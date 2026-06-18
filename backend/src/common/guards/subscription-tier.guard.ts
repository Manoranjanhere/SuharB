import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { canInteractWithMember, getMemberTierLabel, getPlanBadge } from '../../subscriptions/subscription.constants';

/**
 * Guards messaging endpoints.
 * Expects `recipientId` in request params or body.
 * Enforces: sender may message same tier or lower only (sender.tier >= recipient.tier).
 */
@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const freeMode =
      process.env.DISABLE_PAID_FEATURES === 'true' ||
      process.env.NODE_ENV === 'development';
    if (freeMode) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const sender: User = req.user;

    const recipientId = req.params?.recipientId || req.body?.recipientId;
    if (!recipientId) return true;

    if (sender.subscriptionTier === 0) {
      throw new ForbiddenException('Subscribe to a plan to send messages');
    }

    // Check subscription not expired
    if (sender.subscriptionExpiresAt && new Date(sender.subscriptionExpiresAt) < new Date()) {
      throw new ForbiddenException('Your subscription has expired. Please renew to message');
    }

    const recipient = await this.userRepository.findOne({ where: { id: recipientId } });
    if (!recipient) throw new BadRequestException('Recipient not found');

    if (!canInteractWithMember(sender.subscriptionTier, recipient.subscriptionTier ?? 0)) {
      const senderBadge = getPlanBadge(sender.subscriptionPlan);
      const recipientBadge = getMemberTierLabel(recipient.subscriptionPlan, recipient.subscriptionTier ?? 0);
      throw new ForbiddenException(
        `Your ${senderBadge} plan cannot message ${recipientBadge}. Upgrade to continue.`,
      );
    }

    return true;
  }
}
