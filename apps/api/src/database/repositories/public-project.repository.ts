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
      include: {
        project: true,
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
        url: record.project.url,
        imageUrl: record.project.imageUrl,
        githubOwner: record.project.githubOwner,
        githubRepo: record.project.githubRepo,
        sortOrder: record.sortOrder,
      }),
    );
  }
}
