import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoginActivityAudit } from './entities/login-activity-audit.entity';
import { ReportActivityAudit } from './entities/report-activity-audit.entity';
import { AdminActionAudit } from './entities/admin-action-audit.entity';
import { PaymentActivityAudit } from './entities/payment-activity-audit.entity';
import { AccountActivityAudit } from './entities/account-activity-audit.entity';
import { AuditWriteInput } from './audit.constants';
import { buildAdminProfileLink } from './audit.utils';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(LoginActivityAudit)
    private readonly loginAudits: Repository<LoginActivityAudit>,
    @InjectRepository(ReportActivityAudit)
    private readonly reportAudits: Repository<ReportActivityAudit>,
    @InjectRepository(AdminActionAudit)
    private readonly adminAudits: Repository<AdminActionAudit>,
    @InjectRepository(PaymentActivityAudit)
    private readonly paymentAudits: Repository<PaymentActivityAudit>,
    @InjectRepository(AccountActivityAudit)
    private readonly accountAudits: Repository<AccountActivityAudit>,
  ) {}

  /** Login activity — IP must go in notes */
  async logLogin(input: AuditWriteInput): Promise<void> {
    try {
      await this.loginAudits.save(
        this.loginAudits.create({
          forUser: input.forUser ?? null,
          byUser: input.byUser ?? input.forUser ?? null,
          activityName: input.activityName,
          affectedDataName: input.affectedDataName ?? null,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          notes: input.notes ?? null,
        }),
      );
    } catch (err) {
      this.logger.error(`login audit failed: ${(err as Error)?.message}`);
    }
  }

  /** Report user / photo — includes adminLink to open reported profile */
  async logReport(
    input: AuditWriteInput & {
      reportId?: string | null;
      reportedPhotoId?: string | null;
      adminLink?: string | null;
    },
  ): Promise<void> {
    try {
      const forUser = input.forUser ?? null;
      await this.reportAudits.save(
        this.reportAudits.create({
          forUser,
          byUser: input.byUser ?? null,
          activityName: input.activityName,
          affectedDataName: input.affectedDataName ?? null,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          notes: input.notes ?? null,
          reportId: input.reportId ?? null,
          reportedPhotoId: input.reportedPhotoId ?? null,
          adminLink:
            input.adminLink ??
            (forUser ? buildAdminProfileLink(forUser) : null),
        }),
      );
    } catch (err) {
      this.logger.error(`report audit failed: ${(err as Error)?.message}`);
    }
  }

  async logAdminAction(input: AuditWriteInput): Promise<void> {
    try {
      await this.adminAudits.save(
        this.adminAudits.create({
          forUser: input.forUser ?? null,
          byUser: input.byUser ?? null,
          activityName: input.activityName,
          affectedDataName: input.affectedDataName ?? null,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          notes: input.notes ?? null,
        }),
      );
    } catch (err) {
      this.logger.error(`admin audit failed: ${(err as Error)?.message}`);
    }
  }

  async logPayment(input: AuditWriteInput): Promise<void> {
    try {
      await this.paymentAudits.save(
        this.paymentAudits.create({
          forUser: input.forUser ?? null,
          byUser: input.byUser ?? input.forUser ?? null,
          activityName: input.activityName,
          affectedDataName: input.affectedDataName ?? null,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          notes: input.notes ?? null,
        }),
      );
    } catch (err) {
      this.logger.error(`payment audit failed: ${(err as Error)?.message}`);
    }
  }

  async logAccount(input: AuditWriteInput): Promise<void> {
    try {
      await this.accountAudits.save(
        this.accountAudits.create({
          forUser: input.forUser ?? null,
          byUser: input.byUser ?? null,
          activityName: input.activityName,
          affectedDataName: input.affectedDataName ?? null,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          notes: input.notes ?? null,
        }),
      );
    } catch (err) {
      this.logger.error(`account audit failed: ${(err as Error)?.message}`);
    }
  }

  private async page<T>(
    repo: Repository<T>,
    page = 1,
    limit = 50,
  ): Promise<{ items: T[]; total: number; page: number; pages: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await repo.findAndCount({
      order: { actTimeStamp: 'DESC' } as any,
      skip,
      take,
    });
    return { items, total, page: Math.max(page, 1), pages: Math.ceil(total / take) || 1 };
  }

  listLoginAudits(page = 1, limit = 50) {
    return this.page(this.loginAudits, page, limit);
  }

  listReportAudits(page = 1, limit = 50) {
    return this.page(this.reportAudits, page, limit);
  }

  listAdminActionAudits(page = 1, limit = 50) {
    return this.page(this.adminAudits, page, limit);
  }

  listPaymentAudits(page = 1, limit = 50) {
    return this.page(this.paymentAudits, page, limit);
  }

  listAccountAudits(page = 1, limit = 50) {
    return this.page(this.accountAudits, page, limit);
  }
}
