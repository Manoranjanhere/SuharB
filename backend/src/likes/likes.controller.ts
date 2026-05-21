import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ComplimentDto, PaginationDto, SuperLikeDto } from './dto/likes.dto';

@ApiTags('Likes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like or unlike a user (toggle)' })
  likeUser(@CurrentUser() user: User, @Param('userId') toUserId: string) {
    return this.likesService.likeUser(user.id, toUserId);
  }

  @Post(':userId/super-like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super-like a user (uses daily quota/top-up credits)' })
  superLikeUser(
    @CurrentUser() user: User,
    @Param('userId') toUserId: string,
    @Body() dto: SuperLikeDto,
  ) {
    return this.likesService.superLikeUser(user.id, toUserId, dto);
  }

  @Post(':userId/compliment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send compliment message with like (uses compliment credit/coins)' })
  complimentUser(
    @CurrentUser() user: User,
    @Param('userId') toUserId: string,
    @Body() dto: ComplimentDto,
  ) {
    return this.likesService.sendCompliment(user.id, toUserId, dto);
  }

  @Get('you-liked')
  @ApiOperation({ summary: 'Get users you have liked' })
  getYouLiked(@CurrentUser() user: User, @Query() dto: PaginationDto) {
    return this.likesService.getYouLiked(user.id, dto);
  }

  @Get('liked-by')
  @ApiOperation({ summary: 'Get users who liked you' })
  getLikedBy(@CurrentUser() user: User, @Query() dto: PaginationDto) {
    return this.likesService.getLikedBy(user.id, dto);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get mutual matches' })
  getMatches(@CurrentUser() user: User, @Query() dto: PaginationDto) {
    return this.likesService.getMatches(user.id, dto);
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get full profile of a user (photos + bio + like status)' })
  getFullProfile(@CurrentUser() user: User, @Param('userId') targetUserId: string) {
    return this.likesService.getFullProfile(user.id, targetUserId);
  }
}
