import { Global, Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { FirebaseAdminService } from './services/firebase-admin.service';

/**
 * Global module — MailService available app-wide without re-importing.
 */
@Global()
@Module({
  providers: [MailService, FirebaseAdminService],
  exports: [MailService, FirebaseAdminService],
})
export class CommonModule {}
