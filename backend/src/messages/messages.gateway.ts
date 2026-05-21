import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Message } from './entities/message.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  private getToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    const headerToken = client.handshake.headers?.authorization;
    if (headerToken && typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.replace('Bearer ', '');
    }

    return null;
  }

  private getConversationRoom(userA: string, userB: string): string {
    return ['conversation', userA, userB].sort().join(':');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.getToken(client);
      if (!token) throw new UnauthorizedException('Missing auth token');

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET || 'default_secret',
      });
      if (!payload?.sub) throw new UnauthorizedException('Invalid token payload');

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.debug(`Socket connected: ${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Socket auth failed: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.logger.debug(`Socket disconnected: ${client.data.userId}`);
    }
  }

  @SubscribeMessage('conversation:join')
  joinConversation(@ConnectedSocket() client: Socket, @MessageBody() body: { userId: string }) {
    const currentUserId = client.data?.userId as string | undefined;
    if (!currentUserId || !body?.userId) {
      return { joined: false };
    }

    const room = this.getConversationRoom(currentUserId, body.userId);
    client.join(room);
    return { joined: true, room };
  }

  emitNewMessage(message: Message) {
    if (!this.server) return;

    const room = this.getConversationRoom(message.senderId, message.recipientId);
    this.server.to(`user:${message.senderId}`).emit('message:new', message);
    this.server.to(`user:${message.recipientId}`).emit('message:new', message);
    this.server.to(room).emit('conversation:message', message);
  }
}
