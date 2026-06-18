import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { User } from '../users/entities/user.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { GooglePlayBillingService } from '../subscriptions/google-play-billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CoinTransaction])],
  controllers: [CoinsController],
  providers: [CoinsService, GooglePlayBillingService],
  exports: [CoinsService],
})
export class CoinsModule {}
