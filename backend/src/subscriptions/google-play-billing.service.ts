import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { google } from 'googleapis';

export interface PlaySubscriptionVerification {
  valid: boolean;
  orderId?: string;
  expiryTimeMillis?: number;
}

export interface PlayProductVerification {
  valid: boolean;
  orderId?: string;
  purchaseState?: number;
}

@Injectable()
export class GooglePlayBillingService {
  private readonly logger = new Logger(GooglePlayBillingService.name);

  private shouldSkipVerify(): boolean {
    return (
      process.env.GOOGLE_PLAY_SKIP_VERIFY === 'true' ||
      (process.env.NODE_ENV === 'development' && process.env.DISABLE_PAID_FEATURES === 'true')
    );
  }

  private getPackageName(): string {
    return process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.SugarBae';
  }

  private async getAndroidPublisher() {
    const json =
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) {
      throw new BadRequestException('Google Play billing is not configured on the server');
    }

    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(json);
    } catch {
      throw new BadRequestException('Invalid Google Play service account JSON');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    return google.androidpublisher({ version: 'v3', auth });
  }

  async verifySubscription(
    productId: string,
    purchaseToken: string,
  ): Promise<PlaySubscriptionVerification> {
    if (this.shouldSkipVerify()) {
      this.logger.warn(`[DEV] Skipping Play verify for subscription ${productId}`);
      return { valid: true, orderId: `dev-${Date.now()}` };
    }

    const publisher = await this.getAndroidPublisher();
    const packageName = this.getPackageName();

    try {
      const { data } = await publisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const paymentState = data.paymentState;
      // 0 = pending, 1 = received
      if (paymentState !== undefined && paymentState !== 1) {
        return { valid: false };
      }

      const expiry = data.expiryTimeMillis ? parseInt(String(data.expiryTimeMillis), 10) : undefined;
      if (expiry && expiry < Date.now()) {
        return { valid: false };
      }

      return {
        valid: true,
        orderId: data.orderId || undefined,
        expiryTimeMillis: expiry,
      };
    } catch (err: any) {
      this.logger.error(`Play subscription verify failed: ${err?.message}`);
      throw new BadRequestException('Could not verify Google Play subscription');
    }
  }

  async verifyProduct(
    productId: string,
    purchaseToken: string,
  ): Promise<PlayProductVerification> {
    if (this.shouldSkipVerify()) {
      this.logger.warn(`[DEV] Skipping Play verify for product ${productId}`);
      return { valid: true, orderId: `dev-${Date.now()}`, purchaseState: 0 };
    }

    const publisher = await this.getAndroidPublisher();
    const packageName = this.getPackageName();

    try {
      const { data } = await publisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });

      // 0 = purchased, 1 = canceled, 2 = pending
      const purchaseState = data.purchaseState ?? -1;
      if (purchaseState !== 0) {
        return { valid: false, purchaseState };
      }

      return {
        valid: true,
        orderId: data.orderId || undefined,
        purchaseState,
      };
    } catch (err: any) {
      this.logger.error(`Play product verify failed: ${err?.message}`);
      throw new BadRequestException('Could not verify Google Play purchase');
    }
  }
}
