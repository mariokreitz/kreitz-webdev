import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findManyByUserId(userId: string): Promise<ProjectRecord[]> {
    return await this.prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  public async findById(id: string): Promise<ProjectRecord | null> {
    return await this.prisma.project.findUnique({
      where: {
        id,
      },
    });
  }

  public async findByIdAndUserId(id: string, userId: string): Promise<ProjectRecord | null> {
    return await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  public async findByGithubId(githubId: string, userId: string): Promise<ProjectRecord | null> {
    return await this.prisma.project.findFirst({
      where: {
        githubId,
        userId,
      },
    });
  }

  public async create(data: CreateProjectData): Promise<ProjectRecord> {
    return await this.prisma.project.create({
      data: {
        userId: data.userId,

        ...(data.githubId !== undefined && {
          githubId: data.githubId,
        }),

        ...(data.githubOwner !== undefined && {
          githubOwner: data.githubOwner,
        }),

        ...(data.githubRepo !== undefined && {
          githubRepo: data.githubRepo,
        }),

        name: data.name,

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.url !== undefined && {
          url: data.url,
        }),

        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl,
        }),
      },
    });
  }

  public async update(id: string, userId: string, data: UpdateProjectData): Promise<ProjectRecord | null> {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return null;
    }

    return await this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...(data.githubId !== undefined && {
          githubId: data.githubId,
        }),

        ...(data.githubOwner !== undefined && {
          githubOwner: data.githubOwner,
        }),

        ...(data.githubRepo !== undefined && {
          githubRepo: data.githubRepo,
        }),

        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.url !== undefined && {
          url: data.url,
        }),

        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl,
        }),
      },
    });
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const existingProject = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return false;
    }

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    return true;
  }
}
