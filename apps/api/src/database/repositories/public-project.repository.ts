import { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { PublicProjectRecord } from '@app/database/types/public-project.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicProjectRepository implements IPublicProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findPublishedByWebsiteId(websiteId: string): Promise<PublicProjectRecord[]> {
    const records = await this.prisma.websiteProject.findMany({
      where: {
        websiteId,
        published: true,
      },
      select: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            repoUrl: true,
            liveUrl: true,
            tags: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return records.map(
      (record): PublicProjectRecord => ({
        id: record.project.id,
        name: record.project.name,
        description: record.project.description,
        repoUrl: record.project.repoUrl,
        liveUrl: record.project.liveUrl,
        tags: record.project.tags,
        imageUrl: record.project.imageUrl,
      }),
    );
  }
}
