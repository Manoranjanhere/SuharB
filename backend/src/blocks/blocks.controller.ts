import { Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block or unblock a user (toggle)' })
  toggleBlock(@CurrentUser() user: User, @Param('userId') blockedId: string) {
    return this.blocksService.toggleBlock(user.id, blockedId);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of blocked users' })
  getBlockedList(@CurrentUser() user: User) {
    return this.blocksService.getBlockedList(user.id);
  }
}
