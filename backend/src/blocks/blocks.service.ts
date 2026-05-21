import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { User } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
  ) {}

  async toggleBlock(blockerId: string, blockedId: string): Promise<{ blocked: boolean }> {
    const target = await this.userRepository.findOne({ where: { id: blockedId } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.blockRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (existing) {
      await this.blockRepository.remove(existing);
      return { blocked: false };
    }

    await this.blockRepository.save(this.blockRepository.create({ blockerId, blockedId }));
    return { blocked: true };
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    });
    return !!block;
  }

  async getBlockedList(userId: string) {
    const blocks = await this.blockRepository.find({
      where: { blockerId: userId },
      order: { createdAt: 'DESC' },
    });

    const users = await Promise.all(
      blocks.map(async (b) => {
        const user = await this.userRepository.findOne({ where: { id: b.blockedId } });
        const photo = await this.photoRepository.findOne({
          where: { userId: b.blockedId, isPrimary: true },
        });
        return { ...user, primaryPhoto: photo?.url, blockedAt: b.createdAt };
      }),
    );
    return users;
  }

  async getBlockedIds(userId: string): Promise<string[]> {
    const blocks = await this.blockRepository.find({ where: { blockerId: userId } });
    const blockedByBlocks = await this.blockRepository.find({ where: { blockedId: userId } });
    return [
      ...blocks.map((b) => b.blockedId),
      ...blockedByBlocks.map((b) => b.blockerId),
    ];
  }
}
