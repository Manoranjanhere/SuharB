import { BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const messageRepository = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'm1', ...x })),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  } as any;
  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ id: 'to', isActive: true, isBanned: false }),
    update: jest.fn(),
  } as any;
  const blockRepository = { findOne: jest.fn().mockResolvedValue(null) } as any;
  const photoRepository = { findOne: jest.fn() } as any;
  const devicesService = { sendPushToUser: jest.fn().mockResolvedValue(undefined) } as any;
  const coinsService = {
    checkAndResetDailyQuotas: jest.fn().mockResolvedValue({ id: 'from', dailyMsgCount: 0, name: 'Sender' }),
    deductCoins: jest.fn(),
  } as any;
  const messagesGateway = { emitNewMessage: jest.fn() } as any;

  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessagesService(
      messageRepository,
      userRepository,
      blockRepository,
      photoRepository,
      devicesService,
      coinsService,
      messagesGateway,
    );
  });

  it('throws on empty message content', async () => {
    await expect(
      service.sendMessage('from', 'to', { content: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends message and emits realtime event', async () => {
    const sent = await service.sendMessage('from', 'to', { content: 'Hello' });

    expect(sent.id).toBe('m1');
    expect(userRepository.update).toHaveBeenCalledWith('from', { dailyMsgCount: 1 });
    expect(devicesService.sendPushToUser).toHaveBeenCalled();
    expect(messagesGateway.emitNewMessage).toHaveBeenCalled();
  });
});
