import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagingAndLikeEnhancements1716291000000 implements MigrationInterface {
  name = 'AddMessagingAndLikeEnhancements1716291000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderId" uuid NOT NULL,
        "recipientId" uuid NOT NULL,
        "content" text NOT NULL,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_senderId" ON "messages" ("senderId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_recipientId" ON "messages" ("recipientId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_messages_sender_user'
        ) THEN
          ALTER TABLE "messages"
          ADD CONSTRAINT "FK_messages_sender_user"
          FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_messages_recipient_user'
        ) THEN
          ALTER TABLE "messages"
          ADD CONSTRAINT "FK_messages_recipient_user"
          FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD COLUMN IF NOT EXISTS "isSuperLike" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD COLUMN IF NOT EXISTS "complimentMessage" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "likes" DROP COLUMN IF EXISTS "complimentMessage"
    `);
    await queryRunner.query(`
      ALTER TABLE "likes" DROP COLUMN IF EXISTS "isSuperLike"
    `);
    await queryRunner.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_recipient_user"
    `);
    await queryRunner.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_sender_user"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_messages_recipientId"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_messages_senderId"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "messages"
    `);
  }
}
