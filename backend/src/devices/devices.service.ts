import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Device, DevicePlatform } from './entities/device.entity';
import { RegisterDeviceDto } from '../auth/dto/social-auth.dto';
import { FirebaseAdminService } from '../common/services/firebase-admin.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto): Promise<Device> {
    // Upsert: update token if exists (e.g. reinstalled app)
    let device = await this.deviceRepository.findOne({
      where: { fcmToken: dto.fcmToken },
    });

    if (device) {
      device.userId = userId;
      device.platform = dto.platform as DevicePlatform;
      device.deviceModel = dto.deviceModel;
      device.appVersion = dto.appVersion;
    } else {
      device = this.deviceRepository.create({
        userId,
        fcmToken: dto.fcmToken,
        platform: dto.platform as DevicePlatform,
        deviceModel: dto.deviceModel,
        appVersion: dto.appVersion,
      });
    }

    return this.deviceRepository.save(device);
  }

  async sendPushToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    const messaging = this.firebaseAdmin.getMessaging();
    if (!messaging) return;

    const devices = await this.deviceRepository.find({ where: { userId } });
    if (!devices.length) return;

    const tokens = devices.map((d) => d.fcmToken);

    await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
    });
  }

  async removeDevice(fcmToken: string): Promise<void> {
    await this.deviceRepository.delete({ fcmToken });
  }
}
