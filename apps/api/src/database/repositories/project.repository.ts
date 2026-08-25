import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolationOn } from '../utils/unique-violation';

const USER_GITHUB_UNIQUE_FIELDS = ['userId', 'githubId'] as const;

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

  public async findRepoUrlsByUserId(userId: string): Promise<Pick<ProjectRecord, 'id' | 'repoUrl'>[]> {
    return await this.prisma.project.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        repoUrl: true,
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
    try {
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

          ...(data.repoUrl !== undefined && {
            repoUrl: data.repoUrl,
          }),

          ...(data.liveUrl !== undefined && {
            liveUrl: data.liveUrl,
          }),

          ...(data.tags !== undefined && {
            tags: data.tags,
          }),

          ...(data.imageUrl !== undefined && {
            imageUrl: data.imageUrl,
          }),

          ...(data.category !== undefined && {
            category: data.category,
          }),

          ...(data.githubStars !== undefined && {
            githubStars: data.githubStars,
          }),

          ...(data.githubCreatedAt !== undefined && {
            githubCreatedAt: data.githubCreatedAt,
          }),

          ...(data.githubUpdatedAt !== undefined && {
            githubUpdatedAt: data.githubUpdatedAt,
          }),

          ...(data.lastSyncedAt !== undefined && {
            lastSyncedAt: data.lastSyncedAt,
          }),
        },
      });
    } catch (error) {
      if (isUniqueViolationOn(error, USER_GITHUB_UNIQUE_FIELDS)) {
        throw new ConflictException('This GitHub project is already imported');
      }

      throw error;
    }
  }

  public async update(id: string, userId: string, data: UpdateProjectData): Promise<ProjectRecord | null> {
    try {
      const result = await this.prisma.project.updateMany({
        where: {
          id,
          userId,
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

          ...(data.repoUrl !== undefined && {
            repoUrl: data.repoUrl,
          }),

          ...(data.liveUrl !== undefined && {
            liveUrl: data.liveUrl,
          }),

          ...(data.tags !== undefined && {
            tags: data.tags,
          }),

          ...(data.imageUrl !== undefined && {
            imageUrl: data.imageUrl,
          }),

          ...(data.category !== undefined && {
            category: data.category,
          }),

          ...(data.githubStars !== undefined && {
            githubStars: data.githubStars,
          }),

          ...(data.githubCreatedAt !== undefined && {
            githubCreatedAt: data.githubCreatedAt,
          }),

          ...(data.githubUpdatedAt !== undefined && {
            githubUpdatedAt: data.githubUpdatedAt,
          }),

          ...(data.lastSyncedAt !== undefined && {
            lastSyncedAt: data.lastSyncedAt,
          }),
        },
      });

      if (result.count === 0) {
        return null;
      }

      return await this.findByIdAndUserId(id, userId);
    } catch (error) {
      if (isUniqueViolationOn(error, USER_GITHUB_UNIQUE_FIELDS)) {
        throw new ConflictException('This GitHub project is already imported');
      }

      throw error;
    }
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.project.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  }
}
