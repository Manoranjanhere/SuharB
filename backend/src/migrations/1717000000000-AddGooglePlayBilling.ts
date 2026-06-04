import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGooglePlayBilling1717000000000 implements MigrationInterface {
  name = 'AddGooglePlayBilling1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "billingPeriod" varchar(16) NOT NULL DEFAULT 'quarterly'
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "googlePlayProductId" varchar(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "googlePlayPurchaseToken" varchar(512)
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "googlePlayOrderId" varchar(128)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subscriptions_googlePlayPurchaseToken"
      ON "subscriptions" ("googlePlayPurchaseToken")
      WHERE "googlePlayPurchaseToken" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_subscriptions_googlePlayPurchaseToken"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "googlePlayOrderId"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "googlePlayPurchaseToken"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "googlePlayProductId"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "billingPeriod"`);
  }
}
