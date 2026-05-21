import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  // ─── Unhide profiles whose hide period has ended (runs every hour) ────────

  @Cron(CronExpression.EVERY_HOUR)
  async unhideExpiredProfiles() {
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ hiddenUntil: null })
      .where('hiddenUntil IS NOT NULL AND hiddenUntil <= :now', { now: new Date() })
      .execute();

    if (result.affected > 0) {
      this.logger.log(`Unhid ${result.affected} profiles whose hide period expired`);
    }
  }

  // ─── Hard-delete accounts soft-deleted 30+ days ago (runs daily at 2am) ──

  @Cron('0 2 * * *')
  async purgeDeletedAccounts() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const deleted = await this.userRepository
      .createQueryBuilder('u')
      .withDeleted()
      .where('u.deletedAt IS NOT NULL AND u.deletedAt <= :cutoff', { cutoff })
      .getMany();

    if (deleted.length > 0) {
      await this.userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('deletedAt IS NOT NULL AND deletedAt <= :cutoff', { cutoff })
        .execute();

      this.logger.log(`Permanently purged ${deleted.length} deleted accounts`);
    }
  }

  // ─── Delete messages older than 90 days (runs daily at 3am) ───────────────
  @Cron('0 3 * * *')
  async purgeOldMessages() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const result = await this.messageRepository.delete({
      createdAt: LessThan(cutoff),
    });

    if ((result.affected || 0) > 0) {
      this.logger.log(`Purged ${result.affected} old messages`);
    }
  }
}
