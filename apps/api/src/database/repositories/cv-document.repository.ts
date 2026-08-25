import { ICvDocumentRepository } from '@app/database/interfaces/cv-document.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CvDocumentMeta, CvDocumentRecord, UpsertCvDocumentData } from '@app/database/types/cv-document.types';
import { Injectable } from '@nestjs/common';

interface CvDocumentRow {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Uint8Array;
  uploadedAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CvDocumentRepository implements ICvDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findByUserId(userId: string): Promise<CvDocumentRecord | null> {
    const record = await this.prisma.cvDocument.findUnique({ where: { userId } });

    return record ? this.toRecord(record) : null;
  }

  public async findMetaByUserId(userId: string): Promise<CvDocumentMeta | null> {
    return await this.prisma.cvDocument.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        uploadedAt: true,
        updatedAt: true,
      },
    });
  }

  public async upsert(input: UpsertCvDocumentData): Promise<CvDocumentRecord> {
    const record = await this.prisma.cvDocument.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        // WHY: Prisma's Bytes input type is Uint8Array<ArrayBuffer>, while Buffer is typed Uint8Array<ArrayBufferLike> — Uint8Array.from() copies into a fresh, plain ArrayBuffer-backed view to satisfy that.
        data: Uint8Array.from(input.data),
      },
      update: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        // WHY: Prisma's Bytes input type is Uint8Array<ArrayBuffer>, while Buffer is typed Uint8Array<ArrayBufferLike> — Uint8Array.from() copies into a fresh, plain ArrayBuffer-backed view to satisfy that.
        data: Uint8Array.from(input.data),
      },
    });

    return this.toRecord(record);
  }

  public async delete(userId: string): Promise<boolean> {
    const result = await this.prisma.cvDocument.deleteMany({ where: { userId } });

    return result.count > 0;
  }

  private toRecord(record: CvDocumentRow): CvDocumentRecord {
    return { ...record, data: Buffer.from(record.data) };
  }
}
