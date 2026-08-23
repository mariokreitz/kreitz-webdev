import { PrismaService } from '@app/database/prisma';
import { Injectable } from '@nestjs/common';

import { IWebsiteProjectRepository } from '../interfaces/website-project.repository.interface';

import {
  CreateWebsiteProjectData,
  UpdateWebsiteProjectData,
  WebsiteProjectRecord,
  WebsiteProjectWithProjectRecord,
} from '../types/website-project.types';

@Injectable()
export class WebsiteProjectRepository implements IWebsiteProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<WebsiteProjectRecord | null> {
    return this.prisma.websiteProject.findUnique({
      where: {
        id,
      },
    });
  }

  public async findByWebsiteAndProject(websiteId: string, projectId: string): Promise<WebsiteProjectRecord | null> {
    return this.prisma.websiteProject.findUnique({
      where: {
        websiteId_projectId: {
          websiteId,
          projectId,
        },
      },
    });
  }

  public async findManyByWebsiteId(websiteId: string): Promise<WebsiteProjectWithProjectRecord[]> {
    return this.prisma.websiteProject.findMany({
      where: {
        websiteId,
      },
      include: {
        project: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  public async findWebsiteIdsByProjectId(projectId: string): Promise<string[]> {
    const links = await this.prisma.websiteProject.findMany({
      where: {
        projectId,
      },
      select: {
        websiteId: true,
      },
    });

    return links.map((link) => link.websiteId);
  }

  public async create(data: CreateWebsiteProjectData): Promise<WebsiteProjectRecord> {
    return this.prisma.websiteProject.create({
      data: {
        websiteId: data.websiteId,
        projectId: data.projectId,

        ...(data.published !== undefined && {
          published: data.published,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder,
        }),
      },
    });
  }

  public async update(
    id: string,
    websiteId: string,
    data: UpdateWebsiteProjectData,
  ): Promise<WebsiteProjectRecord | null> {
    const result = await this.prisma.websiteProject.updateMany({
      where: {
        id,
        websiteId,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }

  public async delete(id: string, websiteId: string): Promise<boolean> {
    const result = await this.prisma.websiteProject.deleteMany({
      where: {
        id,
        websiteId,
      },
    });

    return result.count > 0;
  }
}
