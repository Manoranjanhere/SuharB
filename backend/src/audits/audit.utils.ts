import { Request } from 'express';

/** Best-effort client IP (works behind ALB/nginx when trust proxy is on). */
export function getClientIp(req?: Request | null): string | null {
  if (!req) return null;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

export function buildAdminProfileLink(userId: string): string {
  const base =
    process.env.ADMIN_WEB_URL ||
    process.env.WEB_BASE_URL ||
    'https://admin.sugarbfapp.com';
  return `${base.replace(/\/$/, '')}/users/${userId}`;
}
