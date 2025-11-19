import { Resend } from "resend";
import {
  createVerificationEmail,
  createPasswordResetEmail,
} from "./email-templates";

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

const FROM_EMAIL = `Mocah <${process.env.RESEND_FROM_EMAIL}>` || ``;
const APP_NAME = process.env.APP_NAME || "Mocah";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Reusable email service for sending emails via Resend
 */
export class EmailService {
  /**
   * Send a generic email
   */
  static async sendEmail({ to, subject, html, text }: SendEmailOptions) {
    try {
      const resendClient = getResendClient();
      const result = await resendClient.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      if (result.error) {
        console.error("Email sending error:", result.error);
        throw new Error(`Failed to send email: ${result.error.message}`);
      }

      return result;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail({
    user,
    url,
    token: _token,
  }: {
    user: { email: string; name?: string };
    url: string;
    token: string;
  }) {
    const html = createVerificationEmail({
      appName: APP_NAME,
      user,
      verificationUrl: url,
      expiresInHours: 24,
    });

    return this.sendEmail({
      to: user.email,
      subject: `Verify your ${APP_NAME} account`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail({
    user,
    url,
    token: _token,
  }: {
    user: { email: string; name?: string };
    url: string;
    token: string;
  }) {
    const html = createPasswordResetEmail({
      appName: APP_NAME,
      user,
      resetUrl: url,
      expiresInHours: 1,
    });

    return this.sendEmail({
      to: user.email,
      subject: `Reset your ${APP_NAME} password`,
      html,
    });
  }

  /**
   * Convert HTML to plain text (simple implementation)
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
