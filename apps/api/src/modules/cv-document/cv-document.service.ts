import { ICvDocumentRepository } from '@app/database/interfaces/cv-document.repository.interface';
import { CvDocumentRecord, CvDocumentMeta } from '@app/database/types/cv-document.types';
import { CV_MAX_FILE_SIZE_BYTES, CV_MIME_TYPE } from '@app/modules/cv-document/constants/cv-document.constants';
import { sanitizeCvFileName } from '@app/modules/cv-document/utils/sanitize-cv-file-name';
import { hasPdfSignature } from '@app/modules/cv-document/utils/pdf-signature';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CV_DOCUMENT_REPOSITORY } from './tokens/cv-document.tokens';

@Injectable()
export class CvDocumentService {
  constructor(
    @Inject(CV_DOCUMENT_REPOSITORY)
    private readonly cvDocumentRepository: ICvDocumentRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CvDocumentService.name);
  }

  public async getStatus(userId: string): Promise<CvDocumentMeta | null> {
    return this.cvDocumentRepository.findMetaByUserId(userId);
  }

  public async upload(userId: string, file: Express.Multer.File | undefined): Promise<CvDocumentRecord> {
    if (!file) {
      this.logger.warn({ event: 'cv_document.rejected', reason: 'missing_file', userId });
      throw new BadRequestException('A PDF file is required');
    }

    // WHY: multer's own `limits.fileSize` is deliberately set higher than this — it's a hard backstop against abuse, while this check is the real, user-facing size cap (giving a clean 400 instead of multer's 413).
    if (file.size > CV_MAX_FILE_SIZE_BYTES) {
      this.logger.warn({ event: 'cv_document.rejected', reason: 'file_too_large', userId, sizeBytes: file.size });
      throw new BadRequestException(`File exceeds the maximum size of ${CV_MAX_FILE_SIZE_BYTES} bytes`);
    }

    if (!hasPdfSignature(file.buffer)) {
      this.logger.warn({ event: 'cv_document.rejected', reason: 'invalid_pdf_signature', userId });
      throw new BadRequestException('The uploaded file is not a valid PDF');
    }

    const record = await this.cvDocumentRepository.upsert({
      userId,
      fileName: sanitizeCvFileName(file.originalname),
      mimeType: CV_MIME_TYPE,
      sizeBytes: file.size,
      data: file.buffer,
    });

    this.logger.info({ event: 'cv_document.uploaded', userId, sizeBytes: record.sizeBytes });

    return record;
  }

  public async remove(userId: string): Promise<void> {
    const deleted = await this.cvDocumentRepository.delete(userId);

    if (!deleted) {
      this.logger.warn({ event: 'cv_document.rejected', reason: 'not_found', userId });
      throw new NotFoundException('No CV is currently uploaded');
    }

    this.logger.info({ event: 'cv_document.deleted', userId });
  }
}
