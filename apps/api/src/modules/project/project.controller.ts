import { ProjectService } from '@app/modules/project/project.service';
import { Controller, Get } from '@nestjs/common';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  public create(): string {
    return this.projectService.create();
  }
}
