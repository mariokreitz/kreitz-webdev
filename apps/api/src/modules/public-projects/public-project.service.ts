import { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import { PublicProjectDto } from '@app/modules/public-projects/dto/public-project.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Injectable()
export class PublicProjectService {
  constructor(
    @Inject(PUBLIC_PROJECT_REPOSITORY)
    private readonly publicProjectRepository: IPublicProjectRepository,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicProjectService.name);
  }

  public async getPublishedProjects(websiteId: string): Promise<PublicProjectDto[]> {
    const records = await this.publicProjectRepository.findPublishedByWebsiteId(websiteId);

    const projects = records.map((record): PublicProjectDto => PublicProjectDto.fromRecord(record));

    this.logger.info({ event: 'public_project.listed', websiteId, count: projects.length });

    return projects;
  }
}
