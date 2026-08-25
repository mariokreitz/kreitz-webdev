import { ICvDocumentRepository } from '@app/database/interfaces/cv-document.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { CvDocumentRecord } from '@app/database/types/cv-document.types';
import { CV_DOCUMENT_REPOSITORY } from '@app/modules/cv-document';
import { WEBSITE_REPOSITORY } from '@app/modules/website';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

const NO_CV_MESSAGE = 'No CV is available for this website';

@Injectable()
export class PublicCvService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(CV_DOCUMENT_REPOSITORY)
    private readonly cvDocumentRepository: ICvDocumentRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicCvService.name);
  }

  public async getCvForWebsite(websiteId: string): Promise<CvDocumentRecord> {
    const website = await this.websiteRepository.findById(websiteId);

    if (!website) {
      this.logger.warn({ event: 'public_cv.rejected', reason: 'website_not_found', websiteId });
      throw new NotFoundException(NO_CV_MESSAGE);
    }

    const cv = await this.cvDocumentRepository.findByUserId(website.userId);

    if (!cv) {
      this.logger.warn({ event: 'public_cv.rejected', reason: 'cv_not_found', websiteId });
      throw new NotFoundException(NO_CV_MESSAGE);
    }

    this.logger.info({ event: 'public_cv.downloaded', websiteId });

    return cv;
  }
}
