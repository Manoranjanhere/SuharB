import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileSpecs1717600000000 implements MigrationInterface {
  name = 'AddProfileSpecs1717600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "heightCm" integer,
        ADD COLUMN IF NOT EXISTS "diet" varchar(16),
        ADD COLUMN IF NOT EXISTS "drinksAlcohol" boolean,
        ADD COLUMN IF NOT EXISTS "smokes" boolean,
        ADD COLUMN IF NOT EXISTS "upbringing" varchar(16),
        ADD COLUMN IF NOT EXISTS "sexualOrientation" varchar(16),
        ADD COLUMN IF NOT EXISTS "lookingFor" text,
        ADD COLUMN IF NOT EXISTS "companyFor" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "companyFor",
        DROP COLUMN IF EXISTS "lookingFor",
        DROP COLUMN IF EXISTS "sexualOrientation",
        DROP COLUMN IF EXISTS "upbringing",
        DROP COLUMN IF EXISTS "smokes",
        DROP COLUMN IF EXISTS "drinksAlcohol",
        DROP COLUMN IF EXISTS "diet",
        DROP COLUMN IF EXISTS "heightCm"
    `);
  }
}
