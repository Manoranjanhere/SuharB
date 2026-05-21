import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DiscoverService } from './discover.service';
import { UpdateLocationDto, DiscoverQueryDto } from './dto/discover.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Discover')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Patch('location')
  @ApiOperation({ summary: 'Update current user location' })
  updateLocation(@CurrentUser() user: User, @Body() dto: UpdateLocationDto) {
    return this.discoverService.updateLocation(user.id, dto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby members (Tinder-style feed)' })
  getNearby(@CurrentUser() user: User, @Query() dto: DiscoverQueryDto) {
    return this.discoverService.getNearby(user.id, dto);
  }

  @Post('pass/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pass on a user (skip, do not show again)' })
  passUser(@CurrentUser() user: User, @Param('userId') toUserId: string) {
    return this.discoverService.passUser(user.id, toUserId);
  }
}
