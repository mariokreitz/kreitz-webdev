import { CvDocumentRepository } from '@app/database/repositories/cv-document.repository';
import { Module } from '@nestjs/common';

import { CvDocumentController } from './cv-document.controller';
import { CvDocumentService } from './cv-document.service';
import { CV_DOCUMENT_REPOSITORY } from './tokens/cv-document.tokens';

@Module({
  controllers: [CvDocumentController],
  providers: [
    CvDocumentService,

    {
      provide: CV_DOCUMENT_REPOSITORY,
      useClass: CvDocumentRepository,
    },
  ],
  exports: [CvDocumentService, CV_DOCUMENT_REPOSITORY],
})
export class CvDocumentModule {}
