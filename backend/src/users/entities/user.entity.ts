import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  PROFESSIONAL = 'professional',
  COMPANION = 'companion',
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum ProfileStage {
  REGISTERED = 0,
  STAGE1_COMPLETE = 1,
  STAGE2_COMPLETE = 2,
  ACTIVE = 3,
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Auth identifiers ---
  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, unique: true })
  facebookId: string;

  @Column({ nullable: true, unique: true })
  appleId: string;

  // --- Profile info (Stage 1) ---
  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender: UserGender;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  // --- Extended profile ---
  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ type: 'simple-array', nullable: true })
  turnOns: string[];

  @Column({ type: 'simple-array', nullable: true })
  turnOffs: string[];

  // --- Female: allowance expectation (INR/week) ---
  @Column({ nullable: true, type: 'int' })
  weeklyAllowanceExpectation: number;

  // --- Male: allowance offer ---
  @Column({ default: false })
  canProvideAllowance: boolean;

  @Column({ nullable: true, type: 'int' })
  weeklyAllowanceAmount: number;

  // --- Male: accommodation ---
  @Column({ default: false })
  canProvideAccommodation: boolean;

  @Column({ nullable: true })
  accommodationType: string;   // 'live_in' | 'independent_room'

  // --- Photo verification ---
  @Column({ default: 'unverified' })
  photoVerifiedStatus: string;  // unverified | pending | verified | failed

  @Column({ nullable: true })
  selfieS3Key: string;

  @Column({ nullable: true, type: 'float' })
  faceMatchConfidence: number;

  // --- App role ---
  @Column({ type: 'enum', enum: UserRole, nullable: true })
  role: UserRole;

  // --- Profile completion tracking ---
  @Column({ type: 'int', default: ProfileStage.REGISTERED })
  profileStage: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isSuperAdmin: boolean;  // can manage admins themselves

  // --- Profile visibility ---
  @Column({ nullable: true, type: 'timestamp' })
  hiddenUntil: Date;          // if set and in future → profile hidden from discover

  // --- Soft delete ---
  @DeleteDateColumn()
  deletedAt: Date;            // TypeORM soft-delete

  // --- Referral ---
  @Column({ nullable: true, unique: true, length: 6 })
  referralCode: string;

  @Column({ nullable: true })
  referredByCode: string;

  // --- Subscription ---
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  subscriptionPlan: string;       // silver | gold | platinum | rich | very_rich | super_rich

  @Column({ type: 'int', default: 0 })
  subscriptionTier: number;       // 0=none, 1=base, 2=mid, 3=top

  @Column({ nullable: true, type: 'timestamp' })
  subscriptionExpiresAt: Date;

  // --- Coins ---
  @Column({ type: 'int', default: 0 })
  coins: number;

  @Column({ nullable: true, type: 'date' })
  lastDailyRewardAt: Date;

  // --- Daily Quotas (reset at midnight) ---
  @Column({ type: 'int', default: 0 })
  dailyMsgCount: number;

  @Column({ nullable: true, type: 'date' })
  dailyMsgResetAt: Date;

  @Column({ type: 'int', default: 0 })
  dailySuperLikeCount: number;

  @Column({ nullable: true, type: 'date' })
  dailySuperLikeResetAt: Date;

  // --- Extra quota purchased ---
  @Column({ type: 'int', default: 0 })
  extraMsgCredits: number;

  @Column({ type: 'int', default: 0 })
  extraSuperLikeCredits: number;

  // --- Location ---
  @Column({ nullable: true, type: 'float' })
  latitude: number;

  @Column({ nullable: true, type: 'float' })
  longitude: number;

  @Column({ nullable: true, type: 'timestamp' })
  locationUpdatedAt: Date;

  // --- Timestamps ---
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  lastActiveAt: Date;
}
