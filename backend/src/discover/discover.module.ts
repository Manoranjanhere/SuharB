import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoverController } from './discover.controller';
import { DiscoverService } from './discover.service';
import { User } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { Like } from '../likes/entities/like.entity';
import { Pass } from '../passes/entities/pass.entity';
import { Block } from '../blocks/entities/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoto, Like, Pass, Block])],
  controllers: [DiscoverController],
  providers: [DiscoverService],
  exports: [DiscoverService],
})
export class DiscoverModule {}
