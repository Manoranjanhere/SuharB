import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Block } from '../blocks/entities/block.entity';
import { SendMessageDto, MessagePaginationDto } from './dto/messages.dto';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { DevicesService } from '../devices/devices.service';
import { CoinsService } from '../coins/coins.service';
import { CoinTxType } from '../coins/entities/coin-transaction.entity';
import { DEFAULT_DAILY_MSG_QUOTA } from '../subscriptions/subscription.constants';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
    private readonly devicesService: DevicesService,
    private readonly coinsService: CoinsService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  private isPaidDisabled(): boolean {
    return (
      process.env.DISABLE_PAID_FEATURES === 'true' ||
      process.env.NODE_ENV === 'development'
    );
  }

  private withCacheBuster(url: string, version: string): string {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${version}`;
  }

  private async ensureMessagingAllowed(userId: string, recipientId: string): Promise<void> {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot message yourself');
    }

    const recipient = await this.userRepository.findOne({ where: { id: recipientId } });
    if (!recipient || !recipient.isActive || recipient.isBanned) {
      throw new NotFoundException('Recipient not found');
    }

    const blocked = await this.blockRepository.findOne({
      where: [
        { blockerId: userId, blockedId: recipientId },
        { blockerId: recipientId, blockedId: userId },
      ],
    });
    if (blocked) {
      throw new ForbiddenException('You cannot message this member');
    }
  }

  async sendMessage(senderId: string, recipientId: string, dto: SendMessageDto) {
    await this.ensureMessagingAllowed(senderId, recipientId);

    const content = dto.content?.trim();
    if (!content) {
      throw new BadRequestException('Message cannot be empty');
    }

    let sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (!this.isPaidDisabled()) {
      sender = await this.coinsService.checkAndResetDailyQuotas(senderId);
      if ((sender.dailyMsgCount || 0) < DEFAULT_DAILY_MSG_QUOTA) {
        await this.userRepository.update(senderId, {
          dailyMsgCount: (sender.dailyMsgCount || 0) + 1,
        });
      } else if ((sender.extraMsgCredits || 0) > 0) {
        await this.userRepository.update(senderId, {
          extraMsgCredits: (sender.extraMsgCredits || 0) - 1,
        });
      } else {
        await this.coinsService.deductCoins(
          senderId,
          50,
          CoinTxType.SPENT_MSG,
          'Extra message above daily quota',
        );
      }
    }

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        senderId,
        recipientId,
        content,
      }),
    );

    await this.devicesService.sendPushToUser(recipientId, {
      title: `💬 ${sender?.name || 'New message'}`,
      body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
      data: { type: 'message', userId: senderId },
    });

    this.messagesGateway.emitNewMessage(message);

    return message;
  }

  async getConversation(userId: string, recipientId: string, dto: MessagePaginationDto) {
    await this.ensureMessagingAllowed(userId, recipientId);

    const { page = 1, limit = 30 } = dto;
    const skip = (page - 1) * limit;

    const baseQb = this.messageRepository
      .createQueryBuilder('m')
      .where(
        '(m.senderId = :userId AND m.recipientId = :recipientId) OR (m.senderId = :recipientId AND m.recipientId = :userId)',
        { userId, recipientId },
      );

    const [messages, total] = await Promise.all([
      baseQb
        .clone()
        .orderBy('m.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany(),
      baseQb.clone().getCount(),
      this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ readAt: () => 'NOW()' })
        .where('senderId = :recipientId', { recipientId })
        .andWhere('recipientId = :userId', { userId })
        .andWhere('readAt IS NULL')
        .execute(),
    ]);

    return {
      messages: [...messages].reverse(),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getInbox(userId: string) {
    const recent = await this.messageRepository.find({
      where: [{ senderId: userId }, { recipientId: userId }],
      relations: ['sender', 'recipient'],
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const convoMap = new Map<string, {
      userId: string;
      userName: string;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
      primaryPhoto: string | null;
    }>();

    for (const msg of recent) {
      const isIncoming = msg.recipientId === userId;
      const other = isIncoming ? msg.sender : msg.recipient;
      if (!other) continue;

      const existing = convoMap.get(other.id);
      if (!existing) {
        convoMap.set(other.id, {
          userId: other.id,
          userName: other.name || 'Member',
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: isIncoming && !msg.readAt ? 1 : 0,
          primaryPhoto: null,
        });
      } else if (isIncoming && !msg.readAt) {
        existing.unreadCount += 1;
      }
    }

    const conversations = await Promise.all(
      Array.from(convoMap.values()).map(async (c) => {
        const photo = await this.photoRepository.findOne({
          where: { userId: c.userId },
          order: { order: 'ASC' },
        });
        return {
          ...c,
          primaryPhoto: photo ? this.withCacheBuster(photo.url, photo.id) : null,
        };
      }),
    );

    conversations.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

    return { conversations };
  }
}
