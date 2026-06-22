import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLikedBySeenAt1717300000000 implements MigrationInterface {
  name = 'AddLikedBySeenAt1717300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "likedBySeenAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "likedBySeenAt"`);
  }
}
