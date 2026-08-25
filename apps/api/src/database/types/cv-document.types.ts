export interface CvDocumentRecord {
  id: string;
  userId: string;

  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;

  uploadedAt: Date;
  updatedAt: Date;
}

export type CvDocumentMeta = Omit<CvDocumentRecord, 'data'>;

export interface UpsertCvDocumentData {
  userId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
}
