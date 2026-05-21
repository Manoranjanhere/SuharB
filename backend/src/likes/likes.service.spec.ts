import { LikesService } from './likes.service';

describe('LikesService', () => {
  it('returns match when like is mutual', async () => {
    const likeRepository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null) // existing like check
        .mockResolvedValueOnce({ id: 'mutual' }), // mutual like check
      create: jest.fn((x) => x),
      save: jest.fn(),
      findAndCount: jest.fn(),
      query: jest.fn(),
    } as any;
    const userRepository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'to', name: 'Target' }) // target lookup
        .mockResolvedValueOnce({ id: 'from', name: 'Sender' }), // sender lookup
      update: jest.fn(),
    } as any;
    const photoRepository = { find: jest.fn(), findOne: jest.fn() } as any;
    const devicesService = { sendPushToUser: jest.fn().mockResolvedValue(undefined) } as any;
    const coinsService = { checkAndResetDailyQuotas: jest.fn(), deductCoins: jest.fn() } as any;

    const service = new LikesService(
      likeRepository,
      userRepository,
      photoRepository,
      devicesService,
      coinsService,
    );

    const result = await service.likeUser('from', 'to');

    expect(result).toEqual({ liked: true, isMatch: true });
    expect(devicesService.sendPushToUser).toHaveBeenCalledTimes(2);
  });
});
