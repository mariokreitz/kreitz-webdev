import type { CvDocumentMeta, CvDocumentRecord, UpsertCvDocumentData } from '@app/database/types/cv-document.types';

export interface ICvDocumentRepository {
  findByUserId: (userId: string) => Promise<CvDocumentRecord | null>;

  findMetaByUserId: (userId: string) => Promise<CvDocumentMeta | null>;

  upsert: (data: UpsertCvDocumentData) => Promise<CvDocumentRecord>;

  delete: (userId: string) => Promise<boolean>;
}
