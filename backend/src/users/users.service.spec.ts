import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from './users.service';
import { CompleteStage1Dto } from './dto/complete-profile.dto';
import { ProfileStage, UserGender, UserRole } from './entities/user.entity';

const baseDto = {
  name: 'Alex',
  gender: UserGender.FEMALE,
  age: 25,
  city: 'Mumbai',
  country: 'India',
  role: UserRole.COMPANION,
};

const picks = (n: number) =>
  [
    'travel_luxury_resort',
    'travel_trek_explore',
    'travel_nature',
    'food_fine_dining',
    'food_foodie_explore',
    'food_cook_for_me',
    'music_trendy_pop',
    'music_new_romantic',
    'music_90s_romantic',
    'music_oldies_sufi',
    'music_rock_metal',
  ].slice(0, n);

function setup(user: Record<string, unknown>) {
  const stored = { id: 'u1', referralCode: 'ABC123', profileStage: ProfileStage.STAGE2_COMPLETE, ...user };
  const userRepository = {
    findOne: jest.fn().mockResolvedValue(stored),
    save: jest.fn().mockImplementation(async (u) => u),
  } as any;
  const service = new UsersService(userRepository, {} as any, {} as any, {} as any);
  return { service, userRepository };
}

describe('UsersService.completeStage1 — profile specs', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.DISABLE_PAID_FEATURES;
  });
  afterAll(() => {
    process.env = env;
  });

  it.each([
    [0, 3],
    [1, 5],
    [2, 8],
    [3, 10],
  ])('tier %i may select up to %i, not one more', async (tier, limit) => {
    const { service } = setup({ subscriptionTier: tier });
    await expect(service.completeStage1('u1', { ...baseDto, companyFor: picks(limit) })).resolves.toBeDefined();
    await expect(
      service.completeStage1('u1', { ...baseDto, companyFor: picks(limit + 1) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('treats an expired subscription as free tier', async () => {
    const { service } = setup({
      subscriptionTier: 3,
      subscriptionExpiresAt: new Date(Date.now() - 86_400_000),
    });
    await expect(
      service.completeStage1('u1', { ...baseDto, companyFor: picks(4) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a downgraded member keep or trim existing picks, but not add new ones', async () => {
    const { service } = setup({ subscriptionTier: 1, companyFor: picks(10) });
    await expect(service.completeStage1('u1', { ...baseDto, companyFor: picks(10) })).resolves.toBeDefined();
    await expect(service.completeStage1('u1', { ...baseDto, companyFor: picks(7) })).resolves.toBeDefined();
    await expect(
      service.completeStage1('u1', { ...baseDto, companyFor: [...picks(9), 'gifts_story'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves the "I am" fields and keeps an active user in Discover', async () => {
    const { service } = setup({ subscriptionTier: 1 });
    const saved = await service.completeStage1('u1', {
      ...baseDto,
      heightCm: 170,
      diet: 'jain',
      drinksAlcohol: false,
      smokes: false,
      upbringing: 'moderate',
      sexualOrientation: 'straight',
      lookingFor: ['committed', 'casual'],
    });
    expect(saved).toMatchObject({
      heightCm: 170,
      diet: 'jain',
      drinksAlcohol: false,
      smokes: false,
      upbringing: 'moderate',
      sexualOrientation: 'straight',
      lookingFor: ['committed', 'casual'],
      profileStage: ProfileStage.STAGE2_COMPLETE,
    });
  });
});

describe('CompleteStage1Dto — profile specs validation', () => {
  const errorsFor = async (extra: Record<string, unknown>) =>
    (await validate(plainToInstance(CompleteStage1Dto, { ...baseDto, ...extra }))).map((e) => e.property);

  it('accepts valid options', async () => {
    expect(
      await errorsFor({ diet: 'veg', lookingFor: ['bdsm'], companyFor: ['presence_fun'], heightCm: 180 }),
    ).toEqual([]);
  });

  it('rejects unknown option keys, duplicates and out-of-range height', async () => {
    expect(await errorsFor({ diet: 'vegan' })).toEqual(['diet']);
    expect(await errorsFor({ lookingFor: ['friends'] })).toEqual(['lookingFor']);
    expect(await errorsFor({ companyFor: ['presence_fun', 'presence_fun'] })).toEqual(['companyFor']);
    expect(await errorsFor({ heightCm: 90 })).toEqual(['heightCm']);
  });

  it('rejects more than 10 company picks regardless of plan', async () => {
    expect(await errorsFor({ companyFor: picks(11) })).toEqual(['companyFor']);
  });
});
