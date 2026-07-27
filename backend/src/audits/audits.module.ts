import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoginActivityAudit } from './entities/login-activity-audit.entity';
import { ReportActivityAudit } from './entities/report-activity-audit.entity';
import { AdminActionAudit } from './entities/admin-action-audit.entity';
import { PaymentActivityAudit } from './entities/payment-activity-audit.entity';
import { AccountActivityAudit } from './entities/account-activity-audit.entity';
import { AuditService } from './audits.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoginActivityAudit,
      ReportActivityAudit,
      AdminActionAudit,
      PaymentActivityAudit,
      AccountActivityAudit,
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditsModule {}
