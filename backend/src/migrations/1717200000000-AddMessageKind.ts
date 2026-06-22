import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageKind1717200000000 implements MigrationInterface {
  name = 'AddMessageKind1717200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN IF NOT EXISTS "kind" character varying(16) NOT NULL DEFAULT 'text'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "kind"`);
  }
}
