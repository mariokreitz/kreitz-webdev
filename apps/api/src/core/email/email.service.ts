import { EmailConfig, emailConfig } from '@app/config/email.config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { SendMailInput, SendVerificationEmailInput } from './types/email.types';

@Injectable()
export class EmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  private readonly resend?: Resend;
  private readonly fromAddress: string;

  constructor(@Inject(emailConfig.KEY) config: EmailConfig) {
    this.fromAddress = config.fromAddress;

    if (config.resendApiKey === '') {
      this.logger.warn('RESEND_API_KEY is not set; emails will be logged instead of sent.');
      return;
    }

    this.resend = new Resend(config.resendApiKey);
  }

  public async sendMail({ to, subject, html }: SendMailInput): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`No-op email send (no RESEND_API_KEY) — to=${to} subject="${subject}" html=${html}`);
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
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      }
    } catch (err) {
      this.logger.error(`Unexpected error sending email to ${to}`, err instanceof Error ? err.stack : undefined);
    }
  }

  public async sendVerificationEmail({ to, url }: SendVerificationEmailInput): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Verify your email address',
      html: `<p>Please verify your email address by clicking the link below.</p><p><a href="${url}">${url}</a></p>`,
    });
  }
}
