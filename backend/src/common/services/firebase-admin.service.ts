import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private isPlaceholder(value: string): boolean {
    return /your_|xxxxx|example|\.\.\./i.test(value);
  }

  private init(): void {
    if (admin.apps.length) {
      this.initialized = true;
      return;
    }

    const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonEnv?.trim()) {
      try {
        const credentials = JSON.parse(jsonEnv) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(credentials),
        });
        this.initialized = true;
        console.log(`[Firebase] Admin SDK ready (project: ${credentials.projectId})`);
        return;
      } catch (err) {
        console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON invalid:', err.message);
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (
      !projectId ||
      !privateKey ||
      !clientEmail ||
      this.isPlaceholder(projectId) ||
      this.isPlaceholder(privateKey) ||
      this.isPlaceholder(clientEmail)
    ) {
      console.warn(
        '[Firebase] Admin credentials missing — set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL in backend/.env',
      );
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
      this.initialized = true;
      console.log(`[Firebase] Admin SDK ready (project: ${projectId})`);
    } catch (err) {
      console.warn('[Firebase] Init failed:', err.message);
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.initialized) {
      throw new UnauthorizedException(
        'Firebase Admin is not configured on the server. Add service account credentials to backend/.env and restart.',
      );
    }
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  getMessaging(): admin.messaging.Messaging | null {
    return this.initialized ? admin.messaging() : null;
  }
}
