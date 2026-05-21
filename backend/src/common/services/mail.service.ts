import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,  // Google App Password
      },
    });
  }

  private async send(to: string | string[], subject: string, html: string): Promise<void> {
    if (!process.env.GMAIL_USER) {
      this.logger.warn(`[MAIL DEV] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"SugarBf" <${process.env.GMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  async sendPasswordResetLink(to: string, userName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.APP_DEEP_LINK || 'sugarbf'}://reset-password?token=${resetToken}`;
    const webUrl = `${process.env.WEB_BASE_URL || 'https://sugarbfapp.com'}/reset-password?token=${resetToken}`;

    await this.send(to, 'Reset your SugarBf access', `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0D0D0D;color:#fff;border-radius:12px">
        <h2 style="color:#C9184A">SugarBf 🌹</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>An administrator has requested a login reset link for your account.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#C9184A;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700">
            Reset My Access
          </a>
        </p>
        <p style="color:#606060;font-size:13px">Or open this URL in your browser:<br><a href="${webUrl}" style="color:#C9184A">${webUrl}</a></p>
        <p style="color:#606060;font-size:12px">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
      </div>
    `);
  }

  // ─── New User Alert to Admins ─────────────────────────────────────────────

  async sendNewUserAlertToAdmins(
    adminEmails: string[],
    user: {
      id: string; name: string; email: string; phone: string;
      role: string; city: string; country: string; createdAt: Date;
    },
  ): Promise<void> {
    if (!adminEmails.length) return;

    await this.send(adminEmails, `New User Joined: ${user.name}`, `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#0D0D0D;color:#fff;border-radius:12px">
        <h2 style="color:#C9184A">👤 New Member Joined SugarBf</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px;color:#A0A0A0;width:140px">User ID</td><td style="padding:8px;font-family:monospace;font-size:12px">${user.id}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Name</td><td style="padding:8px;font-weight:700">${user.name || '—'}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Email</td><td style="padding:8px">${user.email || '—'}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Phone</td><td style="padding:8px">${user.phone || '—'}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Role</td><td style="padding:8px">${user.role || '—'}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Location</td><td style="padding:8px">${user.city || '—'}, ${user.country || '—'}</td></tr>
          <tr><td style="padding:8px;color:#A0A0A0">Joined</td><td style="padding:8px">${new Date(user.createdAt).toLocaleString('en-IN')}</td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${process.env.ADMIN_WEB_URL || 'https://admin.sugarbfapp.com'}/users/${user.id}"
             style="background:#C9184A;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700">
            View in Admin Panel
          </a>
        </p>
      </div>
    `);
  }

  // ─── Marketing Email (future use) ─────────────────────────────────────────

  async sendMarketingEmail(to: string[], subject: string, body: string): Promise<void> {
    await this.send(to, subject, `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#0D0D0D;color:#fff;border-radius:12px">
        <h2 style="color:#C9184A">SugarBf 🌹</h2>
        ${body}
        <p style="color:#606060;font-size:11px;margin-top:32px">You are receiving this because you are a SugarBf member.<br>
        <a href="sugarbf://unsubscribe" style="color:#C9184A">Unsubscribe</a></p>
      </div>
    `);
  }

  // ─── Warning Email ────────────────────────────────────────────────────────

  async sendAccountWarning(to: string, userName: string, reason: string): Promise<void> {
    await this.send(to, '⚠️ Account Warning - SugarBf', `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0D0D0D;color:#fff;border-radius:12px">
        <h2 style="color:#FF9500">⚠️ Account Warning</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your SugarBf account has received an official warning.</p>
        <p style="background:#1A0800;padding:16px;border-radius:8px;border-left:4px solid #FF9500">${reason}</p>
        <p>Please review our <a href="${process.env.PRIVACY_URL || 'https://sugarbf.club/privacy'}" style="color:#C9184A">Community Guidelines</a>.
        Repeated violations may result in account suspension.</p>
      </div>
    `);
  }
}
