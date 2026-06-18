import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PhotoVerificationService } from './photo-verification.service';
import { User } from './entities/user.entity';
import { UserPhoto } from './entities/user-photo.entity';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoto]), CoinsModule],
  controllers: [UsersController],
  providers: [UsersService, PhotoVerificationService],
  exports: [UsersService, PhotoVerificationService],
})
export class UsersModule {}
