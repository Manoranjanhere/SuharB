import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyComplimentQuota1717100000000 implements MigrationInterface {
  name = 'AddDailyComplimentQuota1717100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "dailyComplimentCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "dailyComplimentResetAt" date
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "dailyComplimentCount",
      DROP COLUMN IF EXISTS "dailyComplimentResetAt"
    `);
  }
}
