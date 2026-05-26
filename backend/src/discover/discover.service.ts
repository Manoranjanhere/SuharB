import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, ProfileStage } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { Like } from '../likes/entities/like.entity';
import { Pass } from '../passes/entities/pass.entity';
import { Block } from '../blocks/entities/block.entity';
import { UpdateLocationDto, DiscoverQueryDto } from './dto/discover.dto';

@Injectable()
export class DiscoverService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPhoto)
    private readonly photoRepository: Repository<UserPhoto>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  private withCacheBuster(url: string, version: string): string {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${version}`;
  }

  // ─── Update Location ───────────────────────────────────────────────────────

  async updateLocation(userId: string, dto: UpdateLocationDto): Promise<{ updated: boolean }> {
    await this.userRepository.update(userId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationUpdatedAt: new Date(),
    });
    return { updated: true };
  }

  // ─── Pass a user ───────────────────────────────────────────────────────────

  async passUser(fromUserId: string, toUserId: string): Promise<{ passed: boolean }> {
    const existing = await this.passRepository.findOne({
      where: { fromUserId, toUserId },
    });
    if (!existing) {
      await this.passRepository.save(
        this.passRepository.create({ fromUserId, toUserId }),
      );
    }
    return { passed: true };
  }

  // ─── Discover nearby users ─────────────────────────────────────────────────

  async getNearby(userId: string, dto: DiscoverQueryDto) {
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });

    if (currentUser?.latitude == null || currentUser?.longitude == null) {
      throw new BadRequestException('Enable location to discover nearby members');
    }

    const {
      maxDistance = 50,
      minAge = 18,
      maxAge = 60,
      gender,
      role,
      page = 1,
      limit = 10,
      minAllowance,
      accommodationType,
      verifiedOnly,
    } = dto;

    const offset = (page - 1) * limit;

    // Already liked or passed by current user
    const likedIds = await this.likeRepository
      .find({ where: { fromUserId: userId }, select: ['toUserId'] })
      .then((l) => l.map((x) => x.toUserId));

    const passedIds = await this.passRepository
      .find({ where: { fromUserId: userId }, select: ['toUserId'] })
      .then((p) => p.map((x) => x.toUserId));

    const blockedIds = await this.blockRepository
      .find({
        where: [{ blockerId: userId }, { blockedId: userId }],
      })
      .then((b) => b.map((x) => x.blockerId === userId ? x.blockedId : x.blockerId));

    const excludeIds = [...new Set([...likedIds, ...passedIds, ...blockedIds, userId])];
    const excludePlaceholders = excludeIds.length > 0
      ? excludeIds.map((_, i) => `$${i + 6}`).join(',')
      : 'NULL';

    // Haversine distance formula in raw SQL
    const rawQuery = `
      SELECT
        u.id,
        u.name,
        u.age,
        u.gender,
        u.city,
        u.country,
        u.role,
        u.bio,
        u."turnOns" AS "turnOns",
        u."turnOffs" AS "turnOffs",
        u.latitude,
        u.longitude,
        u."photoVerifiedStatus" AS "photoVerifiedStatus",
        u."canProvideAllowance" AS "canProvideAllowance",
        u."weeklyAllowanceAmount" AS "weeklyAllowanceAmount",
        u."canProvideAccommodation" AS "canProvideAccommodation",
        u."accommodationType" AS "accommodationType",
        u."weeklyAllowanceExpectation" AS "weeklyAllowanceExpectation",
        u."subscriptionPlan" AS "subscriptionPlan",
        u."subscriptionTier" AS "subscriptionTier",
        ROUND(
          (6371 * acos(
            LEAST(1, cos(radians($1)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(u.latitude)))
          ))::numeric, 1
        ) AS distance
      FROM users u
      WHERE u."profileStage" >= ${ProfileStage.STAGE2_COMPLETE}
        AND u."isActive" = true
        AND u."isBanned" = false
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND u."deletedAt" IS NULL
        AND (u."hiddenUntil" IS NULL OR u."hiddenUntil" <= NOW())
        AND u.age BETWEEN $3 AND $4
        ${gender ? `AND u.gender = '${gender}'` : ''}
        ${role ? `AND u.role = '${role}'` : ''}
        ${minAllowance ? `AND u."canProvideAllowance" = true AND u."weeklyAllowanceAmount" >= ${minAllowance}` : ''}
        ${accommodationType ? `AND u."canProvideAccommodation" = true AND u."accommodationType" = '${accommodationType}'` : ''}
        ${verifiedOnly ? `AND u."photoVerifiedStatus" = 'verified'` : ''}
        ${excludeIds.length > 0 ? `AND u.id NOT IN (${excludePlaceholders})` : ''}
        AND ROUND(
          (6371 * acos(
            LEAST(1, cos(radians($1)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(u.latitude)))
          ))::numeric, 1
        ) <= $5
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u."profileStage" >= ${ProfileStage.STAGE2_COMPLETE}
        AND u."isActive" = true
        AND u."isBanned" = false
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND u."deletedAt" IS NULL
        AND (u."hiddenUntil" IS NULL OR u."hiddenUntil" <= NOW())
        AND u.age BETWEEN $3 AND $4
        ${gender ? `AND u.gender = '${gender}'` : ''}
        ${role ? `AND u.role = '${role}'` : ''}
        ${minAllowance ? `AND u."canProvideAllowance" = true AND u."weeklyAllowanceAmount" >= ${minAllowance}` : ''}
        ${accommodationType ? `AND u."canProvideAccommodation" = true AND u."accommodationType" = '${accommodationType}'` : ''}
        ${verifiedOnly ? `AND u."photoVerifiedStatus" = 'verified'` : ''}
        ${excludeIds.length > 0 ? `AND u.id NOT IN (${excludePlaceholders})` : ''}
        AND ROUND(
          (6371 * acos(
            LEAST(1, cos(radians($1)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(u.latitude)))
          ))::numeric, 1
        ) <= $5
    `;

    const params = [
      currentUser.latitude,
      currentUser.longitude,
      minAge,
      maxAge,
      maxDistance,
      ...excludeIds,
    ];

    const [users, countResult] = await Promise.all([
      this.userRepository.query(rawQuery, params),
      this.userRepository.query(countQuery, params),
    ]);

    // Attach primary photo to each user
    const enriched = await Promise.all(
      users.map(async (u: any) => {
        const photosRaw = await this.photoRepository.find({
          where: { userId: u.id },
          order: { order: 'ASC' },
        });
        const photos = photosRaw.map((photo) => ({
          ...photo,
          url: this.withCacheBuster(photo.url, photo.id),
        }));
        return { ...u, photos, primaryPhoto: photos[0]?.url || null };
      }),
    );

    const total = parseInt(countResult[0]?.total || '0');

    return {
      users: enriched,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
