import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      if (ENV.SMTP_USER && ENV.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: ENV.SMTP_HOST,
          port: ENV.SMTP_PORT,
          auth: {
            user: ENV.SMTP_USER,
            pass: ENV.SMTP_PASS
          }
        });
      }
    } catch (err) {
      console.warn('[EmailService] Failed to initialize SMTP transporter. Running in log-only mode.', err);
    }
  }

  public async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      if (!this.transporter) {
        console.warn('[EmailService] SMTP is not configured. Email was not sent.');
        return { success: false };
      }

      const info = await this.transporter.sendMail({
        from: `"${ENV.SMTP_FROM_NAME}" <${ENV.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        html: options.html
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return { success: false };
    }
  }

  public getWelcomeTemplate(name: string, orgName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to Nexus CRM!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your workspace <strong>${orgName}</strong> is ready. You can now manage leads, track deals, streamline contacts, and boost your sales productivity.</p>
        <div style="margin: 25px 0;">
          <a href="${ENV.CLIENT_URL}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Dashboard</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you have any questions, simply reply to this email.</p>
      </div>
    `;
  }

  public getLeadNotificationTemplate(leadName: string, company: string, source: string, value: number, currency: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #10b981;">🚀 New Lead Captured!</h3>
        <p>A new lead has been registered in the system:</p>
        <ul>
          <li><strong>Name:</strong> ${leadName}</li>
          <li><strong>Company:</strong> ${company || 'N/A'}</li>
          <li><strong>Source:</strong> ${source}</li>
          <li><strong>Estimated Value:</strong> ${currency} ${value.toLocaleString()}</li>
        </ul>
        <div style="margin: 20px 0;">
          <a href="${ENV.CLIENT_URL}/leads" style="background-color: #10b981; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Lead</a>
        </div>
      </div>
    `;
  }

  public getDealWonTemplate(dealTitle: string, value: number, currency: string, repName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px; background-color: #f0fdf4;">
        <h2 style="color: #15803d; margin-top: 0;">🎉 Deal Won Celebration!</h2>
        <p>Congratulations team! <strong>${repName}</strong> just closed a deal:</p>
        <p style="font-size: 18px; font-weight: bold; color: #166534;">"${dealTitle}" for ${currency} ${value.toLocaleString()}</p>
        <p>Keep up the amazing momentum!</p>
      </div>
    `;
  }
}

export const emailService = new EmailService();
