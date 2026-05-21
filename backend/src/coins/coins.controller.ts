import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Coins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get coin balance + last 30 transactions' })
  getBalance(@CurrentUser() user: User) {
    return this.coinsService.getBalance(user.id);
  }

  @Post('daily-reward')
  @ApiOperation({ summary: 'Claim 50-coin daily login reward (once per day)' })
  claimDailyReward(@CurrentUser() user: User) {
    return this.coinsService.claimDailyReward(user.id);
  }
}
