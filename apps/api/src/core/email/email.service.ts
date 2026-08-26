import { EmailConfig, emailConfig } from '@app/config/email.config';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';
import {
  SendContactFormMessageInput,
  SendExistingAccountNoticeInput,
  SendMailInput,
  SendVerificationEmailInput,
} from './types/email.types';

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

@Injectable()
export class EmailService {
  private readonly resend?: Resend;
  private readonly fromAddress: string;

  constructor(
    @Inject(emailConfig.KEY) config: EmailConfig,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailService.name);
    this.fromAddress = config.fromAddress;

    if (config.resendApiKey === '') {
      this.logger.info({ event: 'email.resend_disabled' });
      return;
    }

    this.resend = new Resend(config.resendApiKey);
  }

  public async sendMail({ to, subject, html, replyTo }: SendMailInput): Promise<boolean> {
    if (!this.resend) {
      this.logger.debug({ event: 'email.noop_send', to, subject, hasApiKey: false });
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: [to],
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      });

      if (error) {
        this.logger.error({ event: 'email.send_failed', to, error: error.message });
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error({ event: 'email.send_failed', to, error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }

  public async sendVerificationEmail({ to, url }: SendVerificationEmailInput): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Verify your email address',
      html: `<p>Please verify your email address by clicking the link below.</p><p><a href="${url}">${url}</a></p>`,
    });
  }

  public async sendExistingAccountNotice({ to }: SendExistingAccountNoticeInput): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Someone tried to sign up with your email',
      html: "<p>Someone tried to create an account with this email address.</p><p>If it was you, sign in instead — or request a new verification link if you never confirmed your address.</p><p>If it wasn't you, you can safely ignore this message; no account was created and no password was changed.</p>",
    });
  }

  public async sendContactFormMessage({
    to,
    fromName,
    fromEmail,
    message,
  }: SendContactFormMessageInput): Promise<boolean> {
    const safeName = this.escapeHtml(fromName);
    const safeEmail = this.escapeHtml(fromEmail);
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br />');

    return this.sendMail({
      to,
      subject: `New contact form message from ${fromName}`,
      html: `<p><strong>From:</strong> ${safeName} (${safeEmail})</p><p>${safeMessage}</p>`,
      replyTo: fromEmail,
    });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
  }
}
