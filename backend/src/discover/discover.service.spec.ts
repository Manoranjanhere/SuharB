import { BadRequestException } from '@nestjs/common';
import { DiscoverService } from './discover.service';

describe('DiscoverService', () => {
  it('throws when current user has no location', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'u1', latitude: null, longitude: null }),
    } as any;
    const photoRepository = {} as any;
    const likeRepository = {} as any;
    const passRepository = {} as any;
    const blockRepository = {} as any;

    const service = new DiscoverService(
      userRepository,
      photoRepository,
      likeRepository,
      passRepository,
      blockRepository,
    );

    await expect(service.getNearby('u1', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
