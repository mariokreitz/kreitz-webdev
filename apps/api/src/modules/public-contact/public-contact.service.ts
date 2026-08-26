import { IUserRepository } from '@app/database/interfaces/user.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { EmailService } from '@app/core/email';
import { WEBSITE_REPOSITORY } from '@app/modules/website';
import { Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { USER_REPOSITORY } from './tokens/public-contact.tokens';
import { SubmitContactFormInput } from './types/public-contact.types';

@Injectable()
export class PublicContactService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    private readonly emailService: EmailService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicContactService.name);
  }

  public async submit(websiteId: string, input: SubmitContactFormInput): Promise<void> {
    const website = await this.websiteRepository.findById(websiteId);

    if (!website) {
      this.logger.warn({ event: 'public_contact.rejected', reason: 'website_not_found', websiteId });

      throw new NotFoundException('Website not found');
    }

    const recipient = website.contactEmail ?? (await this.resolveOwnerEmail(website.userId, websiteId));

    const sent = await this.emailService.sendContactFormMessage({
      to: recipient,
      fromName: input.name,
      fromEmail: input.email,
      message: input.message,
    });

    if (!sent) {
      this.logger.warn({ event: 'public_contact.send_failed', websiteId });

      throw new ServiceUnavailableException('Failed to send your message. Please try again later.');
    }

    this.logger.info({ event: 'public_contact.submitted', websiteId });
  }

  private async resolveOwnerEmail(userId: string, websiteId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn({ event: 'public_contact.rejected', reason: 'owner_not_found', websiteId, userId });

      throw new NotFoundException('Website owner not found');
    }

    return user.email;
  }
}
