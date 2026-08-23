import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { IWebsiteProjectRepository } from '@app/database/interfaces/website-project.repository.interface';
import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import {
  UpdateWebsiteProjectData,
  WebsiteProjectRecord,
  WebsiteProjectWithProjectRecord,
} from '@app/database/types/website-project.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PROJECT_REPOSITORY } from '../project/tokens/project.tokens';
import { WEBSITE_REPOSITORY } from '../website/tokens/website.tokens';
import { WEBSITE_PROJECT_REPOSITORY } from './tokens/website-project.tokens';

@Injectable()
export class WebsiteProjectService {
  constructor(
    @Inject(WEBSITE_REPOSITORY)
    private readonly websiteRepository: IWebsiteRepository,

    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,

    @Inject(WEBSITE_PROJECT_REPOSITORY)
    private readonly websiteProjectRepository: IWebsiteProjectRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebsiteProjectService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<WebsiteProjectWithProjectRecord[]> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    return this.websiteProjectRepository.findManyByWebsiteId(websiteId);
  }

  public async create(
    websiteId: string,
    userId: string,
    projectId: string,
    published: boolean | undefined,
    sortOrder: number | undefined,
  ): Promise<WebsiteProjectRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);
    await this.ensureProjectOwnership(projectId, userId);

    const existingLink = await this.websiteProjectRepository.findByWebsiteAndProject(websiteId, projectId);

    if (existingLink) {
      throw new ConflictException('This project is already linked to this website');
    }

    const created = await this.websiteProjectRepository.create({
      websiteId,
      projectId,

      ...(published !== undefined && { published }),
      ...(sortOrder !== undefined && { sortOrder }),
    });

    this.logger.info({ event: 'website_project.created', websiteId, projectId: created.projectId });

    return created;
  }

  public async update(
    websiteId: string,
    projectId: string,
    userId: string,
    data: UpdateWebsiteProjectData,
  ): Promise<WebsiteProjectRecord> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const existingLink = await this.websiteProjectRepository.findByWebsiteAndProject(websiteId, projectId);

    if (!existingLink) {
      throw new NotFoundException('Website project not found');
    }

    const updated = await this.websiteProjectRepository.update(existingLink.id, websiteId, data);

    if (!updated) {
      throw new NotFoundException('Website project not found');
    }

    this.logger.info({ event: 'website_project.updated', websiteId, projectId });

    return updated;
  }

  public async delete(websiteId: string, projectId: string, userId: string): Promise<void> {
    await this.ensureWebsiteOwnership(websiteId, userId);

    const existingLink = await this.websiteProjectRepository.findByWebsiteAndProject(websiteId, projectId);

    if (!existingLink) {
      throw new NotFoundException('Website project not found');
    }

    const deleted = await this.websiteProjectRepository.delete(existingLink.id, websiteId);

    if (!deleted) {
      throw new NotFoundException('Website project not found');
    }

    this.logger.info({ event: 'website_project.deleted', websiteId, projectId });
  }

  private async ensureWebsiteOwnership(websiteId: string, userId: string): Promise<void> {
    const website = await this.websiteRepository.findByIdAndUserId(websiteId, userId);

    if (!website) {
      throw new NotFoundException('Website not found');
    }
  }

  private async ensureProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findByIdAndUserId(projectId, userId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
