import { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import { PublicProjectDto } from '@app/modules/public-projects/dto/public-project.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Injectable()
export class PublicProjectService {
  constructor(
    @Inject(PUBLIC_PROJECT_REPOSITORY)
    private readonly publicProjectRepository: IPublicProjectRepository,
  ) {}

  public async getPublishedProjects(websiteId: string): Promise<PublicProjectDto[]> {
    const records = await this.publicProjectRepository.findPublishedByWebsiteId(websiteId);

    return records.map(
      (record): PublicProjectDto => ({
        id: record.id,
        name: record.name,
        description: record.description,
        repoUrl: record.repoUrl,
        liveUrl: record.liveUrl,
        tags: record.tags,
        imageUrl: record.imageUrl,
      }),
    );
  }
}
