import type { UpdateProjectData } from '@app/database/types/project.types';
import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  public toUpdateProjectData(): UpdateProjectData {
    return {
      ...(this.name !== undefined && { name: this.name }),
      ...(this.description !== undefined && { description: this.description }),
      ...(this.repoUrl !== undefined && { repoUrl: this.repoUrl }),
      ...(this.liveUrl !== undefined && { liveUrl: this.liveUrl }),
      ...(this.tags !== undefined && { tags: this.tags }),
      ...(this.imageUrl !== undefined && { imageUrl: this.imageUrl }),
      ...(this.githubId !== undefined && { githubId: this.githubId }),
      ...(this.githubOwner !== undefined && { githubOwner: this.githubOwner }),
      ...(this.githubRepo !== undefined && { githubRepo: this.githubRepo }),
    };
  }
}
