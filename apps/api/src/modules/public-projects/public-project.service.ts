import { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import { PublicProjectRecord } from '@app/database/types/public-project.types';
import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Injectable()
export class PublicProjectService {
  constructor(
    @Inject(PUBLIC_PROJECT_REPOSITORY)
    private readonly publicProjectRepository: IPublicProjectRepository,
  ) {}

  public async getPublishedProjects(websiteId: string): Promise<PublicProjectRecord[]> {
    return this.publicProjectRepository.findPublishedByWebsiteId(websiteId);
  }
}
