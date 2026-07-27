/** Fixed ActivityName keywords used across all *audit* tables */

export const LoginActivityName = {
  LOGIN_PHONE: 'LOGIN_PHONE',
  LOGIN_GOOGLE: 'LOGIN_GOOGLE',
  LOGIN_FACEBOOK: 'LOGIN_FACEBOOK',
  LOGIN_APPLE: 'LOGIN_APPLE',
  LOGIN_RESET_TOKEN: 'LOGIN_RESET_TOKEN',
} as const;

export type LoginActivityName =
  (typeof LoginActivityName)[keyof typeof LoginActivityName];

export const ReportActivityName = {
  REPORT_USER: 'REPORT_USER',
  REPORT_PHOTO: 'REPORT_PHOTO',
} as const;

export type ReportActivityName =
  (typeof ReportActivityName)[keyof typeof ReportActivityName];

export const AdminActivityName = {
  ADMIN_REPORT_DISMISS: 'ADMIN_REPORT_DISMISS',
  ADMIN_REPORT_WARN: 'ADMIN_REPORT_WARN',
  ADMIN_REPORT_REMOVE_PHOTO: 'ADMIN_REPORT_REMOVE_PHOTO',
  ADMIN_REPORT_BAN: 'ADMIN_REPORT_BAN',
  ADMIN_BAN_USER: 'ADMIN_BAN_USER',
  ADMIN_UNBAN_USER: 'ADMIN_UNBAN_USER',
  ADMIN_MAKE_ADMIN: 'ADMIN_MAKE_ADMIN',
  ADMIN_REMOVE_ADMIN: 'ADMIN_REMOVE_ADMIN',
  ADMIN_DELETE_USER: 'ADMIN_DELETE_USER',
  ADMIN_ADD_BAN: 'ADMIN_ADD_BAN',
  ADMIN_REMOVE_BAN: 'ADMIN_REMOVE_BAN',
  ADMIN_SEND_RESET_LINK: 'ADMIN_SEND_RESET_LINK',
  ADMIN_SEND_PUSH: 'ADMIN_SEND_PUSH',
  ADMIN_UPDATE_SELF: 'ADMIN_UPDATE_SELF',
} as const;

export type AdminActivityName =
  (typeof AdminActivityName)[keyof typeof AdminActivityName];

export const PaymentActivityName = {
  PAYMENT_SUBSCRIPTION: 'PAYMENT_SUBSCRIPTION',
  PAYMENT_COINS: 'PAYMENT_COINS',
  PAYMENT_SUBSCRIPTION_FAILED: 'PAYMENT_SUBSCRIPTION_FAILED',
  PAYMENT_COINS_FAILED: 'PAYMENT_COINS_FAILED',
} as const;

export type PaymentActivityName =
  (typeof PaymentActivityName)[keyof typeof PaymentActivityName];

export const AccountActivityName = {
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  ACCOUNT_DELETED_SELF: 'ACCOUNT_DELETED_SELF',
  ACCOUNT_DELETED_ADMIN: 'ACCOUNT_DELETED_ADMIN',
} as const;

export type AccountActivityName =
  (typeof AccountActivityName)[keyof typeof AccountActivityName];

export interface AuditWriteInput {
  forUser?: string | null;
  byUser?: string | null;
  activityName: string;
  affectedDataName?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  notes?: string | null;
}
