import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { UserPhoto } from '../users/entities/user-photo.entity';
import { BannedIdentity } from '../auth/entities/banned-identity.entity';
import { PasswordReset } from '../auth/entities/password-reset.entity';
import { Device } from '../devices/entities/device.entity';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, User, UserPhoto, BannedIdentity, PasswordReset, Device]),
    DevicesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
