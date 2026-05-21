import { Global, Module } from '@nestjs/common';
import { MailService } from './services/mail.service';

/**
 * Global module — MailService available app-wide without re-importing.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class CommonModule {}
