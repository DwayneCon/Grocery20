/* server/src/services/emailService.ts */
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

// Resolve the templates directory relative to the project root.
// Uses process.cwd() as a stable base, avoiding import.meta.url
// which causes issues in CJS test environments (e.g. Jest with ts-jest).
const _templatesBase = path.resolve(process.cwd(), 'src', 'templates', 'emails');

interface EmailOptions {
  to: string;
  subject: string;
  template: 'welcome' | 'tips-day3' | 'weekly-summary-invite' | 'password-reset';
  variables: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️ Email service not configured. Set SMTP environment variables.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Email service connection failed:', error);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  /**
   * Load HTML template and replace variables
   */
  private loadTemplate(templateName: string, variables: Record<string, any>): string {
    const templatePath = path.join(
      _templatesBase,
      `${templateName}.html`
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key] || '');
    });

    return html;
  }

  /**
   * Send email using template
   */
  public async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not available. Skipping email send.');
      return false;
    }

    try {
      const html = this.loadTemplate(options.template, options.variables);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Grocery20" <noreply@grocery.dwaynecon.com>',
        to: options.to,
        subject: options.subject,
        html,
      });

      console.log(`✅ Email sent: ${options.template} to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email (Day 0)
   */
  public async sendWelcomeEmail(userEmail: string, userName: string) {
    return this.send({
      to: userEmail,
      subject: '🎉 Welcome to Grocery20 - Your AI Meal Planning Journey Starts Now!',
      template: 'welcome',
      variables: {
        userName,
        appUrl: process.env.APP_URL || 'https://grocery.dwaynecon.com',
      },
    });
  }

  /**
   * Send tips & tricks email (Day 3)
   */
  public async sendTipsEmail(userEmail: string, userName: string) {
    return this.send({
      to: userEmail,
      subject: '💡 Pro Tips to Master Grocery20',
      template: 'tips-day3',
      variables: {
        userName,
        appUrl: process.env.APP_URL || 'https://grocery.dwaynecon.com',
      },
    });
  }

  /**
   * Send weekly summary invite (Day 7)
   */
  public async sendWeeklySummaryEmail(
    userEmail: string,
    userName: string,
    stats: {
      mealsPlanned: number;
      streakDays: number;
      savedAmount: number;
      recipesTried: number;
      percentUnderBudget: number;
      topMeal: string;
      totalInteractions: number;
    }
  ) {
    return this.send({
      to: userEmail,
      subject: '📊 Your Amazing Week in Review - Grocery20',
      template: 'weekly-summary-invite',
      variables: {
        userName,
        ...stats,
        appUrl: process.env.APP_URL || 'https://grocery.dwaynecon.com',
      },
    });
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string
  ): Promise<boolean> {
    const baseUrl = config.cors.allowedOrigins[0] || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    return this.send({
      to,
      subject: 'Reset Your Password - Grocery20',
      template: 'password-reset',
      variables: {
        name,
        resetUrl,
      },
    });
  }

  /**
   * Schedule onboarding email sequence
   * Called when user signs up
   */
  public async scheduleOnboardingSequence(userEmail: string, userName: string) {
    // Day 0: Welcome email (send immediately)
    await this.sendWelcomeEmail(userEmail, userName);

    // TODO: Use a job queue (Bull, BullMQ, or node-cron) to schedule:
    // - Day 3: Tips & Tricks email
    // - Day 7: Weekly Summary email

    // For now, log the schedule
    console.log(`📅 Onboarding sequence scheduled for ${userEmail}`);
    console.log('  - Day 0: Welcome email ✅ (sent)');
    console.log('  - Day 3: Tips & tricks email ⏰');
    console.log('  - Day 7: Weekly summary invite ⏰');
  }
}

// Singleton instance
const emailService = new EmailService();

export default emailService;
