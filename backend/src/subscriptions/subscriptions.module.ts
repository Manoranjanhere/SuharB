import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { GooglePlayBillingService } from './google-play-billing.service';
import { Subscription } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { CoinTransaction } from '../coins/entities/coin-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User, CoinTransaction])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, GooglePlayBillingService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
