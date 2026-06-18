import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { VerifyGooglePlayCoinDto } from './dto/coins.dto';

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

  @Get('packs')
  @ApiOperation({ summary: 'Coin packs available for Google Play purchase' })
  getPacks() {
    return this.coinsService.getCoinPacks();
  }

  @Post('daily-reward')
  @ApiOperation({ summary: 'Claim 1-coin daily login reward (once per day, ₹50 value)' })
  claimDailyReward(@CurrentUser() user: User) {
    return this.coinsService.claimDailyReward(user.id);
  }

  @Post('google-play/verify')
  @ApiOperation({ summary: 'Verify Google Play coin pack purchase and credit balance' })
  verifyPlayPurchase(@CurrentUser() user: User, @Body() dto: VerifyGooglePlayCoinDto) {
    return this.coinsService.verifyGooglePlayCoinPurchase(
      user.id,
      dto.productId,
      dto.purchaseToken,
    );
  }
}
