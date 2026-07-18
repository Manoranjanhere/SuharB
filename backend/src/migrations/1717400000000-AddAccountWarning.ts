import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountWarning1717400000000 implements MigrationInterface {
  name = 'AddAccountWarning1717400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "accountWarningMessage" text
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "accountWarningAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountWarningAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountWarningMessage"`);
  }
}
