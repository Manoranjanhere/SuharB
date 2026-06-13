import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716000000000 implements MigrationInterface {
  name = 'InitialSchema1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_gender_enum" AS ENUM ('male', 'female', 'other');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('professional', 'companion');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled', 'pending');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "coin_transactions_type_enum" AS ENUM (
          'earned_daily', 'earned_referral', 'purchased', 'spent_super_like',
          'spent_msg', 'spent_compliment', 'topup_purchase'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "reports_reason_enum" AS ENUM (
          'fake_profile', 'inappropriate_photo', 'spam', 'harassment', 'underage', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "banned_identities_type_enum" AS ENUM ('ip', 'phone', 'email', 'device_id');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "devices_platform_enum" AS ENUM ('ios', 'android');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phone" character varying,
        "email" character varying,
        "googleId" character varying,
        "facebookId" character varying,
        "appleId" character varying,
        "name" character varying,
        "gender" "users_gender_enum",
        "age" integer,
        "city" character varying,
        "country" character varying,
        "bio" text,
        "turnOns" text,
        "turnOffs" text,
        "weeklyAllowanceExpectation" integer,
        "canProvideAllowance" boolean NOT NULL DEFAULT false,
        "weeklyAllowanceAmount" integer,
        "canProvideAccommodation" boolean NOT NULL DEFAULT false,
        "accommodationType" character varying,
        "photoVerifiedStatus" character varying NOT NULL DEFAULT 'unverified',
        "selfieS3Key" character varying,
        "faceMatchConfidence" double precision,
        "role" "users_role_enum",
        "profileStage" integer NOT NULL DEFAULT 0,
        "isVerified" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "isBanned" boolean NOT NULL DEFAULT false,
        "isAdmin" boolean NOT NULL DEFAULT false,
        "isSuperAdmin" boolean NOT NULL DEFAULT false,
        "hiddenUntil" TIMESTAMP,
        "deletedAt" TIMESTAMP,
        "referralCode" character varying(6),
        "referredByCode" character varying,
        "stripeCustomerId" character varying,
        "subscriptionPlan" character varying,
        "subscriptionTier" integer NOT NULL DEFAULT 0,
        "subscriptionExpiresAt" TIMESTAMP,
        "coins" integer NOT NULL DEFAULT 0,
        "lastDailyRewardAt" date,
        "dailyMsgCount" integer NOT NULL DEFAULT 0,
        "dailyMsgResetAt" date,
        "dailySuperLikeCount" integer NOT NULL DEFAULT 0,
        "dailySuperLikeResetAt" date,
        "extraMsgCredits" integer NOT NULL DEFAULT 0,
        "extraSuperLikeCredits" integer NOT NULL DEFAULT 0,
        "latitude" double precision,
        "longitude" double precision,
        "locationUpdatedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastActiveAt" TIMESTAMP,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId"),
        CONSTRAINT "UQ_users_facebookId" UNIQUE ("facebookId"),
        CONSTRAINT "UQ_users_appleId" UNIQUE ("appleId"),
        CONSTRAINT "UQ_users_referralCode" UNIQUE ("referralCode")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "url" character varying NOT NULL,
        "s3Key" character varying NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "isApproved" boolean NOT NULL DEFAULT false,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_photos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_photos_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromUserId" uuid NOT NULL,
        "toUserId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_likes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_likes_fromUserId_toUserId" UNIQUE ("fromUserId", "toUserId"),
        CONSTRAINT "FK_likes_fromUser" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_likes_toUser" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_likes_fromUserId" ON "likes" ("fromUserId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_likes_toUserId" ON "likes" ("toUserId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "passes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromUserId" uuid NOT NULL,
        "toUserId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_passes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_passes_fromUserId_toUserId" UNIQUE ("fromUserId", "toUserId"),
        CONSTRAINT "FK_passes_fromUser" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_passes_toUser" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passes_fromUserId" ON "passes" ("fromUserId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "blockerId" uuid NOT NULL,
        "blockedId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blocks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blocks_blockerId_blockedId" UNIQUE ("blockerId", "blockedId"),
        CONSTRAINT "FK_blocks_blocker" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_blocks_blocked" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_blocks_blockerId" ON "blocks" ("blockerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_blocks_blockedId" ON "blocks" ("blockedId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reporterId" uuid NOT NULL,
        "reportedUserId" uuid NOT NULL,
        "reportedPhotoId" character varying,
        "reason" "reports_reason_enum" NOT NULL,
        "description" text,
        "isReviewed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reports_reportedUser" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reports_reporterId" ON "reports" ("reporterId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reports_reportedUserId" ON "reports" ("reportedUserId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "planId" character varying NOT NULL,
        "tier" integer NOT NULL,
        "amountPaid" integer NOT NULL,
        "stripePaymentIntentId" character varying,
        "stripeSessionId" character varying,
        "status" "subscriptions_status_enum" NOT NULL DEFAULT 'pending',
        "startsAt" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_userId" ON "subscriptions" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coin_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "coin_transactions_type_enum" NOT NULL,
        "amount" integer NOT NULL,
        "balanceAfter" integer NOT NULL,
        "description" character varying,
        "referenceId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coin_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coin_transactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coin_transactions_userId" ON "coin_transactions" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phone" character varying NOT NULL,
        "code" character varying(6) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isUsed" boolean NOT NULL DEFAULT false,
        "attempts" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otps_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_otps_phone" ON "otps" ("phone")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "banned_identities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "banned_identities_type_enum" NOT NULL,
        "value" character varying NOT NULL,
        "reason" character varying,
        "bannedByAdminId" character varying,
        "relatedUserId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_banned_identities_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_banned_identities_value" ON "banned_identities" ("value")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "token" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isUsed" boolean NOT NULL DEFAULT false,
        "initiatedByAdminId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_resets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_resets_token" UNIQUE ("token")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_password_resets_userId" ON "password_resets" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_password_resets_token" ON "password_resets" ("token")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "devices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fcmToken" character varying NOT NULL,
        "platform" "devices_platform_enum" NOT NULL,
        "deviceModel" character varying,
        "appVersion" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_devices_fcmToken" UNIQUE ("fcmToken"),
        CONSTRAINT "FK_devices_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_devices_fcmToken" ON "devices" ("fcmToken")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "devices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banned_identities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coin_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_photos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "devices_platform_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "banned_identities_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_reason_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "coin_transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_gender_enum"`);
  }
}
