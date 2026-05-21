import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';

import { Device, DevicePlatform } from './entities/device.entity';
import { RegisterDeviceDto } from '../auth/dto/social-auth.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {
    this.initFirebase();
  }

  private initFirebase(): void {
    if (admin.apps.length) return;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('[Firebase] Credentials not set — push notifications disabled');
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });
    } catch (err) {
      console.warn('[Firebase] Init failed:', err.message);
    }
  }

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
    if (!admin.apps.length) return;

    const devices = await this.deviceRepository.find({ where: { userId } });
    if (!devices.length) return;

    const tokens = devices.map((d) => d.fcmToken);

    await admin.messaging().sendEachForMulticast({
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
