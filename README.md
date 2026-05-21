# SugarBf 🌹

> **Premium lifestyle matching app** — Connecting successful professionals (30s–45s) with lifestyle seekers. Think Tinder UX, elevated experience.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Subscription Plans](#subscription-plans)
11. [Push Notifications](#push-notifications)
12. [Admin Panel](#admin-panel)
13. [Deployment](#deployment)
14. [What to Add Next](#what-to-add-next)

---

## Overview

SugarBf is a premium dating/lifestyle app with two user types:

| Role | Description |
|------|-------------|
| **Professional** | Successful men (30s–45s) who want to share their lifestyle |
| **Companion** | Women seeking an elevated lifestyle experience |

Both must subscribe to message each other. Higher-tier subscribers can message more members.

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | **NestJS 10** (TypeScript) |
| Database | **PostgreSQL 15** via TypeORM |
| Auth | **JWT** + **WhatsApp OTP** (Twilio) + Google/Facebook/Apple OAuth |
| File Storage | **AWS S3** |
| Face Verification | **AWS Rekognition** |
| Push Notifications | **Firebase Admin SDK** |
| Payments | **Stripe** (INR, quarterly billing) |
| Email | **Nodemailer** + Gmail SMTP |
| Cron Jobs | **@nestjs/schedule** |
| API Docs | **Swagger** at `/api/docs` |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **React Native 0.73** (TypeScript) |
| Navigation | **React Navigation v6** |
| State | **Zustand** |
| Storage | **MMKV** (fast key-value) |
| HTTP | **Axios** |
| Push | **@react-native-firebase/messaging** |
| Location | **react-native-geolocation-service** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│  Auth → Onboarding → Discover → Profile → Chat → Settings  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + WebSocket (Step 5)
┌───────────────────────────▼─────────────────────────────────┐
│                    NestJS API Server                         │
│                                                             │
│  AuthModule  UsersModule  DiscoverModule  LikesModule       │
│  ChatModule  SubscriptionsModule  CoinsModule               │
│  AdminModule  BlocksModule  ReportsModule  TasksModule      │
└──────┬──────────────┬──────────────────┬────────────────────┘
       │              │                  │
  ┌────▼────┐   ┌─────▼──────┐   ┌──────▼──────┐
  │Postgres │   │  AWS S3 +  │   │  Firebase   │
  │   DB    │   │ Rekognition│   │    FCM      │
  └─────────┘   └────────────┘   └─────────────┘
```

---

## Features

### ✅ Implemented

| Feature | Status |
|---------|--------|
| WhatsApp OTP login | ✅ |
| Google / Facebook / Apple Sign In | ✅ |
| Firebase push registration | ✅ |
| Stage 1 profile (name, age, city, role, allowance) | ✅ |
| Stage 2 photos (up to 6, S3 upload) | ✅ |
| Tinder-style swipe discover (Haversine distance) | ✅ |
| Like / Super Like / Pass | ✅ |
| Match detection + push notification | ✅ |
| Full profile detail view | ✅ |
| You Liked / Liked By screens | ✅ |
| Report profile / photo (6 reasons) | ✅ |
| Block / Unblock | ✅ |
| Photo AI verification (AWS Rekognition) | ✅ |
| Female allowance expectation filter | ✅ |
| Male allowance offer + accommodation | ✅ |
| Subscription plans (Stripe, quarterly) | ✅ |
| Coins system + daily 50 coin reward | ✅ |
| Referral code system | ✅ |
| Topup packs (super likes, extra msgs, compliment) | ✅ |
| Messaging tier guard | ✅ |
| Admin panel (reports, bans, users, push) | ✅ |
| Ban by IP / phone / email | ✅ |
| Password reset via email link | ✅ |
| Marketing push notifications (by city/country/gender) | ✅ |
| Hide profile (1/2/3 months) | ✅ |
| Delete account + 30-day purge | ✅ |
| Cron jobs (auto-unhide, purge deleted accounts) | ✅ |
| Privacy / Terms / Support URLs | ✅ |

### 🔲 Step 5 — Real-time Chat (Next)
- WebSocket gateway (NestJS + Socket.IO)
- Message entity with 90-day auto-delete cron
- Inbox screen with conversation list
- Chat conversation screen
- Message status (sent / delivered / read)
- Push notification on new message
- Subscription tier guard on messaging

---

## Project Structure

```
SB/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── admin/              # Admin panel APIs, reports, bans
│   │   │   ├── dto/
│   │   │   ├── guards/         # AdminGuard, SuperAdminGuard
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.module.ts
│   │   │   └── admin.service.ts
│   │   ├── auth/               # JWT, OTP, Google/FB/Apple auth
│   │   │   ├── dto/
│   │   │   ├── entities/       # BannedIdentity, PasswordReset
│   │   │   ├── guards/         # JwtAuthGuard
│   │   │   ├── strategies/     # JwtStrategy
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   └── auth.service.ts
│   │   ├── blocks/             # Block/Unblock users
│   │   ├── coins/              # Coin transactions, daily rewards
│   │   ├── common/             # Shared: MailService, PrivacyController, decorators
│   │   │   ├── decorators/     # @CurrentUser()
│   │   │   ├── guards/         # SubscriptionTierGuard
│   │   │   └── services/       # MailService (Gmail/Nodemailer)
│   │   ├── config/             # Database config
│   │   ├── devices/            # FCM token management, push sender
│   │   ├── discover/           # Nearby users (Haversine SQL), filters
│   │   ├── likes/              # Like/unlike, match detection
│   │   ├── otp/                # OTP entity
│   │   ├── passes/             # Pass/skip user
│   │   ├── reports/            # Report profile/photo
│   │   ├── subscriptions/      # Stripe plans, topup packs, webhook
│   │   ├── tasks/              # Cron: auto-unhide, purge deleted accounts
│   │   ├── users/              # Profile, photos, verification, hide/delete
│   │   │   ├── dto/
│   │   │   ├── entities/       # User, UserPhoto
│   │   │   ├── photo-verification.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example            # Template — copy to .env and fill in
│   ├── .gitignore
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React Native app
│   ├── src/
│   │   ├── components/
│   │   │   ├── discover/       # SwipeCard, FiltersModal
│   │   │   ├── notifications/  # NotificationHandler
│   │   │   ├── profile/        # ProfileCard
│   │   │   └── subscription/   # DailyRewardModal
│   │   ├── navigation/         # React Navigation stack + all screens
│   │   ├── screens/
│   │   │   ├── admin/          # AdminPanelScreen
│   │   │   ├── auth/           # WelcomeScreen, PhoneEntryScreen, OtpVerifyScreen
│   │   │   ├── discover/       # DiscoverScreen (swipe)
│   │   │   ├── onboarding/     # Stage1Screen, Stage2PhotosScreen
│   │   │   ├── profile/        # ProfileDetailScreen, YouLikedScreen, LikedByScreen
│   │   │   ├── settings/       # AccountSettingsScreen
│   │   │   ├── subscription/   # SubscriptionScreen, CoinsScreen
│   │   │   └── verification/   # PhotoVerificationScreen
│   │   ├── services/           # API service layer (auth, profile, discover, subscription)
│   │   ├── store/              # Zustand state (auth.store)
│   │   └── theme/              # Colors, Spacing, FontSize, BorderRadius
│   ├── App.tsx
│   ├── index.js
│   ├── app.json
│   ├── metro.config.js
│   ├── babel.config.js
│   ├── .gitignore
│   └── package.json
│
├── .gitignore
└── README.md                   # This file
```

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/download/) |
| React Native CLI | latest | `npm install -g react-native-cli` |
| Android Studio | latest | For Android emulator |
| Xcode (Mac only) | 15+ | For iOS simulator |

---

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/sugarbf.git
cd sugarbf
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in .env with your credentials (see Environment Variables section)
npm install
```

**Create the database:**
```sql
-- Run in psql or pgAdmin
CREATE DATABASE sugarbf_db;
```

**Start in development mode (auto-restarts on file change):**
```bash
npm run start:dev
```

**API will be live at:**
- `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/api/docs`

> TypeORM auto-creates all tables on first run in dev mode.

---

### 3. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
```

---

### 4. Run on Android Emulator

**Step 1 — Install Android Studio**
- Download from [developer.android.com/studio](https://developer.android.com/studio)
- During setup, install: `Android SDK`, `Android SDK Platform`, `Android Virtual Device`

**Step 2 — Set environment variables** (Windows — add to System Environment Variables)
```
ANDROID_HOME = C:\Users\<YourName>\AppData\Local\Android\Sdk
```
Add to PATH:
```
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
```

**Step 3 — Create a virtual device**
- Open Android Studio → `Device Manager` → `Create Device`
- Pick: **Pixel 6** → **API 33 (Android 13)** → Finish
- Click the ▶️ Play button to start the emulator

**Step 4 — Run the app** (2 terminals needed)

Terminal 1 — Start Metro bundler:
```bash
cd frontend
npx react-native start
```

Terminal 2 — Build & install on emulator:
```bash
cd frontend
npx react-native run-android
```

> First build takes 3–5 minutes. Subsequent builds are fast.

---

### 5. Run on a Real Android Phone

**Step 1 — Enable Developer Mode on your phone**
1. Go to `Settings` → `About Phone`
2. Tap `Build Number` **7 times** until "You are a developer!" appears
3. Go back to `Settings` → `Developer Options`
4. Enable `USB Debugging`

**Step 2 — Connect via USB**
```bash
# Verify your phone is detected
adb devices
# Should show: LIST OF DEVICES ATTACHED → <your_device_id> device
```

**Step 3 — Run the app**
```bash
# Terminal 1
npx react-native start

# Terminal 2
npx react-native run-android
```
The app installs and launches directly on your phone. ✅

**Wireless debugging (no USB cable)** — Android 11+:
```bash
# Connect phone to same WiFi as your PC, then in Developer Options:
# Enable "Wireless Debugging" → tap it → "Pair device with QR code"
adb pair <ip>:<port>   # Enter the pairing code shown on screen
adb connect <ip>:<port>
npx react-native run-android
```

---

### 6. Run on iOS Simulator (Mac only)

```bash
cd frontend/ios
pod install          # Install CocoaPods dependencies
cd ..
npx react-native run-ios
```

To target a specific simulator:
```bash
npx react-native run-ios --simulator="iPhone 15 Pro"
```

---

### 7. Run on a Real iPhone (Mac only)

1. Open `ios/SugarBf.xcworkspace` in **Xcode**
2. Select your device from the top device dropdown
3. Go to `Signing & Capabilities` → set your Apple Developer account
4. Press ▶️ to build and run on your device

---

### 8. Change the API URL

Edit `src/services/api.ts` to point to your backend:

```typescript
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api/v1'   // Android emulator → your PC's localhost
  : 'https://api.sugarbfapp.com/api/v1'; // Production
```

> **iOS Simulator:** Use `http://localhost:3000/api/v1` instead of `10.0.2.2`
>
> **Real device on same WiFi:** Use your PC's local IP e.g. `http://192.168.1.10:3000/api/v1`
>
> Find your PC's local IP: run `ipconfig` on Windows → look for `IPv4 Address`

---

### 9. Build a Release APK (Android)

```bash
cd frontend/android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Install directly on a device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

> **Note:** You need a keystore to sign the release APK. See [React Native signed APK guide](https://reactnative.dev/docs/signed-apk-android).

---

### 10. Build for Google Play Store (AAB)

```bash
cd frontend/android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload this `.aab` file to [Google Play Console](https://play.google.com/console).

---

### 12. Test Auth (no mobile needed)

```bash
# Send OTP (logs to console in dev mode — no Twilio needed)
curl -X POST http://localhost:3000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Check backend terminal for the 6-digit code, then verify:
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "XXXXXX"}'
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default: 3000) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_USERNAME` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_NAME` | Yes | Database name (e.g. `sugarbf_db`) |
| `JWT_SECRET` | Yes | Long random string for JWT signing |
| `TWILIO_ACCOUNT_SID` | Prod | From [twilio.com](https://twilio.com) |
| `TWILIO_AUTH_TOKEN` | Prod | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | Prod | WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `GOOGLE_CLIENT_ID` | Prod | From [Google Cloud Console](https://console.cloud.google.com) |
| `FACEBOOK_APP_ID` | Prod | From [Facebook Developers](https://developers.facebook.com) |
| `FACEBOOK_APP_SECRET` | Prod | Facebook app secret |
| `APPLE_CLIENT_ID` | Prod | From Apple Developer portal |
| `FIREBASE_PROJECT_ID` | Prod | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Prod | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Prod | Firebase service account email |
| `AWS_ACCESS_KEY_ID` | Prod | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Prod | AWS IAM secret key |
| `AWS_REGION` | Prod | e.g. `ap-south-1` |
| `AWS_S3_BUCKET` | Prod | S3 bucket name for photos |
| `STRIPE_SECRET_KEY` | Prod | From [Stripe Dashboard](https://dashboard.stripe.com) |
| `STRIPE_WEBHOOK_SECRET` | Prod | Stripe webhook signing secret |
| `GMAIL_USER` | Prod | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Prod | [Google App Password](https://myaccount.google.com/apppasswords) (16 chars) |
| `PRIVACY_URL` | Prod | Your privacy policy URL (required for App Store) |
| `TERMS_URL` | Prod | Your terms of service URL |
| `ADMIN_WEB_URL` | Prod | Admin panel web URL |

> **Dev shortcut:** Only `DB_*` and `JWT_SECRET` are needed to run locally. All third-party services degrade gracefully when not configured.

---

## API Reference

Full interactive docs at: `http://localhost:3000/api/docs`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send WhatsApp OTP |
| POST | `/auth/otp/verify` | Verify OTP → JWT |
| POST | `/auth/social` | Google/Facebook/Apple → JWT |
| POST | `/auth/device/register` | Register FCM token |
| GET | `/auth/me` | Get current user |
| POST | `/auth/reset-password/:token` | Consume magic reset link |

### Users / Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/users/profile/stage1` | Complete basic profile |
| POST | `/users/profile/photos` | Upload photo (S3) |
| DELETE | `/users/profile/photos/:id` | Remove photo |
| POST | `/users/verify/selfie` | AI photo verification |
| PATCH | `/users/profile/hide` | Hide profile 1/2/3 months |
| DELETE | `/users/account` | Request account deletion |

### Discover
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/discover/location` | Update GPS coordinates |
| GET | `/discover/nearby` | Get nearby members (swipe feed) |
| POST | `/discover/pass/:userId` | Pass/skip a user |

### Likes / Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/likes/:userId` | Like/unlike toggle |
| GET | `/likes/you-liked` | Users you liked |
| GET | `/likes/liked-by` | Users who liked you |
| GET | `/likes/profile/:userId` | Full profile + photos |

### Subscriptions & Coins
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/my-plans` | Plans for your role |
| POST | `/subscriptions/subscribe` | Stripe checkout URL |
| POST | `/subscriptions/topup` | Buy super likes/extra msgs |
| POST | `/subscriptions/webhook` | Stripe webhook |
| GET | `/coins/balance` | Coin balance + history |
| POST | `/coins/daily-reward` | Claim 50 daily coins |

### Admin (requires `isAdmin = true`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Stats overview |
| GET | `/admin/reports` | Pending reports |
| PATCH | `/admin/reports/:id/action` | Dismiss/warn/remove/ban |
| GET | `/admin/users` | Search users |
| PATCH | `/admin/users/:id/action` | Ban/unban/delete/promote |
| POST | `/admin/users/:id/reset-password` | Send magic reset link |
| POST | `/admin/bans` | Ban IP/phone/email |
| DELETE | `/admin/bans/:id` | Lift a ban |
| POST | `/admin/notifications/push` | Marketing push by filter |

### Legal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/privacy` | → Redirects to PRIVACY_URL |
| GET | `/terms` | → Redirects to TERMS_URL |
| GET | `/support` | → Redirects to SUPPORT_URL |

---

## Database Schema

### Core Tables

| Table | Key Columns |
|-------|-------------|
| `users` | id, phone, email, googleId, facebookId, appleId, name, gender, age, city, country, role, subscriptionPlan, subscriptionTier, coins, referralCode, hiddenUntil, deletedAt |
| `user_photos` | id, userId, url, s3Key, order, isPrimary, isApproved |
| `otps` | id, phone, code, expiresAt, isUsed |
| `devices` | id, userId, fcmToken, platform |

### Social
| Table | Key Columns |
|-------|-------------|
| `likes` | id, fromUserId, toUserId |
| `passes` | id, fromUserId, toUserId |
| `blocks` | id, blockerId, blockedId |
| `reports` | id, reporterId, reportedUserId, reportedPhotoId, reason, isReviewed |

### Commerce
| Table | Key Columns |
|-------|-------------|
| `subscriptions` | id, userId, planId, tier, amountPaid, status, startsAt, expiresAt |
| `coin_transactions` | id, userId, type, amount, balanceAfter, description |

### Admin & Auth
| Table | Key Columns |
|-------|-------------|
| `banned_identities` | id, type (ip/phone/email), value, reason, isActive |
| `password_resets` | id, userId, token, expiresAt, isUsed |

---

## Subscription Plans

### Female (Companion)
| Plan | Monthly | Quarterly | Tier | Can Message |
|------|---------|-----------|------|-------------|
| 🥈 Silver | ₹300 | ₹900 | 1 | Silver & above |
| 🥇 Gold | ₹600 | ₹1,800 | 2 | Gold & above |
| 💎 Platinum | ₹900 | ₹2,700 | 3 | All members |

### Male (Professional)
| Plan | Monthly | Quarterly | Tier | Can Message |
|------|---------|-----------|------|-------------|
| 💰 Rich | ₹1,000 | ₹3,000 | 1 | Rich & above |
| 💎 Very Rich | ₹2,000 | ₹6,000 | 2 | Very Rich & above |
| 👑 Super Rich | ₹3,000 | ₹9,000 | 3 | All members |

**Messaging rule:** `senderTier >= recipientTier` (both must be subscribed)

### Default Quotas (all plans)
- 10 new messages/day
- Unlimited profile & photo likes
- 5 super likes/day

### Topup Packs
| Pack | Price | What you get |
|------|-------|-------------|
| ⭐ 5 Super Likes | ₹500 | Appear top of Liked By + 255 char message |
| 💬 10 Extra Messages | ₹500 | 10 messages above daily quota |
| 💝 Compliment | ₹100 | Special message with your like |

---

## Push Notifications

| Event | Recipient | Title |
|-------|-----------|-------|
| Like received | Profile owner | ❤️ Someone liked you! |
| Mutual match | Both users | 🎉 It's a Match! |
| New message | Recipient | 💬 New Message |
| Admin ban | Banned user | 🚫 Account Suspended |
| Admin warning | Warned user | ⚠️ Account Warning |
| Photo removed | User | 📸 Photo Removed |

---

## Admin Panel

### Access
Only users with `isAdmin = true` can access admin routes.

**Make first admin** (run directly in DB or via psql):
```sql
UPDATE users SET is_admin = true, is_super_admin = true WHERE email = 'your@email.com';
```

### Superadmin vs Admin
| Action | Admin | Superadmin |
|--------|-------|-----------|
| View/action reports | ✅ | ✅ |
| Ban/unban users | ✅ | ✅ |
| Delete users | ✅ | ✅ |
| Send marketing push | ✅ | ✅ |
| Make/remove admins | ❌ | ✅ |

---

## Deployment

### Backend (Recommended: Railway / Render / AWS EC2)

```bash
# Build
npm run build

# Start production
npm run start:prod
```

**Environment checklist:**
- `NODE_ENV=production`
- All `FIREBASE_*`, `AWS_*`, `STRIPE_*`, `TWILIO_*` variables set
- PostgreSQL connection string updated
- Stripe webhook URL: `https://your-api.com/api/v1/subscriptions/webhook`

### Frontend (React Native)

**Android APK:**
```bash
cd android
./gradlew assembleRelease
# APK in: android/app/build/outputs/apk/release/
```

**iOS IPA (Mac only):**
- Open `ios/SugarBf.xcworkspace` in Xcode
- Product → Archive → Distribute

### Required for App Store listing
| URL | Variable |
|-----|----------|
| Privacy Policy | `PRIVACY_URL` → `https://yourdomain.com/privacy` |
| Terms of Service | `TERMS_URL` → `https://yourdomain.com/terms` |
| Support | `SUPPORT_URL` → `https://yourdomain.com/support` |

These redirect via `/privacy`, `/terms`, `/support` endpoints.

---

## What to Add Next

### Step 5 — Real-time Chat (Critical)
```
backend/src/chat/
  entities/
    conversation.entity.ts   # two users, matchId
    message.entity.ts        # conversationId, senderId, content, readAt
  chat.gateway.ts            # WebSocket (Socket.IO)
  chat.service.ts            # CRUD + 90-day cleanup cron
  chat.controller.ts         # REST: get conversations, messages

frontend/src/screens/
  chat/
    InboxScreen.tsx          # Conversation list
    ChatConversationScreen.tsx  # Message bubbles, input
```

**Message features to implement:**
- Subscription tier check before sending
- Daily quota enforcement (10 msgs/day default)
- 90-day auto-delete cron (already planned in `tasks.service.ts`)
- Message status: sent → delivered → read
- Inbox banner warning about 90-day deletion

### Step 6 — Polish & Production
- [ ] Unit tests (Jest) for services
- [ ] E2E tests (Supertest) for controllers
- [ ] Rate limiting per user (not just IP)
- [ ] Redis for session/OTP caching (replace DB OTP storage)
- [ ] Image compression before S3 upload (Sharp)
- [ ] CDN for S3 photos (CloudFront)
- [ ] Soft-block IP via middleware (currently stored, not enforced)
- [ ] Upgrade AWS SDK to v3 (currently v2)

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

Private & Proprietary — All rights reserved.

---

*Built with ❤️ — SugarBf Team*
