import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { LikesModule } from './likes/likes.module';
import { ReportsModule } from './reports/reports.module';
import { DiscoverModule } from './discover/discover.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CoinsModule } from './coins/coins.module';
import { BlocksModule } from './blocks/blocks.module';
import { MessagesModule } from './messages/messages.module';
import { AdminModule } from './admin/admin.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrivacyController } from './common/privacy.controller';
import { CommonModule } from './common/common.module';

@Module({
  controllers: [PrivacyController],
  imports: [
    // Config (loads .env)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),

    // Rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),

    // Shared global utilities
    CommonModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    DevicesModule,
    LikesModule,
    ReportsModule,
    DiscoverModule,
    SubscriptionsModule,
    CoinsModule,
    BlocksModule,
    MessagesModule,
    AdminModule,
    TasksModule,
  ],
})
export class AppModule {}
