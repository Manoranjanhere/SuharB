import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { MessagePaginationDto, SendMessageDto } from './dto/messages.dto';
import { MessagesService } from './messages.service';
import { SubscriptionTierGuard } from '../common/guards/subscription-tier.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Get chat inbox (latest message per user)' })
  getInbox(@CurrentUser() user: User) {
    return this.messagesService.getInbox(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread incoming messages' })
  getUnreadCount(@CurrentUser() user: User) {
    return this.messagesService.getUnreadCount(user.id).then((count) => ({ count }));
  }

  @Get(':recipientId')
  @ApiOperation({ summary: 'Get conversation with a user' })
  getConversation(
    @CurrentUser() user: User,
    @Param('recipientId') recipientId: string,
    @Query() dto: MessagePaginationDto,
  ) {
    return this.messagesService.getConversation(user.id, recipientId, dto);
  }

  @Post(':recipientId')
  @UseGuards(SubscriptionTierGuard)
  @ApiOperation({ summary: 'Send message to a user' })
  sendMessage(
    @CurrentUser() user: User,
    @Param('recipientId') recipientId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user.id, recipientId, dto);
  }
}
