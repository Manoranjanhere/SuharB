import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { User } from '../users/entities/user.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CoinTransaction])],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
