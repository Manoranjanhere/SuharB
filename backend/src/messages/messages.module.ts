import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Block } from '../blocks/entities/block.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { DevicesModule } from '../devices/devices.module';
import { CoinsModule } from '../coins/coins.module';
import { AuthModule } from '../auth/auth.module';
import { MessagesGateway } from './messages.gateway';
import { SubscriptionTierGuard } from '../common/guards/subscription-tier.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Block, UserPhoto]),
    DevicesModule,
    CoinsModule,
    AuthModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, SubscriptionTierGuard],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
