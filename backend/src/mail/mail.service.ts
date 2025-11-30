import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get('SMTP_USER', '');
    const smtpPass = this.configService.get('SMTP_PASS', '');

    const transportConfig: any = {
      host: this.configService.get('SMTP_HOST', 'mailhog'),
      port: this.configService.get('SMTP_PORT', 1025),
      secure: false,
    };

    // Only add auth if credentials are provided (MailHog doesn't need auth)
    if (smtpUser && smtpPass) {
      transportConfig.auth = {
        user: smtpUser,
        pass: smtpPass,
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async sendConfirmationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const confirmUrl = `${frontendUrl}/confirm-email.html?token=${token}`;

    await this.transporter.sendMail({
      from: '"MaxDate" <noreply@maxdate.ru>',
      to: email,
      subject: 'Подтверждение регистрации на MaxDate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e91e63;">MaxDate</h1>
          <h2>Подтверждение email</h2>
          <p>Благодарим за регистрацию на MaxDate!</p>
          <p>Для подтверждения вашего email перейдите по ссылке:</p>
          <a href="${confirmUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #e91e63; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Подтвердить email
          </a>
          <p style="color: #666; font-size: 14px;">
            Если вы не регистрировались на MaxDate, проигнорируйте это письмо.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password.html?token=${token}`;

    await this.transporter.sendMail({
      from: '"MaxDate" <noreply@maxdate.ru>',
      to: email,
      subject: 'Сброс пароля на MaxDate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e91e63;">MaxDate</h1>
          <h2>Сброс пароля</h2>
          <p>Вы запросили сброс пароля для вашего аккаунта MaxDate.</p>
          <p>Для сброса пароля перейдите по ссылке:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #e91e63; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Сбросить пароль
          </a>
          <p style="color: #666; font-size: 14px;">
            Ссылка действительна в течение 1 часа.
          </p>
          <p style="color: #666; font-size: 14px;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
          </p>
        </div>
      `,
    });
  }

  async sendMatchNotification(
    email: string,
    matchName: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    await this.transporter.sendMail({
      from: '"MaxDate" <noreply@maxdate.ru>',
      to: email,
      subject: 'У вас новый мэтч на MaxDate!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e91e63;">MaxDate</h1>
          <h2>Взаимный лайк!</h2>
          <p>Отличные новости! Вы понравились пользователю <strong>${matchName}</strong>, 
             и он понравился вам!</p>
          <p>Теперь вы можете начать общение.</p>
          <a href="${frontendUrl}/matches.html" 
             style="display: inline-block; padding: 12px 24px; background-color: #e91e63; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Посмотреть мэтчи
          </a>
        </div>
      `,
    });
  }
}

