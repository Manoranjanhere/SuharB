import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityAudits1717500000000 implements MigrationInterface {
  name = 'AddActivityAudits1717500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "login_activity_audits" (
        "id" BIGSERIAL PRIMARY KEY,
        "actTimeStamp" TIMESTAMP NOT NULL DEFAULT now(),
        "forUser" uuid,
        "byUser" uuid,
        "activityName" varchar(64) NOT NULL,
        "affectedDataName" varchar(128),
        "fromValue" text,
        "toValue" text,
        "notes" text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_login_activity_audits_actTimeStamp" ON "login_activity_audits" ("actTimeStamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_login_activity_audits_forUser" ON "login_activity_audits" ("forUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_login_activity_audits_byUser" ON "login_activity_audits" ("byUser")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_activity_audits" (
        "id" BIGSERIAL PRIMARY KEY,
        "actTimeStamp" TIMESTAMP NOT NULL DEFAULT now(),
        "forUser" uuid,
        "byUser" uuid,
        "activityName" varchar(64) NOT NULL,
        "affectedDataName" varchar(128),
        "fromValue" text,
        "toValue" text,
        "notes" text,
        "adminLink" text,
        "reportId" uuid,
        "reportedPhotoId" uuid
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_report_activity_audits_actTimeStamp" ON "report_activity_audits" ("actTimeStamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_report_activity_audits_forUser" ON "report_activity_audits" ("forUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_report_activity_audits_byUser" ON "report_activity_audits" ("byUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_report_activity_audits_reportId" ON "report_activity_audits" ("reportId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_action_audits" (
        "id" BIGSERIAL PRIMARY KEY,
        "actTimeStamp" TIMESTAMP NOT NULL DEFAULT now(),
        "forUser" uuid,
        "byUser" uuid,
        "activityName" varchar(64) NOT NULL,
        "affectedDataName" varchar(128),
        "fromValue" text,
        "toValue" text,
        "notes" text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_admin_action_audits_actTimeStamp" ON "admin_action_audits" ("actTimeStamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_admin_action_audits_forUser" ON "admin_action_audits" ("forUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_admin_action_audits_byUser" ON "admin_action_audits" ("byUser")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_activity_audits" (
        "id" BIGSERIAL PRIMARY KEY,
        "actTimeStamp" TIMESTAMP NOT NULL DEFAULT now(),
        "forUser" uuid,
        "byUser" uuid,
        "activityName" varchar(64) NOT NULL,
        "affectedDataName" varchar(128),
        "fromValue" text,
        "toValue" text,
        "notes" text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_activity_audits_actTimeStamp" ON "payment_activity_audits" ("actTimeStamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_activity_audits_forUser" ON "payment_activity_audits" ("forUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_activity_audits_byUser" ON "payment_activity_audits" ("byUser")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "account_activity_audits" (
        "id" BIGSERIAL PRIMARY KEY,
        "actTimeStamp" TIMESTAMP NOT NULL DEFAULT now(),
        "forUser" uuid,
        "byUser" uuid,
        "activityName" varchar(64) NOT NULL,
        "affectedDataName" varchar(128),
        "fromValue" text,
        "toValue" text,
        "notes" text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_activity_audits_actTimeStamp" ON "account_activity_audits" ("actTimeStamp")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_activity_audits_forUser" ON "account_activity_audits" ("forUser")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_account_activity_audits_byUser" ON "account_activity_audits" ("byUser")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_activity_audits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_activity_audits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_action_audits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_activity_audits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "login_activity_audits"`);
  }
}
