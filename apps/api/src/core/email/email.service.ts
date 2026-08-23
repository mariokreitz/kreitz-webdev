import { EmailConfig, emailConfig } from '@app/config/email.config';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';
import { SendExistingAccountNoticeInput, SendMailInput, SendVerificationEmailInput } from './types/email.types';

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

  public async sendMail({ to, subject, html }: SendMailInput): Promise<void> {
    if (!this.resend) {
      this.logger.debug({ event: 'email.noop_send', to, subject, hasApiKey: false });
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error({ event: 'email.send_failed', to, error: error.message });
      }
    } catch (err) {
      this.logger.error({ event: 'email.send_failed', to, error: err instanceof Error ? err.message : String(err) });
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
}
